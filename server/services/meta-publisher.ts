import { storage } from "../storage";
import type { SocialAccount, SocialPost } from "@shared/schema";
import fs from "fs";
import path from "path";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

interface MetaPublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
}

export class MetaPublisherService {
  private appId: string;
  private appSecret: string;
  public baseUrl: string = "";

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || "";
    this.appSecret = process.env.FACEBOOK_APP_SECRET || "";
  }

  getOAuthUrl(redirectUri: string, state: string): string {
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_read_user_content",
      "business_management",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${encodeURIComponent(state)}&response_type=code&auth_type=rerequest`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{ accessToken: string; expiresIn: number }> {
    const url = `${GRAPH_API_BASE}/oauth/access_token?client_id=${this.appId}&client_secret=${this.appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;

    const res = await fetch(url);
    const data = await res.json() as any;

    if (data.error) {
      throw new Error(data.error.message || "Failed to exchange code for token");
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000,
    };
  }

  async getLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const url = `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortLivedToken}`;

    const res = await fetch(url);
    const data = await res.json() as any;

    if (data.error) {
      throw new Error(data.error.message || "Failed to get long-lived token");
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000,
    };
  }

  async checkPermissions(userAccessToken: string): Promise<{ granted: string[]; declined: string[] }> {
    const permUrl = `${GRAPH_API_BASE}/me/permissions?access_token=${userAccessToken}`;
    try {
      const permRes = await fetch(permUrl);
      const permData = await permRes.json() as any;
      const granted = (permData.data || [])
        .filter((p: any) => p.status === "granted")
        .map((p: any) => p.permission);
      const declined = (permData.data || [])
        .filter((p: any) => p.status === "declined")
        .map((p: any) => p.permission);
      console.log(`[META OAUTH] Granted permissions: ${granted.join(", ")}`);
      if (declined.length > 0) {
        console.log(`[META OAUTH] Declined permissions: ${declined.join(", ")}`);
      }
      return { granted, declined };
    } catch (e: any) {
      console.log(`[META OAUTH] Could not check permissions: ${e.message}`);
      return { granted: [], declined: [] };
    }
  }

  async getUserPages(userAccessToken: string): Promise<MetaPageInfo[]> {
    const url = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,picture,instagram_business_account&access_token=${userAccessToken}`;

    const res = await fetch(url);
    const data = await res.json() as any;

    console.log(`[META OAUTH] /me/accounts response status=${res.status}, pages=${data.data?.length || 0}, error=${JSON.stringify(data.error || null)}`);

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch pages");
    }

    let pages: MetaPageInfo[] = data.data || [];

    if (pages.length === 0) {
      console.log("[META OAUTH] 0 pages from /me/accounts, trying fallback strategies...");

      // Strategy 1: Try /me/accounts with minimal fields (instagram_business_account field can cause empty results)
      try {
        const simpleRes = await fetch(`${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);
        const simpleData = await simpleRes.json() as any;
        console.log(`[META OAUTH] Strategy 1 (simple fields): pages=${simpleData.data?.length || 0}, error=${JSON.stringify(simpleData.error || null)}`);
        if (simpleData.data && simpleData.data.length > 0) {
          pages = simpleData.data;
        }
      } catch (e: any) {
        console.log(`[META OAUTH] Strategy 1 failed: ${e.message}`);
      }

      // Strategy 2: Try /me/businesses -> /{biz}/owned_pages
      if (pages.length === 0) {
        try {
          const bizRes = await fetch(`${GRAPH_API_BASE}/me/businesses?access_token=${userAccessToken}`);
          const bizData = await bizRes.json() as any;
          const businesses = bizData.data || [];
          console.log(`[META OAUTH] Strategy 2 (businesses): found ${businesses.length} business(es), error=${JSON.stringify(bizData.error || null)}`);

          for (const biz of businesses) {
            const pagesRes = await fetch(`${GRAPH_API_BASE}/${biz.id}/owned_pages?fields=id,name,access_token,category,picture,instagram_business_account&access_token=${userAccessToken}`);
            const pagesData = await pagesRes.json() as any;
            console.log(`[META OAUTH] Business ${biz.id} (${biz.name}): pages=${pagesData.data?.length || 0}, error=${JSON.stringify(pagesData.error || null)}`);
            if (pagesData.data && pagesData.data.length > 0) {
              pages = [...pages, ...pagesData.data];
            }
          }
        } catch (e: any) {
          console.log(`[META OAUTH] Strategy 2 failed: ${e.message}`);
        }
      }

      // Strategy 3: Try /me?fields=accounts to get pages via user node
      if (pages.length === 0) {
        try {
          const meRes = await fetch(`${GRAPH_API_BASE}/me?fields=id,name,accounts{id,name,access_token,category,picture,instagram_business_account}&access_token=${userAccessToken}`);
          const meData = await meRes.json() as any;
          const accts = meData.accounts?.data || [];
          console.log(`[META OAUTH] Strategy 3 (/me?fields=accounts): pages=${accts.length}, userId=${meData.id}, userName=${meData.name}, error=${JSON.stringify(meData.error || null)}`);
          if (accts.length > 0) {
            pages = accts;
          }
        } catch (e: any) {
          console.log(`[META OAUTH] Strategy 3 failed: ${e.message}`);
        }
      }

      // Strategy 4: Check user debug info to understand token
      if (pages.length === 0) {
        try {
          const debugRes = await fetch(`${GRAPH_API_BASE}/debug_token?input_token=${userAccessToken}&access_token=${this.appId}|${this.appSecret}`);
          const debugData = await debugRes.json() as any;
          const tokenData = debugData.data || {};
          console.log(`[META OAUTH] Token debug: type=${tokenData.type}, app_id=${tokenData.app_id}, user_id=${tokenData.user_id}, scopes=${JSON.stringify(tokenData.scopes)}, granular_scopes=${JSON.stringify(tokenData.granular_scopes)}`);
        } catch (e: any) {
          console.log(`[META OAUTH] Token debug failed: ${e.message}`);
        }
      }

      console.log(`[META OAUTH] Final result after all strategies: ${pages.length} page(s)`);
    }

    return pages;
  }

  private readonly VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".flv", ".wmv", ".m4v"];
  private readonly IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];

  private isVideoFile(mediaUrl: string): boolean {
    const ext = path.extname(mediaUrl).toLowerCase();
    return this.VIDEO_EXTENSIONS.includes(ext);
  }

  private resolveLocalMediaPath(mediaUrl: string): string | null {
    if (mediaUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), mediaUrl.slice(1));
      if (fs.existsSync(filePath)) {
        return filePath;
      }
      console.warn(`[META PUBLISH] Local file not found: ${filePath}`);
    }
    return null;
  }

  private resolveMediaUrl(mediaUrl: string): string {
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
      return mediaUrl;
    }
    if (mediaUrl.startsWith("/uploads/") && this.baseUrl) {
      return `${this.baseUrl}${mediaUrl}`;
    }
    return mediaUrl;
  }

  private async uploadVideoToFacebook(
    pageId: string,
    pageAccessToken: string,
    mediaUrl: string,
    message?: string
  ): Promise<MetaPublishResult> {
    try {
      const localPath = this.resolveLocalMediaPath(mediaUrl);

      const formData = new FormData();
      formData.append("access_token", pageAccessToken);
      if (message) {
        formData.append("description", message);
      }

      if (localPath) {
        const fileBuffer = fs.readFileSync(localPath);
        const fileName = path.basename(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mimeType = ext === ".mov" ? "video/quicktime"
          : ext === ".avi" ? "video/x-msvideo"
          : ext === ".webm" ? "video/webm"
          : ext === ".mkv" ? "video/x-matroska"
          : "video/mp4";
        const blob = new Blob([fileBuffer], { type: mimeType });
        formData.append("source", blob, fileName);
        console.log(`[META PUBLISH] Uploading video file: ${localPath} (${fileBuffer.length} bytes, ${mimeType})`);
      } else {
        const resolvedUrl = this.resolveMediaUrl(mediaUrl);
        formData.append("file_url", resolvedUrl);
        console.log(`[META PUBLISH] Uploading video from URL: ${resolvedUrl}`);
      }

      const url = `${GRAPH_API_BASE}/${pageId}/videos`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as any;
      console.log(`[META PUBLISH] Video upload response:`, JSON.stringify(data));

      if (data.error) {
        console.error(`[META PUBLISH] Video upload error:`, data.error);
        return { success: false, error: data.error.message || "Failed to upload video" };
      }

      console.log(`[META PUBLISH] Video uploaded successfully: id=${data.id}`);
      return { success: true, postId: data.id };
    } catch (error: any) {
      console.error(`[META PUBLISH] Video upload exception:`, error.message);
      return { success: false, error: error.message || "Failed to upload video to Facebook" };
    }
  }

  private async uploadPhotoToFacebook(
    pageId: string,
    pageAccessToken: string,
    mediaUrl: string,
    published: boolean = true,
    message?: string
  ): Promise<{ success: boolean; photoId?: string; postId?: string; error?: string }> {
    const localPath = this.resolveLocalMediaPath(mediaUrl);

    const formData = new FormData();
    formData.append("access_token", pageAccessToken);
    formData.append("published", published ? "true" : "false");
    if (message && published) {
      formData.append("message", message);
    }

    if (localPath) {
      const fileBuffer = fs.readFileSync(localPath);
      const fileName = path.basename(localPath);
      const ext = path.extname(localPath).toLowerCase();
      const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
        : ext === ".gif" ? "image/gif"
        : ext === ".webp" ? "image/webp"
        : "image/png";
      const blob = new Blob([fileBuffer], { type: mimeType });
      formData.append("source", blob, fileName);
      console.log(`[META PUBLISH] Uploading local file: ${localPath} (${fileBuffer.length} bytes, ${mimeType})`);
    } else {
      const resolvedUrl = this.resolveMediaUrl(mediaUrl);
      formData.append("url", resolvedUrl);
      console.log(`[META PUBLISH] Uploading from URL: ${resolvedUrl}`);
    }

    const url = `${GRAPH_API_BASE}/${pageId}/photos`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json() as any;
    if (data.error) {
      console.error(`[META PUBLISH] Photo upload error:`, data.error);
      return { success: false, error: data.error.message || "Failed to upload photo" };
    }

    console.log(`[META PUBLISH] Photo uploaded: id=${data.id}, post_id=${data.post_id}`);
    return { success: true, photoId: data.id, postId: data.post_id };
  }

  async publishToFacebookPage(pageId: string, pageAccessToken: string, content: string, hashtags?: string[], mediaUrls?: string[]): Promise<MetaPublishResult> {
    try {
      let message = content;
      if (hashtags && hashtags.length > 0) {
        const tagString = hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
        message = `${content}\n\n${tagString}`;
      }

      const validMediaUrls = (mediaUrls || []).filter(u => u && u.trim().length > 0);
      const videoUrls = validMediaUrls.filter(u => this.isVideoFile(u));
      const imageUrls = validMediaUrls.filter(u => !this.isVideoFile(u));
      console.log(`[META PUBLISH] Publishing to Facebook page ${pageId}, message length: ${message.length}, images: ${imageUrls.length}, videos: ${videoUrls.length}`);

      if (validMediaUrls.length === 0) {
        const url = `${GRAPH_API_BASE}/${pageId}/feed`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            access_token: pageAccessToken,
          }),
        });

        const data = await res.json() as any;
        console.log(`[META PUBLISH] Facebook API response:`, JSON.stringify(data));

        if (data.error) {
          console.error(`[META PUBLISH] Facebook error:`, data.error);
          return { success: false, error: data.error.message || "Failed to publish to Facebook" };
        }

        console.log(`[META PUBLISH] Successfully published text-only to Facebook, post ID: ${data.id}`);
        return { success: true, postId: data.id };
      }

      if (videoUrls.length > 0) {
        const videoResult = await this.uploadVideoToFacebook(pageId, pageAccessToken, videoUrls[0], message);
        if (!videoResult.success) {
          return { success: false, error: videoResult.error };
        }
        return { success: true, postId: videoResult.postId };
      }

      if (imageUrls.length === 1) {
        const result = await this.uploadPhotoToFacebook(pageId, pageAccessToken, imageUrls[0], true, message);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true, postId: result.postId || result.photoId };
      }

      const uploadedPhotoIds: string[] = [];
      for (const mediaUrl of imageUrls) {
        const result = await this.uploadPhotoToFacebook(pageId, pageAccessToken, mediaUrl, false);
        if (result.success && result.photoId) {
          uploadedPhotoIds.push(result.photoId);
        } else {
          console.warn(`[META PUBLISH] Failed to upload one photo: ${result.error}`);
        }
      }

      if (uploadedPhotoIds.length === 0) {
        return { success: false, error: "Failed to upload any photos to Facebook" };
      }

      const feedUrl = `${GRAPH_API_BASE}/${pageId}/feed`;
      const feedBody: any = {
        message,
        access_token: pageAccessToken,
      };
      uploadedPhotoIds.forEach((photoId, index) => {
        feedBody[`attached_media[${index}]`] = JSON.stringify({ media_fbid: photoId });
      });

      const res = await fetch(feedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(feedBody).toString(),
      });

      const data = await res.json() as any;
      console.log(`[META PUBLISH] Multi-photo Facebook API response:`, JSON.stringify(data));

      if (data.error) {
        console.error(`[META PUBLISH] Facebook multi-photo error:`, data.error);
        return { success: false, error: data.error.message || "Failed to publish multi-photo post" };
      }

      console.log(`[META PUBLISH] Successfully published ${uploadedPhotoIds.length} photos to Facebook, post ID: ${data.id}`);
      return { success: true, postId: data.id };
    } catch (error: any) {
      console.error(`[META PUBLISH] Exception:`, error.message);
      return { success: false, error: error.message || "Failed to publish to Facebook" };
    }
  }

  async publishToInstagram(igUserId: string, pageAccessToken: string, content: string, hashtags?: string[], imageUrl?: string): Promise<MetaPublishResult> {
    try {
      let caption = content;
      if (hashtags && hashtags.length > 0) {
        const tagString = hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
        caption = `${content}\n\n${tagString}`;
      }

      if (!imageUrl) {
        return { success: false, error: "Instagram requires an image URL to create a post. Please add a media URL to your post." };
      }

      const localPath = this.resolveLocalMediaPath(imageUrl);
      let resolvedImageUrl = imageUrl;
      if (localPath) {
        resolvedImageUrl = this.resolveMediaUrl(imageUrl);
      } else {
        resolvedImageUrl = this.resolveMediaUrl(imageUrl);
      }

      const containerUrl = `${GRAPH_API_BASE}/${igUserId}/media`;
      const containerRes = await fetch(containerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: resolvedImageUrl,
          caption,
          access_token: pageAccessToken,
        }),
      });

      const containerData = await containerRes.json() as any;
      if (containerData.error) {
        return { success: false, error: containerData.error.message || "Failed to create Instagram media container" };
      }

      const publishUrl = `${GRAPH_API_BASE}/${igUserId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: pageAccessToken,
        }),
      });

      const publishData = await publishRes.json() as any;
      if (publishData.error) {
        return { success: false, error: publishData.error.message || "Failed to publish Instagram post" };
      }

      return { success: true, postId: publishData.id };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to publish to Instagram" };
    }
  }

  async publishPost(post: SocialPost): Promise<{ results: Record<string, MetaPublishResult> }> {
    const results: Record<string, MetaPublishResult> = {};

    const allAccounts = await storage.getSocialAccounts();
    const metaAccounts = allAccounts.filter(
      (a) => (a.platform === "facebook" || a.platform === "instagram") && a.isConnected && a.accessToken && a.platformAccountId
    );

    const selectedAccountIds = post.accountIds && post.accountIds.length > 0 ? post.accountIds : null;

    console.log(`[META PUBLISH] Publishing post ${post.id}, platforms: ${JSON.stringify(post.platforms)}, accountIds: ${JSON.stringify(selectedAccountIds)}, connected meta accounts: ${metaAccounts.length} (${metaAccounts.map(a => a.platform + ':' + a.id + ':' + a.accountName + ':pageId=' + a.platformAccountId).join(', ')})`);

    for (const platform of post.platforms) {
      if (platform === "facebook") {
        const fbAccounts = metaAccounts.filter((a) => a.platform === "facebook");
        const targetFbAccounts = selectedAccountIds
          ? fbAccounts.filter((a) => selectedAccountIds.includes(a.id))
          : fbAccounts.slice(0, 1);

        if (targetFbAccounts.length === 0) {
          results.facebook = { success: false, error: "No connected Facebook account found" };
          continue;
        }

        for (const fbAccount of targetFbAccounts) {
          const key = targetFbAccounts.length > 1 ? `facebook:${fbAccount.accountName || fbAccount.id}` : "facebook";
          console.log(`[META PUBLISH] Publishing to Facebook account: ${fbAccount.accountName} (${fbAccount.platformAccountId})`);
          results[key] = await this.publishToFacebookPage(
            fbAccount.platformAccountId!,
            fbAccount.accessToken!,
            post.content,
            post.hashtags || undefined,
            post.mediaUrls || undefined
          );
        }
      }

      if (platform === "instagram") {
        const igAccounts = metaAccounts.filter((a) => a.platform === "instagram");
        const targetIgAccounts = selectedAccountIds
          ? igAccounts.filter((a) => selectedAccountIds.includes(a.id))
          : igAccounts.slice(0, 1);

        if (targetIgAccounts.length === 0) {
          results.instagram = { success: false, error: "No connected Instagram account found" };
          continue;
        }

        const imageUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined;
        for (const igAccount of targetIgAccounts) {
          const key = targetIgAccounts.length > 1 ? `instagram:${igAccount.accountName || igAccount.id}` : "instagram";
          console.log(`[META PUBLISH] Publishing to Instagram account: ${igAccount.accountName} (${igAccount.platformAccountId})`);
          results[key] = await this.publishToInstagram(
            igAccount.platformAccountId!,
            igAccount.accessToken!,
            post.content,
            post.hashtags || undefined,
            imageUrl || undefined
          );
        }
      }
    }

    return { results };
  }
}

export const metaPublisher = new MetaPublisherService();