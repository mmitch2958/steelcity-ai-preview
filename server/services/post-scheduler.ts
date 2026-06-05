import { storage } from "../storage";
import { metaPublisher } from "./meta-publisher";

let schedulerInterval: NodeJS.Timeout | null = null;

async function processScheduledPosts() {
  try {
    if (!metaPublisher.baseUrl) {
      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      if (replitDomain) {
        metaPublisher.baseUrl = `https://${replitDomain}`;
      }
    }

    const duePosts = await storage.getDueScheduledPosts();
    if (duePosts.length === 0) return;

    console.log(`[SCHEDULER] Processing ${duePosts.length} scheduled post(s)...`);

    for (const post of duePosts) {
      try {
        const hasMeta = post.platforms.some((p) => p === "facebook" || p === "instagram");

        if (hasMeta) {
          const { results } = await metaPublisher.publishPost(post);

          const platformPostIds: Record<string, string> = {};
          const errors: string[] = [];
          let anySuccess = false;

          for (const [platform, result] of Object.entries(results)) {
            if (result.success && result.postId) {
              platformPostIds[platform] = result.postId;
              anySuccess = true;
            } else if (result.error) {
              errors.push(`${platform}: ${result.error}`);
            }
          }

          await storage.updateSocialPost(post.id, {
            status: anySuccess ? "published" : "failed",
            publishedAt: anySuccess ? new Date() : undefined,
            platformPostIds: Object.keys(platformPostIds).length > 0 ? platformPostIds : undefined,
          });

          if (anySuccess) {
            console.log(`[SCHEDULER] Published post ${post.id} to: ${Object.keys(platformPostIds).join(", ")}`);
          }
          if (errors.length > 0) {
            console.log(`[SCHEDULER] Errors for post ${post.id}: ${errors.join("; ")}`);
          }
        } else {
          await storage.updateSocialPost(post.id, { status: "failed" });
          console.log(`[SCHEDULER] Post ${post.id} has no supported platforms for auto-publishing`);
        }
      } catch (error: any) {
        console.error(`[SCHEDULER] Failed to process post ${post.id}:`, error.message);
        await storage.updateSocialPost(post.id, { status: "failed" });
      }
    }
  } catch (error: any) {
    console.error("[SCHEDULER] Error checking scheduled posts:", error.message);
  }
}

export function startPostScheduler(intervalMs = 60000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(`[SCHEDULER] Started. Checking every ${intervalMs / 1000}s for scheduled posts.`);
  schedulerInterval = setInterval(processScheduledPosts, intervalMs);
  processScheduledPosts();
}

export function stopPostScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SCHEDULER] Stopped.");
  }
}