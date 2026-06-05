import express from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { AIAgentService } from "./services/ai-agents";
import { metaPublisher } from "./services/meta-publisher";
import { socialGenerator } from "./services/social-generator";
import { scrapeUrl } from "./services/url-scraper";
import { approvalNotifications } from "./services/approval-notifications";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {
  insertSocialAccountSchema,
  updateSocialAccountSchema,
  insertSocialCampaignSchema,
  updateSocialCampaignSchema,
  insertSocialPostSchema,
  updateSocialPostSchema,
  insertBrandVoiceProfileSchema,
  updateBrandVoiceProfileSchema,
  insertTrainingFeedbackSchema,
} from "@shared/schema";

const aiAgentService = new AIAgentService(storage);

const uploadsDir = path.join(process.cwd(), "uploads", "social-media");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

export function registerSocialMediaRoutes(app: Express) {
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ error: "Authentication required" });
  };

  const requirePortalAuth = (req: any, res: any, next: any) => {
    if ((req.session as any)?.portalUser) {
      return next();
    }
    res.status(401).json({ error: "Portal authentication required" });
  };

  // ============ SOCIAL ACCOUNTS ============

  app.get("/api/admin/social/accounts", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const accounts = await storage.getSocialAccounts(clientId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch social accounts" });
    }
  });

  app.post("/api/admin/social/accounts", requireAuth, async (req, res) => {
    try {
      const data = insertSocialAccountSchema.parse(req.body);
      const account = await storage.createSocialAccount(data);
      res.status(201).json(account);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create social account" });
    }
  });

  app.put("/api/admin/social/accounts/:id", requireAuth, async (req, res) => {
    try {
      const data = updateSocialAccountSchema.parse(req.body);
      const account = await storage.updateSocialAccount(req.params.id, data);
      res.json(account);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update social account" });
    }
  });

  app.delete("/api/admin/social/accounts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSocialAccount(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete social account" });
    }
  });

  // ============ CAMPAIGNS ============

  app.get("/api/admin/social/campaigns", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const campaigns = await storage.getSocialCampaigns(clientId);
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch campaigns" });
    }
  });

  app.get("/api/admin/social/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getSocialCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch campaign" });
    }
  });

  app.post("/api/admin/social/campaigns", requireAuth, async (req, res) => {
    try {
      const data = insertSocialCampaignSchema.parse(req.body);
      const campaign = await storage.createSocialCampaign(data);
      res.status(201).json(campaign);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create campaign" });
    }
  });

  app.put("/api/admin/social/campaigns/:id", requireAuth, async (req, res) => {
    try {
      const data = updateSocialCampaignSchema.parse(req.body);
      const campaign = await storage.updateSocialCampaign(req.params.id, data);
      res.json(campaign);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update campaign" });
    }
  });

  app.delete("/api/admin/social/campaigns/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSocialCampaign(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete campaign" });
    }
  });

  // ============ POSTS ============

  app.get("/api/admin/social/posts", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const campaignId = req.query.campaignId as string | undefined;
      const posts = await storage.getSocialPosts(clientId, campaignId);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch posts" });
    }
  });

  app.get("/api/admin/social/posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch post" });
    }
  });

  app.post("/api/admin/social/posts", requireAuth, async (req, res) => {
    try {
      const data = insertSocialPostSchema.parse(req.body);
      const post = await storage.createSocialPost(data);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create post" });
    }
  });

  app.put("/api/admin/social/posts/:id", requireAuth, async (req, res) => {
    try {
      const data = updateSocialPostSchema.parse(req.body);
      const post = await storage.updateSocialPost(req.params.id, data);
      res.json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update post" });
    }
  });

  app.delete("/api/admin/social/posts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSocialPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete post" });
    }
  });

  // ============ AI AGENTS ============

  app.get("/api/admin/social/agents", requireAuth, async (req, res) => {
    try {
      const agents = await storage.getAiAgents();
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch agents" });
    }
  });

  app.get("/api/admin/social/agents/:id/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getAiAgentTasks(req.params.id);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch agent tasks" });
    }
  });

  app.post("/api/admin/social/ai/generate-post", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        prompt: z.string().min(1, "Prompt is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        clientId: z.string().optional(),
        campaignId: z.string().optional(),
        brandVoiceId: z.string().optional(),
      });
      const { prompt, platforms, clientId, campaignId, brandVoiceId } = schema.parse(req.body);
      let brandVoice;
      if (brandVoiceId) {
        const profiles = await storage.getBrandVoiceProfiles(clientId);
        brandVoice = profiles.find((p: any) => p.id === brandVoiceId);
      }
      const result = await aiAgentService.generatePost(prompt, platforms, clientId, campaignId, brandVoice);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate post" });
    }
  });

  app.post("/api/admin/social/ai/research", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        clientId: z.string().optional(),
      });
      const { topic, platforms, clientId } = schema.parse(req.body);
      const result = await aiAgentService.researchTrends(topic, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to research trends" });
    }
  });

  app.post("/api/admin/social/ai/design", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        clientId: z.string().optional(),
      });
      const { content, platforms, clientId } = schema.parse(req.body);
      const result = await aiAgentService.getDesignSuggestions(content, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to get design suggestions" });
    }
  });

  app.post("/api/admin/social/ai/review", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        clientId: z.string().optional(),
      });
      const { content, platforms, clientId } = schema.parse(req.body);
      const result = await aiAgentService.reviewPost(content, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to review post" });
    }
  });

  app.post("/api/admin/social/ai/vibe-edit", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        vibeDirection: z.string().min(1, "Vibe direction is required"),
        clientId: z.string().optional(),
      });
      const { content, vibeDirection, clientId } = schema.parse(req.body);
      const result = await aiAgentService.applyVibeEdit(content, vibeDirection, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to apply vibe edit" });
    }
  });

  app.post("/api/admin/social/ai/orchestrate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        briefing: z.string().min(1, "Briefing is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        clientId: z.string().optional(),
        campaignId: z.string().optional(),
        brandVoiceId: z.string().optional(),
      });
      const { briefing, platforms, clientId, campaignId, brandVoiceId } = schema.parse(req.body);
      let brandVoice;
      if (brandVoiceId) {
        const profiles = await storage.getBrandVoiceProfiles(clientId);
        brandVoice = profiles.find((p: any) => p.id === brandVoiceId);
      }
      const result = await aiAgentService.orchestrateContentCreation(briefing, platforms, clientId, campaignId, brandVoice);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to orchestrate content creation" });
    }
  });

  app.post("/api/admin/social/ai/autonomous", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        briefing: z.string().min(1, "Briefing is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        accountIds: z.array(z.string()).optional(),
        clientId: z.string().optional(),
        campaignId: z.string().optional(),
        brandVoiceId: z.string().optional(),
        autoPost: z.boolean().optional().default(false),
      });
      const { briefing, platforms, accountIds, clientId, campaignId, brandVoiceId, autoPost } = schema.parse(req.body);

      let brandVoice;
      if (brandVoiceId) {
        const profiles = await storage.getBrandVoiceProfiles(clientId);
        brandVoice = profiles.find((p: any) => p.id === brandVoiceId);
      }

      const result = await aiAgentService.fullyAutonomousCreate(briefing, platforms, clientId, campaignId, undefined, brandVoice);

      const savedMediaUrls: string[] = [];

      if (result.scrapedImages && result.scrapedImages.length > 0) {
        savedMediaUrls.push(...result.scrapedImages);
      }

      for (const img of result.generatedImages) {
        try {
          const filename = crypto.randomUUID() + ".png";
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(img.url, "base64");
          fs.writeFileSync(filePath, buffer);
          savedMediaUrls.push(`/uploads/social-media/${filename}`);
        } catch (err: any) {
          console.error("[AUTONOMOUS] Failed to save image:", err.message);
        }
      }

      if (result.generatedVideos) {
        for (const vid of result.generatedVideos) {
          if (vid.url) {
            savedMediaUrls.push(vid.url);
          }
        }
      }

      const post = await storage.createSocialPost({
        content: result.content,
        platforms,
        accountIds: accountIds && accountIds.length > 0 ? accountIds : undefined,
        hashtags: result.hashtags,
        mediaUrls: savedMediaUrls.length > 0 ? savedMediaUrls : undefined,
        status: autoPost ? "scheduled" : "draft",
        scheduledAt: new Date(result.schedule.scheduledAt),
        aiGenerated: true,
        campaignId: campaignId || undefined,
        clientId: clientId || undefined,
      });

      res.json({
        post,
        autoPost,
        aiResults: {
          research: result.research,
          content: result.content,
          hashtags: result.hashtags,
          platformVersions: result.platformVersions,
          designSuggestions: result.designSuggestions,
          review: result.review,
          generatedImages: savedMediaUrls,
          schedule: result.schedule,
          scrapedData: result.scrapedData || null,
        },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[AUTONOMOUS] Error:", error.message);
      res.status(500).json({ error: error.message || "Autonomous creation failed" });
    }
  });

  // ============ URL SCRAPER ============

  app.post("/api/admin/social/scrape", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url("Valid URL is required"),
        maxImages: z.number().min(0).max(10).optional().default(5),
      });
      const { url, maxImages } = schema.parse(req.body);
      const data = await scrapeUrl(url, maxImages);
      res.json(data);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[SCRAPE] Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to scrape URL" });
    }
  });

  app.post("/api/portal/social/scrape", requirePortalAuth, async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url("Valid URL is required"),
        maxImages: z.number().min(0).max(10).optional().default(5),
      });
      const { url, maxImages } = schema.parse(req.body);
      const data = await scrapeUrl(url, maxImages);
      res.json(data);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[PORTAL SCRAPE] Error:", error.message);
      res.status(500).json({ error: error.message || "Failed to scrape URL" });
    }
  });

  // ============ TRAINING & BRAND VOICE ============

  app.get("/api/admin/social/brand-voice", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const profiles = await storage.getBrandVoiceProfiles(clientId);
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch brand voice profiles" });
    }
  });

  app.post("/api/admin/social/brand-voice", requireAuth, async (req, res) => {
    try {
      const data = insertBrandVoiceProfileSchema.parse(req.body);
      const profile = await storage.createBrandVoiceProfile(data);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create brand voice profile" });
    }
  });

  app.put("/api/admin/social/brand-voice/:id", requireAuth, async (req, res) => {
    try {
      const data = updateBrandVoiceProfileSchema.parse(req.body);
      const profile = await storage.updateBrandVoiceProfile(req.params.id, data);
      res.json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update brand voice profile" });
    }
  });

  app.delete("/api/admin/social/brand-voice/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBrandVoiceProfile(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete brand voice profile" });
    }
  });

  app.get("/api/admin/social/training-feedback", requireAuth, async (req, res) => {
    try {
      const clientId = req.query.clientId as string | undefined;
      const feedback = await storage.getTrainingFeedback(clientId);
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch training feedback" });
    }
  });

  app.post("/api/admin/social/training-feedback", requireAuth, async (req, res) => {
    try {
      const data = insertTrainingFeedbackSchema.parse(req.body);
      const feedback = await storage.createTrainingFeedback(data);
      res.status(201).json(feedback);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create training feedback" });
    }
  });

  // ============ CLIENT PORTAL ROUTES ============

  app.get("/api/portal/social/accounts", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const accounts = await storage.getSocialAccounts(clientId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch social accounts" });
    }
  });

  app.get("/api/portal/social/campaigns", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const campaigns = await storage.getSocialCampaigns(clientId);
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch campaigns" });
    }
  });

  app.get("/api/portal/social/posts", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const campaignId = req.query.campaignId as string | undefined;
      const posts = await storage.getSocialPosts(clientId, campaignId);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch posts" });
    }
  });

  app.post("/api/portal/social/posts", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const data = insertSocialPostSchema.parse({ ...req.body, clientId });
      const post = await storage.createSocialPost(data);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create post" });
    }
  });

  app.put("/api/portal/social/posts/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const post = await storage.getSocialPostById(req.params.id);
      if (!post || post.clientId !== clientId) {
        return res.status(404).json({ error: "Post not found" });
      }
      const data = updateSocialPostSchema.parse(req.body);
      const updated = await storage.updateSocialPost(req.params.id, data);
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update post" });
    }
  });

  app.post("/api/portal/social/ai/generate-post", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        prompt: z.string().min(1, "Prompt is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        campaignId: z.string().optional(),
      });
      const { prompt, platforms, campaignId } = schema.parse(req.body);
      const result = await aiAgentService.generatePost(prompt, platforms, clientId, campaignId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate post" });
    }
  });

  app.post("/api/portal/social/ai/vibe-edit", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        vibeDirection: z.string().min(1, "Vibe direction is required"),
      });
      const { content, vibeDirection } = schema.parse(req.body);
      const result = await aiAgentService.applyVibeEdit(content, vibeDirection, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to apply vibe edit" });
    }
  });

  app.post("/api/portal/social/ai/review", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
      });
      const { content, platforms } = schema.parse(req.body);
      const result = await aiAgentService.reviewPost(content, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to review post" });
    }
  });

  app.post("/api/portal/social/ai/orchestrate", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        briefing: z.string().min(1, "Briefing is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        campaignId: z.string().optional(),
        brandVoiceId: z.string().optional(),
      });
      const { briefing, platforms, campaignId, brandVoiceId } = schema.parse(req.body);
      let brandVoice;
      if (brandVoiceId) {
        const profiles = await storage.getBrandVoiceProfiles(clientId);
        brandVoice = profiles.find((p: any) => p.id === brandVoiceId);
      }
      const result = await aiAgentService.orchestrateContentCreation(briefing, platforms, clientId, campaignId, brandVoice);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to orchestrate content creation" });
    }
  });

  app.post("/api/portal/social/ai/research", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
      });
      const { topic, platforms } = schema.parse(req.body);
      const result = await aiAgentService.researchTrends(topic, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to research trends" });
    }
  });

  app.post("/api/portal/social/ai/design", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
      });
      const { content, platforms } = schema.parse(req.body);
      const result = await aiAgentService.getDesignSuggestions(content, platforms, clientId);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to get design suggestions" });
    }
  });

  app.post("/api/portal/social/ai/autonomous", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const schema = z.object({
        briefing: z.string().min(1, "Briefing is required"),
        platforms: z.array(z.string()).min(1, "At least one platform is required"),
        accountIds: z.array(z.string()).optional(),
        campaignId: z.string().optional(),
        brandVoiceId: z.string().optional(),
        autoPost: z.boolean().optional().default(false),
      });
      const { briefing, platforms, accountIds, campaignId, brandVoiceId, autoPost } = schema.parse(req.body);

      let brandVoice;
      if (brandVoiceId) {
        const profiles = await storage.getBrandVoiceProfiles(clientId);
        brandVoice = profiles.find((p: any) => p.id === brandVoiceId);
      }

      const result = await aiAgentService.fullyAutonomousCreate(briefing, platforms, clientId, campaignId, undefined, brandVoice);

      const savedMediaUrls: string[] = [];

      if (result.scrapedImages && result.scrapedImages.length > 0) {
        savedMediaUrls.push(...result.scrapedImages);
      }

      for (const img of result.generatedImages) {
        try {
          const filename = crypto.randomUUID() + ".png";
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(img.url, "base64");
          fs.writeFileSync(filePath, buffer);
          savedMediaUrls.push(`/uploads/social-media/${filename}`);
        } catch (err: any) {
          console.error("[PORTAL AUTONOMOUS] Failed to save image:", err.message);
        }
      }

      if (result.generatedVideos) {
        for (const vid of result.generatedVideos) {
          if (vid.url) savedMediaUrls.push(vid.url);
        }
      }

      const post = await storage.createSocialPost({
        content: result.content,
        platforms,
        accountIds: accountIds && accountIds.length > 0 ? accountIds : undefined,
        hashtags: result.hashtags,
        mediaUrls: savedMediaUrls.length > 0 ? savedMediaUrls : undefined,
        status: autoPost ? "scheduled" : "draft",
        scheduledAt: new Date(result.schedule.scheduledAt),
        aiGenerated: true,
        campaignId: campaignId || undefined,
        clientId,
      });

      res.json({
        post,
        autoPost,
        aiResults: {
          research: result.research,
          content: result.content,
          hashtags: result.hashtags,
          platformVersions: result.platformVersions,
          designSuggestions: result.designSuggestions,
          review: result.review,
          generatedImages: savedMediaUrls,
          schedule: result.schedule,
          scrapedData: result.scrapedData || null,
        },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("[PORTAL AUTONOMOUS] Error:", error.message);
      res.status(500).json({ error: error.message || "Autonomous creation failed" });
    }
  });

  app.get("/api/portal/social/brand-voice", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const profiles = await storage.getBrandVoiceProfiles(clientId);
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch brand voice profiles" });
    }
  });

  app.post("/api/portal/social/brand-voice", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const data = insertBrandVoiceProfileSchema.parse({ ...req.body, clientId });
      const profile = await storage.createBrandVoiceProfile(data);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create brand voice profile" });
    }
  });

  app.put("/api/portal/social/brand-voice/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const profiles = await storage.getBrandVoiceProfiles(clientId);
      const owned = profiles.find((p: any) => p.id === req.params.id);
      if (!owned) {
        return res.status(404).json({ error: "Brand voice profile not found" });
      }
      const data = updateBrandVoiceProfileSchema.parse(req.body);
      const profile = await storage.updateBrandVoiceProfile(req.params.id, data);
      res.json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update brand voice profile" });
    }
  });

  app.delete("/api/portal/social/brand-voice/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const profiles = await storage.getBrandVoiceProfiles(clientId);
      const owned = profiles.find((p: any) => p.id === req.params.id);
      if (!owned) {
        return res.status(404).json({ error: "Brand voice profile not found" });
      }
      await storage.deleteBrandVoiceProfile(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete brand voice profile" });
    }
  });

  app.post("/api/portal/social/campaigns", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const data = insertSocialCampaignSchema.parse({ ...req.body, clientId });
      const campaign = await storage.createSocialCampaign(data);
      res.status(201).json(campaign);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create campaign" });
    }
  });

  app.put("/api/portal/social/campaigns/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const campaign = await storage.getSocialCampaignById(req.params.id);
      if (!campaign || campaign.clientId !== clientId) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      const data = updateSocialCampaignSchema.parse(req.body);
      const updated = await storage.updateSocialCampaign(req.params.id, data);
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to update campaign" });
    }
  });

  app.delete("/api/portal/social/campaigns/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const campaign = await storage.getSocialCampaignById(req.params.id);
      if (!campaign || campaign.clientId !== clientId) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      await storage.deleteSocialCampaign(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete campaign" });
    }
  });

  app.post("/api/portal/social/accounts", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const data = insertSocialAccountSchema.parse({ ...req.body, clientId });
      const account = await storage.createSocialAccount(data);
      res.status(201).json(account);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create social account" });
    }
  });

  app.delete("/api/portal/social/posts/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const post = await storage.getSocialPostById(req.params.id);
      if (!post || post.clientId !== clientId) {
        return res.status(404).json({ error: "Post not found" });
      }
      await storage.deleteSocialPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete post" });
    }
  });

  app.post("/api/portal/social/ai/generate-video", requirePortalAuth, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1, "Description is required"),
        style: z.string().optional(),
        duration: z.number().min(5).max(30).optional(),
      });
      const { description, style, duration } = schema.parse(req.body);
      const result = await aiAgentService.generateVideo(description, style, duration || 15);
      res.json({ url: result.url });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  app.post("/api/portal/social/video/generate", requirePortalAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        source: z.enum(["ai", "stock"]).default("stock"),
        style: z.string().optional(),
        description: z.string().optional(),
      });
      const { topic, source, style, description } = schema.parse(req.body);

      if (source === "stock") {
        const pexelsApiKey = process.env.PEXELS_API_KEY;
        if (!pexelsApiKey) {
          return res.status(400).json({ error: "PEXELS_API_KEY not configured. Please choose 'ai' source." });
        }
        const searchQuery = description || topic;
        const endpoint = "https://api.pexels.com/videos/search";
        const params = new URLSearchParams({ query: searchQuery, per_page: "5" });
        const response = await fetch(`${endpoint}?${params}`, { headers: { Authorization: pexelsApiKey } });
        if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);
        const data = await response.json();
        const videos = data.videos || [];
        const results = videos.map((v: any) => {
          const bestFile = (v.video_files || []).sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0];
          return { url: bestFile?.link, width: bestFile?.width, height: bestFile?.height, duration: v.duration };
        }).filter((v: any) => v.url);
        return res.json({ source: "stock", videos: results });
      }

      const result = await aiAgentService.generateVideo(description || topic, style, 15);
      res.json({ source: "ai", url: result.url });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  app.post("/api/portal/social/training-feedback", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const data = insertTrainingFeedbackSchema.parse({ ...req.body, clientId });
      const feedback = await storage.createTrainingFeedback(data);
      res.status(201).json(feedback);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create training feedback" });
    }
  });

  app.get("/api/portal/social/agents", requirePortalAuth, async (req, res) => {
    try {
      const agents = await storage.getAiAgents();
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch agents" });
    }
  });

  app.delete("/api/portal/social/accounts/:id", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const account = await storage.getSocialAccountById(req.params.id);
      if (!account || account.clientId !== clientId) {
        return res.status(404).json({ error: "Account not found" });
      }
      await storage.deleteSocialAccount(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to disconnect account" });
    }
  });

  // ============ PORTAL META/FACEBOOK OAUTH ============

  app.get("/api/portal/social/meta/connect", requirePortalAuth, (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const clientSlug = (req.session as any).portalUser.clientSlug || "";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/portal/social/meta/callback`;
      const state = Buffer.from(JSON.stringify({ clientId, clientSlug, ts: Date.now() })).toString("base64");
      (req.session as any).portalMetaOAuthState = state;
      const url = metaPublisher.getOAuthUrl(redirectUri, state);
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate OAuth URL" });
    }
  });

  app.get("/api/portal/social/meta/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query as any;

      let clientId: string = "";
      let clientSlug: string = "";
      if (state) {
        try {
          const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
          clientId = decoded.clientId || "";
          clientSlug = decoded.clientSlug || "";
          console.log("[PORTAL OAUTH CALLBACK] Decoded state — clientId:", clientId, "clientSlug:", clientSlug);
        } catch {
          console.error("[PORTAL OAUTH CALLBACK] Failed to decode state");
        }
      }

      let portalBase = clientSlug ? `/${clientSlug}/social-media` : "/";

      if (oauthError) {
        return res.redirect(`${portalBase}?error=${encodeURIComponent(oauthError)}`);
      }
      if (!code || !state) {
        return res.redirect(`${portalBase}?error=no_code`);
      }

      if (!clientId) {
        console.error("[PORTAL OAUTH CALLBACK] clientId missing from state");
        return res.redirect(`${portalBase}?error=missing_client`);
      }

      if (!clientSlug) {
        const client = await storage.getClientById(clientId);
        clientSlug = client?.slug || "";
        portalBase = clientSlug ? `/${clientSlug}/social-media` : "/";
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/portal/social/meta/callback`;

      console.log("[PORTAL OAUTH] Exchanging code for token...");
      const { accessToken: shortToken } = await metaPublisher.exchangeCodeForToken(code, redirectUri);
      console.log("[PORTAL OAUTH] Got short token, getting long-lived token...");
      const { accessToken: longToken, expiresIn } = await metaPublisher.getLongLivedToken(shortToken);
      console.log("[PORTAL OAUTH] Got long-lived token, checking permissions...");
      const { granted, declined } = await metaPublisher.checkPermissions(longToken);
      const pages = await metaPublisher.getUserPages(longToken);
      console.log(`[PORTAL OAUTH] Found ${pages.length} page(s) for clientId=${clientId}`);

      if (pages.length === 0) {
        if (declined.includes("pages_show_list") || declined.includes("pages_manage_posts")) {
          return res.redirect(`${portalBase}?tab=accounts&error=pages_declined`);
        }
        if (!granted.includes("pages_show_list")) {
          return res.redirect(`${portalBase}?tab=accounts&error=pages_not_granted`);
        }
        return res.redirect(`${portalBase}?tab=accounts&error=no_pages`);
      }

      for (const page of pages) {
        console.log(`[PORTAL OAUTH] Processing page: ${page.name} (id=${page.id})`);
        const existingAccounts = await storage.getSocialAccounts(clientId);
        const existingFb = existingAccounts.find(
          (a) => a.platform === "facebook" && a.platformAccountId === page.id
        );

        if (existingFb) {
          console.log(`[PORTAL OAUTH] Updating existing FB account ${existingFb.id}`);
          await storage.updateSocialAccount(existingFb.id, {
            accessToken: page.access_token,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            isConnected: true,
            accountName: page.name,
            accountImage: page.picture?.data?.url || null,
          });
        } else {
          console.log(`[PORTAL OAUTH] Creating new FB account for clientId=${clientId}`);
          try {
            const created = await storage.createSocialAccount({
              platform: "facebook",
              accountName: page.name,
              accountUsername: page.name,
              accountImage: page.picture?.data?.url || null,
              accessToken: page.access_token,
              platformAccountId: page.id,
              isConnected: true,
              clientId,
              tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
              metadata: { category: page.category },
            });
            console.log(`[PORTAL OAUTH] Created FB account: id=${created.id}, clientId=${created.clientId}`);
          } catch (createErr: any) {
            console.error(`[PORTAL OAUTH] FAILED to create FB account:`, createErr.message, createErr.stack);
          }
        }

        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id;
          const existingIg = existingAccounts.find(
            (a) => a.platform === "instagram" && a.platformAccountId === igId
          );

          let igName = page.name + " (Instagram)";
          let igUsername = "";
          let igImage = "";
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v21.0/${igId}?fields=name,username,profile_picture_url&access_token=${page.access_token}`
            );
            const igData = (await igRes.json()) as any;
            if (igData.username) igUsername = igData.username;
            if (igData.name) igName = igData.name;
            if (igData.profile_picture_url) igImage = igData.profile_picture_url;
          } catch { }

          if (existingIg) {
            console.log(`[PORTAL OAUTH] Updating existing IG account ${existingIg.id}`);
            await storage.updateSocialAccount(existingIg.id, {
              accessToken: page.access_token,
              tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
              isConnected: true,
              accountName: igName,
              accountUsername: igUsername || null,
              accountImage: igImage || null,
            });
          } else {
            console.log(`[PORTAL OAUTH] Creating new IG account for clientId=${clientId}`);
            try {
              const created = await storage.createSocialAccount({
                platform: "instagram",
                accountName: igName,
                accountUsername: igUsername || null,
                accountImage: igImage || null,
                accessToken: page.access_token,
                platformAccountId: igId,
                isConnected: true,
                clientId,
                tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
                metadata: { linkedFacebookPageId: page.id },
              });
              console.log(`[PORTAL OAUTH] Created IG account: id=${created.id}, clientId=${created.clientId}`);
            } catch (createErr: any) {
              console.error(`[PORTAL OAUTH] FAILED to create IG account:`, createErr.message, createErr.stack);
            }
          }
        }
      }

      const savedAccounts = await storage.getSocialAccounts(clientId);
      console.log(`[PORTAL OAUTH] After save: ${savedAccounts.length} account(s) for clientId=${clientId}`);

      res.redirect(`${portalBase}?tab=accounts&connected=facebook`);
    } catch (error: any) {
      console.error("[PORTAL META OAUTH] Error:", error.message, error.stack);
      res.redirect("/?error=" + encodeURIComponent(error.message || "oauth_failed"));
    }
  });

  // ============ META/FACEBOOK OAUTH ============

  app.get("/api/admin/social/meta/connect", requireAuth, (req, res) => {
    try {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/admin/social/meta/callback`;
      console.log("[META OAUTH] Headers:", JSON.stringify({
        "x-forwarded-proto": req.headers["x-forwarded-proto"],
        "x-forwarded-host": req.headers["x-forwarded-host"],
        "host": req.headers.host,
        protocol: req.protocol,
      }));
      console.log("[META OAUTH] Generated redirect URI:", redirectUri);
      const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString("base64");
      (req.session as any).metaOAuthState = state;
      const url = metaPublisher.getOAuthUrl(redirectUri, state);
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate OAuth URL" });
    }
  });

  app.get("/api/admin/social/meta/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query as any;
      if (oauthError) {
        return res.redirect("/admin/social-media?error=" + encodeURIComponent(oauthError));
      }
      if (!code) {
        return res.redirect("/admin/social-media?error=no_code");
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const redirectUri = `${protocol}://${host}/api/admin/social/meta/callback`;

      const { accessToken: shortToken } = await metaPublisher.exchangeCodeForToken(code, redirectUri);
      const { accessToken: longToken, expiresIn } = await metaPublisher.getLongLivedToken(shortToken);
      const { granted, declined } = await metaPublisher.checkPermissions(longToken);
      const pages = await metaPublisher.getUserPages(longToken);

      if (pages.length === 0) {
        if (declined.includes("pages_show_list") || declined.includes("pages_manage_posts")) {
          return res.redirect("/admin/social-media?tab=accounts&error=pages_declined");
        }
        if (!granted.includes("pages_show_list")) {
          return res.redirect("/admin/social-media?tab=accounts&error=pages_not_granted");
        }
        return res.redirect("/admin/social-media?tab=accounts&error=no_pages");
      }

      for (const page of pages) {
        const existingAccounts = await storage.getSocialAccounts();
        const existingFb = existingAccounts.find(
          (a) => a.platform === "facebook" && a.platformAccountId === page.id
        );

        if (existingFb) {
          await storage.updateSocialAccount(existingFb.id, {
            accessToken: page.access_token,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            isConnected: true,
            accountName: page.name,
            accountImage: page.picture?.data?.url || null,
          });
        } else {
          await storage.createSocialAccount({
            platform: "facebook",
            accountName: page.name,
            accountUsername: page.name,
            accountImage: page.picture?.data?.url || null,
            accessToken: page.access_token,
            platformAccountId: page.id,
            isConnected: true,
            tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            metadata: { category: page.category },
          });
        }

        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id;
          const existingIg = existingAccounts.find(
            (a) => a.platform === "instagram" && a.platformAccountId === igId
          );

          let igName = page.name + " (Instagram)";
          let igUsername = "";
          let igImage = "";
          try {
            const igRes = await fetch(
              `https://graph.facebook.com/v21.0/${igId}?fields=name,username,profile_picture_url&access_token=${page.access_token}`
            );
            const igData = (await igRes.json()) as any;
            if (igData.username) igUsername = igData.username;
            if (igData.name) igName = igData.name;
            if (igData.profile_picture_url) igImage = igData.profile_picture_url;
          } catch { }

          if (existingIg) {
            await storage.updateSocialAccount(existingIg.id, {
              accessToken: page.access_token,
              tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
              isConnected: true,
              accountName: igName,
              accountUsername: igUsername || null,
              accountImage: igImage || null,
            });
          } else {
            await storage.createSocialAccount({
              platform: "instagram",
              accountName: igName,
              accountUsername: igUsername || null,
              accountImage: igImage || null,
              accessToken: page.access_token,
              platformAccountId: igId,
              isConnected: true,
              tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
              metadata: { linkedFacebookPageId: page.id },
            });
          }
        }
      }

      res.redirect("/admin/social-media?tab=accounts&connected=facebook");
    } catch (error: any) {
      console.error("[META OAUTH] Error:", error.message);
      res.redirect("/admin/social-media?error=" + encodeURIComponent(error.message || "oauth_failed"));
    }
  });

  app.get("/api/admin/social/meta/pages", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getSocialAccounts();
      const fbAccounts = accounts.filter((a) => a.platform === "facebook" && a.isConnected);
      res.json(fbAccounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch pages" });
    }
  });

  // ============ PUBLISH POSTS ============

  app.post("/api/admin/social/posts/:id/publish", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.status === "published") {
        return res.status(400).json({ error: "Post has already been published" });
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      metaPublisher.baseUrl = `${protocol}://${host}`;

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

      const updatedPost = await storage.updateSocialPost(post.id, {
        status: anySuccess ? "published" : "failed",
        publishedAt: anySuccess ? new Date() : undefined,
        platformPostIds: Object.keys(platformPostIds).length > 0 ? platformPostIds : undefined,
      });

      res.json({
        post: updatedPost,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to publish post" });
    }
  });

  app.post("/api/portal/social/posts/:id/publish", requirePortalAuth, async (req, res) => {
    try {
      const clientId = (req.session as any).portalUser.clientId;
      const post = await storage.getSocialPostById(req.params.id);
      if (!post || post.clientId !== clientId) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.status === "published") {
        return res.status(400).json({ error: "Post has already been published" });
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      metaPublisher.baseUrl = `${protocol}://${host}`;

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

      const updatedPost = await storage.updateSocialPost(post.id, {
        status: anySuccess ? "published" : "failed",
        publishedAt: anySuccess ? new Date() : undefined,
        platformPostIds: Object.keys(platformPostIds).length > 0 ? platformPostIds : undefined,
      });

      res.json({
        post: updatedPost,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to publish post" });
    }
  });

  // ============ MEDIA UPLOAD & AI IMAGE GENERATION ============

  app.use("/uploads/social-media", express.static(uploadsDir));

  app.post("/api/admin/social/media/upload", requireAuth, upload.array("files", 10), (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = req.files.map((f: any) => `/uploads/social-media/${f.filename}`);
      res.json({ urls });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  app.post("/api/admin/social/media/from-url", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url("Valid URL is required"),
      });
      const { url } = schema.parse(req.body);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const contentType = response.headers.get("content-type") || "";
      let ext = ".jpg";
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("gif")) ext = ".gif";
      else if (contentType.includes("webp")) ext = ".webp";
      else if (contentType.includes("mp4") || contentType.includes("video")) ext = ".mp4";

      const filename = crypto.randomUUID() + ext;
      const filePath = path.join(uploadsDir, filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      res.json({ url: `/uploads/social-media/${filename}` });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid URL", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to download media" });
    }
  });

  app.post("/api/admin/social/ai/generate-image", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1, "Description is required"),
        style: z.string().optional(),
      });
      const { description, style } = schema.parse(req.body);
      const result = await aiAgentService.generateImage(description, style);

      const filename = crypto.randomUUID() + ".png";
      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(result.base64, "base64");
      fs.writeFileSync(filePath, buffer);

      res.json({
        url: `/uploads/social-media/${filename}`,
        revisedPrompt: result.revisedPrompt,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  app.post("/api/admin/social/ai/generate-video", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1, "Description is required"),
        style: z.string().optional(),
        duration: z.number().min(5).max(30).optional(),
      });
      const { description, style, duration } = schema.parse(req.body);
      const result = await aiAgentService.generateVideo(description, style, duration || 15);

      res.json({
        url: result.url,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  app.post("/api/portal/social/ai/generate-image", requirePortalAuth, async (req, res) => {
    try {
      const schema = z.object({
        description: z.string().min(1, "Description is required"),
        style: z.string().optional(),
      });
      const { description, style } = schema.parse(req.body);
      const result = await aiAgentService.generateImage(description, style);

      const filename = crypto.randomUUID() + ".png";
      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(result.base64, "base64");
      fs.writeFileSync(filePath, buffer);

      res.json({
        url: `/uploads/social-media/${filename}`,
        revisedPrompt: result.revisedPrompt,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  app.post("/api/portal/social/media/upload", requirePortalAuth, upload.array("files", 10), (req: any, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = req.files.map((f: any) => `/uploads/social-media/${f.filename}`);
      res.json({ urls });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  app.post("/api/portal/social/media/from-url", requirePortalAuth, async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url("Valid URL is required"),
      });
      const { url } = schema.parse(req.body);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const contentType = response.headers.get("content-type") || "";
      let ext = ".jpg";
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("gif")) ext = ".gif";
      else if (contentType.includes("webp")) ext = ".webp";
      else if (contentType.includes("mp4") || contentType.includes("video")) ext = ".mp4";

      const filename = crypto.randomUUID() + ext;
      const filePath = path.join(uploadsDir, filename);

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      res.json({ url: `/uploads/social-media/${filename}` });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid URL", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to download media" });
    }
  });

  // ============ SOCIAL GENERATOR (Python Scripts) ============

  /**
   * POST /api/admin/social/research
   * Generate research data (hooks, hashtags, angles, keywords) for a topic
   */
  app.post("/api/admin/social/research", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        style: z.string().optional(),
      });
      const { topic, style } = schema.parse(req.body);

      const research = await socialGenerator.generateResearch(topic);
      
      // Format response according to contract
      res.json({
        hooks: research.hooks,
        hashtags: research.hashtags,
        angles: research.angles.map((a: any) => ({
          type: a.type,
          title: a.angle || a.title,
          description: a.description
        })),
        keywords: research.keywords,
      });
    } catch (error: any) {
      console.error("[Social Generator] Research error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate research" });
    }
  });

  /**
   * POST /api/admin/social/generate-full
   * Generate complete social media package (research + copy + carousel config)
   */
  app.post("/api/admin/social/generate-full", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        style: z.string().optional(),
      });
      const { topic, style } = schema.parse(req.body);

      const packageResult = await socialGenerator.generateCompletePackage(topic, style || "lifestyle");

      res.json({
        topic: packageResult.topic,
        style: packageResult.style,
        generated_at: packageResult.generated_at,
        research: {
          hooks: packageResult.research.hooks,
          hashtags: packageResult.research.hashtags,
          angles: packageResult.research.angles,
          keywords: packageResult.research.keywords,
        },
        copy: packageResult.copy,
        carousel: {
          total_slides: packageResult.carousel.total_slides,
          slides: packageResult.carousel.slides,
          image_files: packageResult.carousel.image_files,
        },
      });
    } catch (error: any) {
      console.error("[Social Generator] Full package error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate full package" });
    }
  });

  /**
   * POST /api/admin/social/media/search
   * Search for media (images/videos) - uses Pexels API
   */
  app.post("/api/admin/social/media/search", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        query: z.string().min(1, "Query is required"),
        type: z.enum(["image", "video"]),
        count: z.number().min(1).max(20).optional().default(10),
        orientation: z.enum(["landscape", "portrait", "square"]).optional(),
      });
      const { query, type, count, orientation } = schema.parse(req.body);

      const pexelsApiKey = process.env.PEXELS_API_KEY;
      const mediaUrls: { url: string; width?: number; height?: number; duration?: number }[] = [];

      if (!pexelsApiKey) {
        console.warn("[Media Search] No PEXELS_API_KEY, using fallback");
        for (let i = 0; i < count; i++) {
          const seed = Math.random().toString(36).substring(7);
          const width = type === "image" ? 800 : 1280;
          const height = type === "image" ? 600 : 720;
          mediaUrls.push({ 
            url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
            width,
            height
          });
        }
        return res.json(mediaUrls);
      }

      const endpoint = type === "image" 
        ? "https://api.pexels.com/v1/search"
        : "https://api.pexels.com/videos/search";

      const params = new URLSearchParams({
        query,
        per_page: count.toString(),
      });
      
      if (type === "image" && orientation) {
        params.append("orientation", orientation);
      }

      const headers = {
        Authorization: pexelsApiKey,
      };

      const response = await fetch(`${endpoint}?${params}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();

      if (type === "image") {
        const photos = data.photos || [];
        for (const photo of photos) {
          mediaUrls.push({
            url: photo.src?.large || photo.src?.medium || photo.src?.original,
            width: photo.width,
            height: photo.height,
          });
        }
      } else {
        const videos = data.videos || [];
        for (const video of videos) {
          const videoFiles = video.video_files || [];
          const bestFile = videoFiles.sort((a: any, b: any) => b.quality - a.quality)[0] || videoFiles[0];
          
          if (bestFile) {
            mediaUrls.push({
              url: bestFile.link,
              width: bestFile.width,
              height: bestFile.height,
              duration: video.duration,
            });
          }
        }
      }

      res.json(mediaUrls);
    } catch (error: any) {
      console.error("[Media Search] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to search media" });
    }
  });

  /**
   * POST /api/admin/social/video/generate
   * Generate video - user chooses between AI-generated or stock video
   */
  app.post("/api/admin/social/video/generate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        source: z.enum(["ai", "stock"]).default("stock"),
        style: z.string().optional(),
        description: z.string().optional(),
      });
      const { topic, source, style, description } = schema.parse(req.body);

      console.log(`[Video Generate] Generating video: ${topic}, source: ${source}`);

      if (source === "stock") {
        const pexelsApiKey = process.env.PEXELS_API_KEY;
        
        if (!pexelsApiKey) {
          return res.status(400).json({ 
            error: "PEXELS_API_KEY not configured. Please set it in environment variables or choose 'ai' source." 
          });
        }

        const searchQuery = description || topic;
        const endpoint = "https://api.pexels.com/videos/search";
        const params = new URLSearchParams({
          query: searchQuery,
          per_page: "5",
        });

        const headers = {
          Authorization: pexelsApiKey,
        };

        const response = await fetch(`${endpoint}?${params}`, { headers });
        
        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();
        const videos = data.videos || [];

        if (videos.length === 0) {
          return res.status(404).json({ 
            error: "No stock videos found for this topic. Try a different description or use 'ai' source." 
          });
        }

        const bestVideo = videos[0];
        const bestFile = (bestVideo.video_files || [])
          .sort((a: any, b: any) => b.width * b.height - a.width * b.height)[0];

        res.json({
          source: "stock",
          topic,
          video: {
            url: bestFile?.link,
            width: bestFile?.width,
            height: bestFile?.height,
            duration: bestVideo.duration,
            thumbnail: bestVideo.image,
          },
          message: "Stock video from Pexels",
        });

      } else {
        const aiAgents = new AIAgentService();
        const videoDesc = description || `${topic} - ${style || 'lifestyle'} social media video`;
        const videoResult = await aiAgents.generateVideo(videoDesc, style || "cinematic");

        res.json({
          source: "ai",
          topic,
          video: {
            url: videoResult.url,
            description: videoDesc,
          },
          message: "AI-generated video",
        });
      }
    } catch (error: any) {
      console.error("[Video Generate] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  /**
   * POST /api/admin/social/carousel/generate
   * Generate carousel slides (creates slide images from prompts)
   */
  app.post("/api/admin/social/carousel/generate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        style: z.string().min(1, "Style is required"),
        slides: z.array(z.any()).min(1, "At least one slide is required"),
      });
      const { topic, style, slides } = schema.parse(req.body);

      const carouselResult = await socialGenerator.generateCarousel(topic, style);

      const slideUrls: string[] = [];
      
      if (aiAgentService && carouselResult.slides.length > 0) {
        for (const slide of carouselResult.slides) {
          try {
            const prompt = slide.image_prompt || `${topic} - ${slide.title}`;
            const result = await aiAgentService.generateImage(prompt, style);
            
            const filename = crypto.randomUUID() + ".png";
            const filePath = path.join(uploadsDir, filename);
            const buffer = Buffer.from(result.base64, "base64");
            fs.writeFileSync(filePath, buffer);
            
            slideUrls.push(`/uploads/social-media/${filename}`);
          } catch (imgError: any) {
            console.warn("[Carousel] Failed to generate slide image:", imgError.message);
          }
        }
      }

      if (slideUrls.length === 0 && carouselResult.image_files.length > 0) {
        res.json(carouselResult.image_files.map((f: string) => {
          const filename = path.basename(f);
          return `/uploads/social-media/${filename}`;
        }));
      } else {
        res.json(slideUrls);
      }
    } catch (error: any) {
      console.error("[Carousel Generate] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate carousel" });
    }
  });

  // ============ YOUTUBE IMPORT ============

  app.post("/api/admin/social/media/from-youtube", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        style: z.string().optional(),
      });
      const { topic, style } = schema.parse(req.body);

      const packageResult = await socialGenerator.generateCompletePackage(topic, style || "lifestyle");

      res.json({
        topic: packageResult.topic,
        style: packageResult.style,
        generated_at: packageResult.generated_at,
        research: {
          hooks: packageResult.research.hooks,
          hashtags: packageResult.research.hashtags,
          angles: packageResult.research.angles,
          keywords: packageResult.research.keywords,
        },
        copy: packageResult.copy,
        carousel: {
          total_slides: packageResult.carousel.total_slides,
          slides: packageResult.carousel.slides,
          image_files: packageResult.carousel.image_files,
        },
      });
    } catch (error: any) {
      console.error("[Social Generator] Full package error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate full package" });
    }
  });

  /**
   * POST /api/admin/social/media/search
   * Search for media (images/videos) - uses Pexels API
   */
  app.post("/api/admin/social/media/search", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        query: z.string().min(1, "Query is required"),
        type: z.enum(["image", "video"]),
        count: z.number().min(1).max(20).optional().default(10),
        orientation: z.enum(["landscape", "portrait", "square"]).optional(),
      });
      const { query, type, count, orientation } = schema.parse(req.body);

      const pexelsApiKey = process.env.PEXELS_API_KEY;
      const mediaUrls: { url: string; width?: number; height?: number; duration?: number }[] = [];

      if (!pexelsApiKey) {
        // Fallback to placeholder images if no API key
        console.warn("[Media Search] No PEXELS_API_KEY, using fallback");
        for (let i = 0; i < count; i++) {
          const seed = Math.random().toString(36).substring(7);
          const width = type === "image" ? 800 : 1280;
          const height = type === "image" ? 600 : 720;
          mediaUrls.push({ 
            url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
            width,
            height
          });
        }
        return res.json(mediaUrls);
      }

      // Use Pexels API
      const endpoint = type === "image" 
        ? "https://api.pexels.com/v1/search"
        : "https://api.pexels.com/videos/search";

      const params = new URLSearchParams({
        query,
        per_page: count.toString(),
      });
      
      if (type === "image" && orientation) {
        params.append("orientation", orientation);
      }

      const headers = {
        Authorization: pexelsApiKey,
      };

      const response = await fetch(`${endpoint}?${params}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();

      if (type === "image") {
        // Parse image results
        const photos = data.photos || [];
        for (const photo of photos) {
          mediaUrls.push({
            url: photo.src?.large || photo.src?.medium || photo.src?.original,
            width: photo.width,
            height: photo.height,
          });
        }
      } else {
        // Parse video results
        const videos = data.videos || [];
        for (const video of videos) {
          // Get the best quality video file
          const videoFiles = video.video_files || [];
          const bestFile = videoFiles.sort((a: any, b: any) => b.quality - a.quality)[0] || videoFiles[0];
          
          if (bestFile) {
            mediaUrls.push({
              url: bestFile.link,
              width: bestFile.width,
              height: bestFile.height,
              duration: video.duration,
            });
          }
        }
      }

      res.json(mediaUrls);
    } catch (error: any) {
      console.error("[Media Search] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to search media" });
    }
  });

  /**
   * POST /api/admin/social/video/generate
   * Generate video - user chooses between AI-generated or stock video
   */
  app.post("/api/admin/social/video/generate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        source: z.enum(["ai", "stock"]).default("stock"),
        style: z.string().optional(),
        description: z.string().optional(),
      });
      const { topic, source, style, description } = schema.parse(req.body);

      console.log(`[Video Generate] Generating video: ${topic}, source: ${source}`);

      if (source === "stock") {
        // Stock video from Pexels
        const pexelsApiKey = process.env.PEXELS_API_KEY;
        
        if (!pexelsApiKey) {
          return res.status(400).json({ 
            error: "PEXELS_API_KEY not configured. Please set it in environment variables or choose 'ai' source." 
          });
        }

        // Search for stock videos
        const searchQuery = description || topic;
        const endpoint = "https://api.pexels.com/videos/search";
        const params = new URLSearchParams({
          query: searchQuery,
          per_page: "5",
        });

        const headers = {
          Authorization: pexelsApiKey,
        };

        const response = await fetch(`${endpoint}?${params}`, { headers });
        
        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();
        const videos = data.videos || [];

        if (videos.length === 0) {
          return res.status(404).json({ 
            error: "No stock videos found for this topic. Try a different description or use 'ai' source." 
          });
        }

        // Return the best stock video
        const bestVideo = videos[0];
        const bestFile = (bestVideo.video_files || [])
          .sort((a: any, b: any) => b.width * b.height - a.width * a.height)[0];

        res.json({
          source: "stock",
          topic,
          video: {
            url: bestFile?.link,
            width: bestFile?.width,
            height: bestFile?.height,
            duration: bestVideo.duration,
            thumbnail: bestVideo.image,
          },
          message: "Stock video from Pexels",
        });

      } else {
        // AI-generated video
        const aiAgents = new AIAgentService();
        
        const videoDesc = description || `${topic} - ${style || 'lifestyle'} social media video`;
        
        const videoResult = await aiAgents.generateVideo(videoDesc, style || "cinematic");

        res.json({
          source: "ai",
          topic,
          video: {
            url: videoResult.url,
            description: videoDesc,
          },
          message: "AI-generated video",
        });
      }
    } catch (error: any) {
      console.error("[Video Generate] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate video" });
    }
  });

  /**
   * POST /api/admin/social/carousel/generate
   * Generate carousel slides (creates slide images from prompts)
   */
  app.post("/api/admin/social/carousel/generate", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(1, "Topic is required"),
        style: z.string().min(1, "Style is required"),
        slides: z.array(z.any()).min(1, "At least one slide is required"),
      });
      const { topic, style, slides } = schema.parse(req.body);

      // Generate carousel using the service
      const carouselResult = await socialGenerator.generateCarousel(topic, style);

      // If we have image generation capability through AI agents, generate images for each slide
      const slideUrls: string[] = [];
      
      // Use existing image generation if available
      if (aiAgentService && carouselResult.slides.length > 0) {
        for (const slide of carouselResult.slides) {
          try {
            const prompt = slide.image_prompt || `${topic} - ${slide.title}`;
            const result = await aiAgentService.generateImage(prompt, style);
            
            const filename = crypto.randomUUID() + ".png";
            const filePath = path.join(uploadsDir, filename);
            const buffer = Buffer.from(result.base64, "base64");
            fs.writeFileSync(filePath, buffer);
            
            slideUrls.push(`/uploads/social-media/${filename}`);
          } catch (imgError: any) {
            console.warn("[Carousel] Failed to generate slide image:", imgError.message);
            // Continue with other slides
          }
        }
      }

      // If no AI-generated images, return the script-generated files
      if (slideUrls.length === 0 && carouselResult.image_files.length > 0) {
        // Return the files from the output directory
        res.json(carouselResult.image_files.map((f: string) => {
          // Convert absolute path to accessible URL
          const filename = path.basename(f);
          return `/uploads/social-media/${filename}`;
        }));
      } else {
        res.json(slideUrls);
      }
    } catch (error: any) {
      console.error("[Carousel Generate] Error:", error.message);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to generate carousel" });
    }
  });

  // ============ YOUTUBE IMPORT ============

  app.post("/api/admin/social/media/from-youtube", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().min(1, "YouTube URL is required"),
      });
      const { url } = schema.parse(req.body);

      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (!videoIdMatch) {
        return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid YouTube video or Shorts link." });
      }
      const videoId = videoIdMatch[1];

      // Fetch metadata via YouTube oEmbed API
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (!oembedRes.ok) {
        return res.status(400).json({ error: "Could not fetch video metadata. The video may be private or unavailable." });
      }
      const oembedData = (await oembedRes.json()) as any;

      // Download the highest resolution thumbnail available
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      let thumbBuffer: Buffer;
      try {
        const thumbRes = await fetch(thumbnailUrl);
        if (!thumbRes.ok) throw new Error("maxres not available");
        thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
      } catch {
        // Fallback to hqdefault
        const fallbackRes = await fetch(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        thumbBuffer = Buffer.from(await fallbackRes.arrayBuffer());
      }

      const thumbFilename = crypto.randomUUID() + ".jpg";
      const thumbPath = path.join(uploadsDir, thumbFilename);
      fs.writeFileSync(thumbPath, thumbBuffer);

      res.json({
        thumbnailUrl: `/uploads/social-media/${thumbFilename}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: oembedData.title || "",
        author: oembedData.author_name || "",
        videoId,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to import YouTube video" });
    }
  });

  // ============ APPROVAL WORKFLOW ENDPOINTS ============

  // GET /api/{admin|portal}/social/approval-requests — List approval requests (P3-B005)
  app.get("/api/admin/social/approval-requests", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const approvals = await storage.getApprovalRequests({ status: status !== 'all' ? status : undefined });
      res.json({ approvals });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list approval requests" });
    }
  });

  app.get("/api/portal/social/approval-requests", requirePortalAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const approvals = await storage.getApprovalRequests({ status: status !== 'all' ? status : undefined });
      res.json({ approvals });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list approval requests" });
    }
  });

  // POST /api/{admin|portal}/social/posts/:id/request-approval
  app.post("/api/admin/social/posts/:id/request-approval", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.approvalStatus === "pending") {
        return res.status(400).json({ error: "Post is already pending approval" });
      }

      // Update post approval status
      const updated = await storage.updateSocialPost(postId, { approvalStatus: "pending" } as any);

      // Create an approval record
      const approval = await storage.createPostApproval({
        postId,
        approverId: null,
        status: "pending",
        comments: (req.body as any)?.comments || null,
      });

      // Create default approval chain if provided
      const chain = (req.body as any)?.chain;
      if (Array.isArray(chain)) {
        for (let i = 0; i < chain.length; i++) {
          await storage.createApprovalChainStep({
            postId,
            chainOrder: i + 1,
            approverRole: chain[i].role || "reviewer",
            approverId: chain[i].approverId || null,
            required: chain[i].required !== false,
            status: "pending",
            comments: null,
          });
        }
      }

      // Fire-and-forget: send email notification to approvers
      const postContent = typeof post.content === 'string' ? post.content : '';
      const postTitle = postContent.substring(0, 60) + (postContent.length > 60 ? '…' : '');
      if (Array.isArray(chain)) {
        for (const step of chain) {
          if (step.approverId) {
            approvalNotifications.sendNotification({
              type: 'request_received',
              recipientEmail: step.approverId, // In production, resolve to email
              recipientName: step.role || 'Reviewer',
              postTitle,
              postContent,
              actorName: 'Admin',
              postId,
            }).catch(() => {}); // non-blocking
          }
        }
      }

      res.json({ post: updated, approval });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to request approval" });
    }
  });

  app.post("/api/portal/social/posts/:id/request-approval", requirePortalAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const portalUser = (req.session as any).portalUser;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.clientId !== portalUser.clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (post.approvalStatus === "pending") {
        return res.status(400).json({ error: "Post is already pending approval" });
      }

      const updated = await storage.updateSocialPost(postId, { approvalStatus: "pending" } as any);
      const approval = await storage.createPostApproval({
        postId,
        approverId: null,
        status: "pending",
        comments: (req.body as any)?.comments || null,
      });

      res.json({ post: updated, approval });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to request approval" });
    }
  });

  // POST /api/{admin|portal}/social/posts/:id/approve
  app.post("/api/admin/social/posts/:id/approve", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const userId = (req.user as any)?.id || "admin";
      const comments = (req.body as any)?.comments || null;

      // Record the approval action
      await storage.createPostApproval({ postId, approverId: userId, status: "approved", comments });

      // Update any pending chain steps for this approver
      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "approved",
          respondedAt: new Date(),
          comments,
        });
      }

      // Check if all required chain steps are approved
      const updatedChain = await storage.getApprovalChain(postId);
      const allRequiredApproved = updatedChain
        .filter(s => s.required)
        .every(s => s.status === "approved");

      const newStatus = (updatedChain.length === 0 || allRequiredApproved) ? "approved" : "pending";
      const updated = await storage.updateSocialPost(postId, { approvalStatus: newStatus } as any);

      // Fire-and-forget: notify post author of approval
      if (newStatus === "approved") {
        const postContent = typeof post.content === 'string' ? post.content : '';
        approvalNotifications.sendNotification({
          type: 'approved',
          recipientEmail: 'author', // In production, resolve from post.createdBy
          recipientName: 'Author',
          postTitle: postContent.substring(0, 60),
          postContent,
          actorName: userId,
          comments: comments || undefined,
          postId,
        }).catch(() => {});
      }

      res.json({ post: updated, status: newStatus });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to approve post" });
    }
  });

  app.post("/api/portal/social/posts/:id/approve", requirePortalAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const portalUser = (req.session as any).portalUser;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.clientId !== portalUser.clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const comments = (req.body as any)?.comments || null;
      await storage.createPostApproval({ postId, approverId: portalUser.id, status: "approved", comments });

      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "approved",
          respondedAt: new Date(),
          comments,
        });
      }

      const updatedChain = await storage.getApprovalChain(postId);
      const allRequiredApproved = updatedChain.filter(s => s.required).every(s => s.status === "approved");
      const newStatus = (updatedChain.length === 0 || allRequiredApproved) ? "approved" : "pending";
      const updated = await storage.updateSocialPost(postId, { approvalStatus: newStatus } as any);

      res.json({ post: updated, status: newStatus });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to approve post" });
    }
  });

  // POST /api/{admin|portal}/social/posts/:id/reject
  app.post("/api/admin/social/posts/:id/reject", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const userId = (req.user as any)?.id || "admin";
      const comments = (req.body as any)?.comments || null;

      await storage.createPostApproval({ postId, approverId: userId, status: "rejected", comments });

      // Update chain step
      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "rejected",
          respondedAt: new Date(),
          comments,
        });
      }

      const updated = await storage.updateSocialPost(postId, { approvalStatus: "rejected" } as any);
      res.json({ post: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reject post" });
    }
  });

  app.post("/api/portal/social/posts/:id/reject", requirePortalAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const portalUser = (req.session as any).portalUser;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.clientId !== portalUser.clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const comments = (req.body as any)?.comments || null;
      await storage.createPostApproval({ postId, approverId: portalUser.id, status: "rejected", comments });

      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "rejected",
          respondedAt: new Date(),
          comments,
        });
      }

      const updated = await storage.updateSocialPost(postId, { approvalStatus: "rejected" } as any);
      res.json({ post: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to reject post" });
    }
  });

  // POST /api/{admin|portal}/social/posts/:id/request-changes
  app.post("/api/admin/social/posts/:id/request-changes", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const userId = (req.user as any)?.id || "admin";
      const comments = (req.body as any)?.comments || null;

      await storage.createPostApproval({ postId, approverId: userId, status: "changes_requested", comments });

      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "changes_requested",
          respondedAt: new Date(),
          comments,
        });
      }

      const updated = await storage.updateSocialPost(postId, { approvalStatus: "changes_requested" } as any);
      res.json({ post: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to request changes" });
    }
  });

  app.post("/api/portal/social/posts/:id/request-changes", requirePortalAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const portalUser = (req.session as any).portalUser;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.clientId !== portalUser.clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (post.approvalStatus !== "pending") {
        return res.status(400).json({ error: "Post is not pending approval" });
      }

      const comments = (req.body as any)?.comments || null;
      await storage.createPostApproval({ postId, approverId: portalUser.id, status: "changes_requested", comments });

      const chain = await storage.getApprovalChain(postId);
      const pendingStep = chain.find(s => s.status === "pending");
      if (pendingStep) {
        await storage.updateApprovalChainStep(pendingStep.id, {
          status: "changes_requested",
          respondedAt: new Date(),
          comments,
        });
      }

      const updated = await storage.updateSocialPost(postId, { approvalStatus: "changes_requested" } as any);
      res.json({ post: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to request changes" });
    }
  });

  // GET /api/{admin|portal}/social/posts/:id/approval-history
  app.get("/api/admin/social/posts/:id/approval-history", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const [approvals, chain] = await Promise.all([
        storage.getPostApprovals(postId),
        storage.getApprovalChain(postId),
      ]);
      res.json({ approvals, chain });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get approval history" });
    }
  });

  app.get("/api/portal/social/posts/:id/approval-history", requirePortalAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const portalUser = (req.session as any).portalUser;
      const post = await storage.getSocialPostById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.clientId !== portalUser.clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const [approvals, chain] = await Promise.all([
        storage.getPostApprovals(postId),
        storage.getApprovalChain(postId),
      ]);
      res.json({ approvals, chain });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get approval history" });
    }
  });

  // ============ HASHTAG ANALYTICS ENDPOINTS ============

  // GET /api/{admin|portal}/social/analytics/hashtags
  app.get("/api/admin/social/analytics/hashtags", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const topHashtags = await storage.getTopHashtags({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json({ hashtags: topHashtags });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get hashtag analytics" });
    }
  });

  app.get("/api/portal/social/analytics/hashtags", requirePortalAuth, async (req, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const topHashtags = await storage.getTopHashtags({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json({ hashtags: topHashtags });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get hashtag analytics" });
    }
  });

  // GET /api/{admin|portal}/social/analytics/hashtags/:tag
  app.get("/api/admin/social/analytics/hashtags/:tag", requireAuth, async (req, res) => {
    try {
      const hashtag = decodeURIComponent(req.params.tag);
      const { startDate, endDate } = req.query;
      const metrics = await storage.getHashtagMetrics({
        hashtag,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ hashtag, metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get hashtag metrics" });
    }
  });

  app.get("/api/portal/social/analytics/hashtags/:tag", requirePortalAuth, async (req, res) => {
    try {
      const hashtag = decodeURIComponent(req.params.tag);
      const { startDate, endDate } = req.query;
      const metrics = await storage.getHashtagMetrics({
        hashtag,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ hashtag, metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get hashtag metrics" });
    }
  });

  // ============ HASHTAG SUGGESTIONS (P3-B010) ============

  // POST /api/{admin|portal}/social/analytics/hashtags/suggest
  app.post("/api/admin/social/analytics/hashtags/suggest", requireAuth, async (req, res) => {
    try {
      const { suggestHashtags } = await import("./services/hashtag-suggestions");
      const { content, platforms } = req.body;
      const suggestions = await suggestHashtags({ content, platforms });
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to suggest hashtags" });
    }
  });

  app.post("/api/portal/social/analytics/hashtags/suggest", requirePortalAuth, async (req, res) => {
    try {
      const { suggestHashtags } = await import("./services/hashtag-suggestions");
      const { content, platforms } = req.body;
      const suggestions = await suggestHashtags({ content, platforms });
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to suggest hashtags" });
    }
  });

  // ============ PREDICTION API ENDPOINTS (P3-B008) ============

  // POST /api/{admin|portal}/social/ai/predict-performance
  app.post("/api/admin/social/ai/predict-performance", requireAuth, async (req, res) => {
    try {
      const { postPredictor } = await import("./services/post-predictor");
      const { content, platforms, hashtags, mediaUrls, scheduledAt, clientId } = req.body;

      if (!content || !platforms || !Array.isArray(platforms)) {
        return res.status(400).json({ error: "content and platforms[] are required" });
      }

      const result = await postPredictor.predict({
        content,
        platforms,
        hashtags: hashtags || [],
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt || null,
        clientId: clientId || undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to predict performance" });
    }
  });

  app.post("/api/portal/social/ai/predict-performance", requirePortalAuth, async (req, res) => {
    try {
      const { postPredictor } = await import("./services/post-predictor");
      const portalUser = (req.session as any).portalUser;
      const { content, platforms, hashtags, mediaUrls, scheduledAt } = req.body;

      if (!content || !platforms || !Array.isArray(platforms)) {
        return res.status(400).json({ error: "content and platforms[] are required" });
      }

      const result = await postPredictor.predict({
        content,
        platforms,
        hashtags: hashtags || [],
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt || null,
        clientId: portalUser?.clientId,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to predict performance" });
    }
  });

  // GET /api/{admin|portal}/social/ai/predictions/:postId
  app.get("/api/admin/social/ai/predictions/:postId", requireAuth, async (req, res) => {
    try {
      const prediction = await storage.getPredictionByPostId(req.params.postId);
      if (!prediction) return res.status(404).json({ error: "No prediction found for this post" });
      res.json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get prediction" });
    }
  });

  app.get("/api/portal/social/ai/predictions/:postId", requirePortalAuth, async (req, res) => {
    try {
      const prediction = await storage.getPredictionByPostId(req.params.postId);
      if (!prediction) return res.status(404).json({ error: "No prediction found for this post" });
      res.json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get prediction" });
    }
  });

  // POST /api/{admin|portal}/social/ai/predictions/track
  app.post("/api/admin/social/ai/predictions/track", requireAuth, async (req, res) => {
    try {
      const { postId, predictedScore, confidence, factors } = req.body;
      if (!postId || predictedScore == null) {
        return res.status(400).json({ error: "postId and predictedScore are required" });
      }

      const record = await storage.createPredictionRecord({
        postId,
        predictedScore: String(predictedScore),
        confidence: confidence != null ? String(confidence) : null,
        factors: factors || null,
        actualScore: null,
        actualMeasuredAt: null,
        predictedAt: new Date(),
      });

      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to track prediction" });
    }
  });

  app.post("/api/portal/social/ai/predictions/track", requirePortalAuth, async (req, res) => {
    try {
      const { postId, predictedScore, confidence, factors } = req.body;
      if (!postId || predictedScore == null) {
        return res.status(400).json({ error: "postId and predictedScore are required" });
      }

      const record = await storage.createPredictionRecord({
        postId,
        predictedScore: String(predictedScore),
        confidence: confidence != null ? String(confidence) : null,
        factors: factors || null,
        actualScore: null,
        actualMeasuredAt: null,
        predictedAt: new Date(),
      });

      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to track prediction" });
    }
  });

  // GET /api/{admin|portal}/social/ai/prediction-accuracy
  app.get("/api/admin/social/ai/prediction-accuracy", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const records = await storage.getPredictionAccuracy({ limit });

      // Calculate accuracy metrics
      const withActuals = records.filter(r => r.actualScore != null);
      let avgError = 0;
      let totalAccuracy = 0;

      if (withActuals.length > 0) {
        const errors = withActuals.map(r => Math.abs(Number(r.predictedScore) - Number(r.actualScore)));
        avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        totalAccuracy = Math.max(0, 100 - (avgError / 10) * 100);
      }

      res.json({
        avgError: Math.round(avgError * 100) / 100,
        predictionCount: records.length,
        accuracy: Math.round(totalAccuracy * 10) / 10,
        recentAccuracy: withActuals.slice(0, 20).map(r => ({
          postId: r.postId,
          predicted: Number(r.predictedScore),
          actual: Number(r.actualScore),
          error: Math.abs(Number(r.predictedScore) - Number(r.actualScore)),
          predictedAt: r.predictedAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get prediction accuracy" });
    }
  });

  app.get("/api/portal/social/ai/prediction-accuracy", requirePortalAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const records = await storage.getPredictionAccuracy({ limit });

      const withActuals = records.filter(r => r.actualScore != null);
      let avgError = 0;
      let totalAccuracy = 0;

      if (withActuals.length > 0) {
        const errors = withActuals.map(r => Math.abs(Number(r.predictedScore) - Number(r.actualScore)));
        avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        totalAccuracy = Math.max(0, 100 - (avgError / 10) * 100);
      }

      res.json({
        avgError: Math.round(avgError * 100) / 100,
        predictionCount: records.length,
        accuracy: Math.round(totalAccuracy * 10) / 10,
        recentAccuracy: withActuals.slice(0, 20).map(r => ({
          postId: r.postId,
          predicted: Number(r.predictedScore),
          actual: Number(r.actualScore),
          error: Math.abs(Number(r.predictedScore) - Number(r.actualScore)),
          predictedAt: r.predictedAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get prediction accuracy" });
    }
  });

  // ============ NOTIFICATION PREFERENCES ENDPOINTS (P3-B009) ============

  // GET /api/{admin|portal}/social/notification-preferences
  app.get("/api/admin/social/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || "admin";
      const prefs = await storage.getNotificationPreferences(userId);
      res.json(prefs || {
        emailOnApprovalRequest: true,
        emailOnApprovalResponse: true,
        emailOnChangesRequested: true,
        inAppNotifications: true,
        emailAddress: null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get notification preferences" });
    }
  });

  app.get("/api/portal/social/notification-preferences", requirePortalAuth, async (req, res) => {
    try {
      const portalUser = (req.session as any).portalUser;
      const prefs = await storage.getNotificationPreferences(portalUser.id);
      res.json(prefs || {
        emailOnApprovalRequest: true,
        emailOnApprovalResponse: true,
        emailOnChangesRequested: true,
        inAppNotifications: true,
        emailAddress: portalUser.email || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get notification preferences" });
    }
  });

  // PUT /api/{admin|portal}/social/notification-preferences
  app.put("/api/admin/social/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id || "admin";
      const prefs = await storage.upsertNotificationPreferences({
        userId,
        userType: 'admin',
        ...req.body,
      });
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update notification preferences" });
    }
  });

  app.put("/api/portal/social/notification-preferences", requirePortalAuth, async (req, res) => {
    try {
      const portalUser = (req.session as any).portalUser;
      const prefs = await storage.upsertNotificationPreferences({
        userId: portalUser.id,
        userType: 'portal',
        ...req.body,
      });
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update notification preferences" });
    }
  });

  console.log("[SOCIAL MEDIA] Routes registered (Phase 3: approval workflow + hashtag analytics + predictions + notifications)");
}
