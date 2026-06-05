import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { IStorage } from "../storage";
import type { AiAgent, AiAgentTask, SocialPost, BrandVoiceProfile, TrainingFeedback } from "@shared/schema";
import { execSync, execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { scrapeUrl, extractScrapeUrl, formatScrapedDataForAI, type ScrapedData } from "./url-scraper";

const execFileAsync = promisify(execFile);

let infshBootstrapped = false;
async function ensureInfshCli(): Promise<string> {
  const home = process.env.HOME || "/home/runner";
  const binDir = path.join(home, ".local", "bin");
  const infshBin = path.join(binDir, "infsh");

  if (fs.existsSync(infshBin)) {
    if (!infshBootstrapped) {
      console.log(`[AI VIDEO INFSH] CLI found at ${infshBin}`);
      infshBootstrapped = true;
    }
    return infshBin;
  }

  console.log("[AI VIDEO INFSH] CLI not found, installing...");
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  try {
    execSync("curl -fsSL https://inference.sh/install.sh | sh", {
      env: { ...process.env, HOME: home },
      timeout: 30000,
      stdio: "pipe",
    });
  } catch (e: any) {
    throw new Error(`Failed to install infsh CLI: ${e.message}`);
  }

  if (!fs.existsSync(infshBin)) {
    throw new Error("infsh CLI install script succeeded but binary not found");
  }
  console.log("[AI VIDEO INFSH] CLI installed successfully");
  infshBootstrapped = true;
  return infshBin;
}

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

// Dedicated Gemini client for Veo video generation.
// Uses GEMINI_VEO_API_KEY if provided (for Veo 3 preview access),
// otherwise falls back to the standard integration key.
const geminiVeo = new GoogleGenAI({
  apiKey: process.env.GEMINI_VEO_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
});

function extractSearchKeywords(briefing: string): string {
  const parenMatch = briefing.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const terms = parenMatch[1]
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (terms.length > 0) {
      console.log(`[YouTube] Using user-specified search terms: ${terms.join(", ")}`);
      return terms.join(" ");
    }
  }

  let cleaned = briefing
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(include|find|research|write|create|post|let|users|know|go to|free|estimates|any|needs|relevent|relevant|video|youtube|shorts?|from|the|and|for|about|with|that|this|make|sure|give|examples?|around|issues?|problems?|may|have|try|also|please|can|should|will|want|need)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter((w) => w.length > 2).slice(0, 5);
  return words.join(" ") || briefing.slice(0, 50);
}

function stripYoutubePlaceholders(content: string): string {
  return content
    .replace(/\[YouTube\s*(Video\s*)?(Link|URL|Short)\]/gi, "")
    .replace(/\(YouTube\s*(Video\s*)?(Link|URL|Short)\)/gi, "")
    .replace(/Check out this insightful video[^:]*:\s*\[?YouTube[^\]]*\]?/gi, "")
    .replace(/Check out our video:?\s*\[?YouTube[^\]]*\]?/gi, "")
    .replace(/here:?\s*\[?YouTube[^\]]*\]?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function searchYouTubeShorts(
  query: string,
  maxResults: number = 3
): Promise<Array<{ title: string; url: string; relevance: string }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log("[YouTube] No YOUTUBE_API_KEY set, skipping Shorts search. Ensure the secret is configured.");
    return [];
  }

  const searchQuery = extractSearchKeywords(query);
  console.log(`[YouTube] Searching for Shorts matching: "${searchQuery}" (extracted from briefing)`)

  try {
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: searchQuery,
      type: "video",
      videoDuration: "short",
      maxResults: String(Math.min(maxResults * 3, 15)),
      key: apiKey,
      order: "relevance",
    });

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("[YouTube] Search API error:", searchRes.status, errText);
      return [];
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) return [];

    const videoIds = items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId)
      .join(",");
    if (!videoIds) return [];
    const detailsParams = new URLSearchParams({
      part: "contentDetails,snippet",
      id: videoIds,
      key: apiKey,
    });

    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${detailsParams}`
    );
    if (!detailsRes.ok) {
      console.error("[YouTube] Videos API error:", detailsRes.status);
      return items.slice(0, maxResults).map((item: any) => ({
        title: item.snippet?.title || "YouTube Short",
        url: `https://www.youtube.com/shorts/${item.id.videoId}`,
        relevance: item.snippet?.description?.slice(0, 100) || "Related short video",
      }));
    }

    const detailsData = await detailsRes.json();
    const shorts: Array<{ title: string; url: string; relevance: string }> = [];

    for (const video of detailsData.items || []) {
      const duration = video.contentDetails?.duration || "";
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds <= 60) {
          shorts.push({
            title: video.snippet?.title || "YouTube Short",
            url: `https://www.youtube.com/shorts/${video.id}`,
            relevance: video.snippet?.description?.slice(0, 120) || "Related short video",
          });
        }
      }

      if (shorts.length >= maxResults) break;
    }

    if (shorts.length === 0 && items.length > 0) {
      return items.slice(0, maxResults).map((item: any) => ({
        title: item.snippet?.title || "YouTube Short",
        url: `https://www.youtube.com/shorts/${item.id.videoId}`,
        relevance: item.snippet?.description?.slice(0, 120) || "Related short video",
      }));
    }

    console.log(`[YouTube] Found ${shorts.length} real Shorts for query: "${query}"`);
    return shorts;
  } catch (err: any) {
    console.error("[YouTube] Search error:", err.message);
    return [];
  }
}

function safeJsonParse(text: string, fallback: any = {}): any {
  try {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export class AIAgentService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async runAgent(
    agentRole: string,
    taskType: string,
    input: any,
    clientId?: string,
    postId?: string,
    campaignId?: string
  ): Promise<AiAgentTask> {
    const agent = await this.storage.getAiAgentByRole(agentRole);

    const agentId = agent?.id ?? "unknown";
    const systemPrompt = agent?.systemPrompt ?? `You are an AI ${agentRole} agent. Respond with valid JSON.`;

    let task: AiAgentTask;
    try {
      task = await this.storage.createAiAgentTask({
        agentId,
        clientId: clientId ?? null,
        taskType,
        input,
        status: "processing",
        postId: postId ?? null,
        campaignId: campaignId ?? null,
      });
    } catch (createError) {
      console.error(`Failed to create AI agent task for ${agentRole}:`, createError);
      return {
        id: `temp_${Date.now()}`,
        agentId,
        clientId: clientId ?? null,
        taskType,
        input,
        output: { error: createError instanceof Error ? createError.message : "Task creation failed" },
        status: "failed",
        parentTaskId: null,
        postId: postId ?? null,
        campaignId: campaignId ?? null,
        createdAt: new Date(),
        completedAt: new Date(),
      } as AiAgentTask;
    }

    if (!task || !task.id) {
      console.error(`AI agent task creation returned empty result for ${agentRole}`);
      return {
        id: `temp_${Date.now()}`,
        agentId,
        clientId: clientId ?? null,
        taskType,
        input,
        output: { error: "Task creation returned empty result" },
        status: "failed",
        parentTaskId: null,
        postId: postId ?? null,
        campaignId: campaignId ?? null,
        createdAt: new Date(),
        completedAt: new Date(),
      } as AiAgentTask;
    }

    try {
      const userContent = typeof input === "string" ? input : JSON.stringify(input);
      const geminiResponse = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userContent}\n\nIMPORTANT: You must respond with valid JSON only. Do not include markdown code fences. Do not hallucinate or fabricate information — if you don't know something, say so honestly. Base your response on real, verifiable knowledge.` }],
          },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const content = geminiResponse.text ?? "{}";
      const output = safeJsonParse(content);

      const updatedTask = await this.storage.updateAiAgentTask(task.id, {
        output,
        status: "completed",
        completedAt: new Date(),
      });

      return updatedTask ?? task;
    } catch (error) {
      console.error(`AI agent ${agentRole} task failed:`, error);

      try {
        const failedTask = await this.storage.updateAiAgentTask(task.id, {
          output: { error: error instanceof Error ? error.message : "Unknown error" },
          status: "failed",
          completedAt: new Date(),
        });
        return failedTask ?? task;
      } catch (updateError) {
        console.error(`Failed to update task status for ${agentRole}:`, updateError);
        return task;
      }
    }
  }

  async generatePost(
    prompt: string,
    platforms: string[],
    clientId?: string,
    campaignId?: string,
    brandVoice?: BrandVoiceProfile
  ): Promise<{ content: string; hashtags: string[]; platformVersions: Record<string, string>; posts: any }> {
    let brandVoiceGuidelines = "No specific brand voice provided. Use a professional, engaging tone.";
    if (brandVoice) {
      brandVoiceGuidelines = `Brand Voice Profile: "${brandVoice.name || "Custom"}"
- Tone: ${brandVoice.tone ?? "Not specified"}
- Style: ${brandVoice.style ?? "Not specified"}
- Key vocabulary to use: ${brandVoice.vocabulary?.join(", ") ?? "None specified"}
- Words/phrases to AVOID: ${brandVoice.avoidWords?.join(", ") ?? "None specified"}
- Example posts that represent this voice: ${brandVoice.examplePosts?.join(" | ") ?? "None provided"}`;
    }

    const systemPrompt = `You are an expert social media copywriter who has grown accounts to 100K+ followers on every major platform. You write posts that feel native — not like AI-generated marketing copy.

# PLATFORM RULES (non-negotiable)

INSTAGRAM:
- Lead with a scroll-stopping first line (no "Hey!" or "Are you...?" openers)
- 3-7 sentences max in the caption body
- Use line breaks for readability (not walls of text)
- End with a question or soft CTA
- 5-15 hashtags in the first comment style (add note: "add these to first comment")
- Use sparingly, purposefully — 2-5 max

FACEBOOK:
- Longer form is OK; tell a story or share a useful tip list
- Conversational tone, like a trusted friend
- One clear CTA at the end
- 1-3 hashtags only
- Natural, not excessive

LINKEDIN:
- Hook in first line that creates pattern interrupt
- Professional insight, not a press release
- Use short paragraphs (1-2 sentences each)
- End with a thought-provoking question to drive comments
- 3-5 hashtags, professional ones
- NO excessive emoji — 0-2 max

X (TWITTER):
- 280 characters MAX for the main tweet
- Punchy, opinionated, or surprising angle
- If thread: each tweet standalone readable
- 0-2 hashtags only
- Hook = the whole game here

YOUTUBE:
- Title-optimized description with keywords
- Include timestamps if applicable
- Conversational but informative

# RULES FOR ALL PLATFORMS
- NEVER start a post with "Are you looking for..." or "In today's fast-paced world..."
- NEVER use the phrase "game-changer", "dive into", "leverage", or "synergy"
- Write for a real human, not an algorithm
- Match the brand voice guidelines provided below

# BRAND VOICE GUIDELINES
${brandVoiceGuidelines}

# OUTPUT FORMAT (strict JSON)
{
  "posts": {
    "instagram": {
      "caption": "...",
      "hashtags": ["..."],
      "hashtag_placement": "first_comment",
      "cta": "..."
    },
    "facebook": { "body": "...", "hashtags": ["..."], "cta": "..." },
    "linkedin": { "body": "...", "hashtags": ["..."], "cta": "..." },
    "x": { "tweet": "...", "thread": ["...", "..."] },
    "youtube": { "description": "...", "hashtags": ["..."] }
  }
}
Only include the following platforms: ${platforms.join(", ")}. Return valid JSON only. No markdown. No preamble.`;

    const input = {
      prompt,
      platforms,
      instructions: systemPrompt,
    };

    const task = await this.runAgent("post", "generate_post", input, clientId, undefined, campaignId);

    const output = task.output as any;
    if (output?.error) {
      return {
        content: prompt,
        hashtags: [],
        platformVersions: platforms.reduce((acc, p) => ({ ...acc, [p]: prompt }), {}),
        posts: {},
      };
    }

    const postsObj = output?.posts || {};
    let mainContent = "";
    const allHashtags: string[] = [];
    const platformVersions: Record<string, string> = {};

    for (const p of platforms) {
      const pData = postsObj[p];
      if (!pData) continue;
      const text = pData.caption || pData.body || pData.tweet || pData.description || "";
      platformVersions[p] = text;
      if (!mainContent && text) mainContent = text;
      const tags = pData.hashtags || [];
      for (const t of tags) {
        const clean = t.replace(/^#/, "");
        if (!allHashtags.includes(clean)) allHashtags.push(clean);
      }
    }

    if (!mainContent) mainContent = output?.content || prompt;

    return {
      content: mainContent,
      hashtags: allHashtags.length > 0 ? allHashtags : (Array.isArray(output?.hashtags) ? output.hashtags : []),
      platformVersions: Object.keys(platformVersions).length > 0
        ? platformVersions
        : platforms.reduce((acc, p) => ({ ...acc, [p]: mainContent }), {}),
      posts: postsObj,
    };
  }

  async researchTrends(
    topic: string,
    platforms: string[],
    clientId?: string,
    includeYouTubeShorts = true
  ): Promise<{
    trends: any[];
    suggestions: string[];
    optimalTimes: any;
    youtubeShorts: Array<{ title: string; url: string; relevance: string }>;
    trendingTopics: string[];
    contentIdeas: string[];
    bestHashtags: string[];
    content_angles: string[];
    platforms_research: any;
    cautions: string[];
    research_confidence: string;
  }> {
    const platformList = platforms.join(", ");
    const systemPrompt = `You are a social media research analyst. Your job is to analyze a topic and return structured, grounded research to inform post creation.

# CRITICAL RULES — follow exactly or the pipeline will fail
1. NEVER invent statistics, trending topics, or platform data you cannot reason about directly from the topic.
2. If you are uncertain about a trend, label it: [INFERRED] or [LIKELY] — never present guesses as facts.
3. Do NOT fabricate hashtag popularity numbers or engagement rates.
4. Your output must be valid JSON. No markdown. No preamble. No extra text.

# YOUR TASK
Given the user's topic and target platforms, return a research object containing:
- Content angles (3-5 distinct ways to frame this topic)
- Relevant hashtags per platform (real, commonly used ones you are confident about; mark uncertain ones)
- Tone recommendations per platform
- Estimated best posting windows (general knowledge, not fabricated data)
- Content warnings (anything about this topic that could be sensitive or misinterpreted)

# OUTPUT FORMAT (strict JSON)
{
  "topic_summary": "...",
  "content_angles": ["...", "...", "..."],
  "platforms": {
    "instagram": {
      "hashtags": ["#tag1", "#tag2"],
      "hashtag_confidence": "high|medium|low",
      "tone": "...",
      "best_post_window": "..."
    }
  },
  "cautions": ["..."],
  "research_confidence": "high|medium|low",
  "confidence_notes": "..."
}

Only include these platforms: ${platformList}. Return valid JSON only. No markdown.`;

    const input = {
      topic,
      platforms,
      instructions: systemPrompt,
    };

    const [task, youtubeShorts] = await Promise.all([
      this.runAgent("research", "research_trends", input, clientId),
      includeYouTubeShorts ? searchYouTubeShorts(topic, 3) : Promise.resolve([]),
    ]);

    const output = task.output as any;
    if (output?.error) {
      return {
        trends: [], suggestions: [], optimalTimes: {}, youtubeShorts,
        trendingTopics: [], contentIdeas: [], bestHashtags: [],
        content_angles: [], platforms_research: {}, cautions: [],
        research_confidence: "low",
      };
    }

    const contentAngles = Array.isArray(output?.content_angles) ? output.content_angles : [];
    const platformsResearch = output?.platforms || {};
    const cautions = Array.isArray(output?.cautions) ? output.cautions : [];

    const allHashtags: string[] = [];
    const optimalTimes: Record<string, string> = {};
    for (const [p, data] of Object.entries(platformsResearch as Record<string, any>)) {
      if (data?.hashtags) {
        for (const h of data.hashtags) allHashtags.push(String(h).replace(/^#/, ""));
      }
      if (data?.best_post_window) optimalTimes[p] = data.best_post_window;
    }

    const trends = contentAngles.map((angle: string, i: number) => ({
      name: `Angle ${i + 1}`,
      description: angle,
      relevance: "high",
    }));

    return {
      trends,
      suggestions: contentAngles,
      optimalTimes,
      youtubeShorts,
      trendingTopics: contentAngles.slice(0, 3),
      contentIdeas: contentAngles,
      bestHashtags: allHashtags,
      content_angles: contentAngles,
      platforms_research: platformsResearch,
      cautions,
      research_confidence: output?.research_confidence || "medium",
    };
  }

  async getDesignSuggestions(
    content: string,
    platforms: string[],
    clientId?: string
  ): Promise<{
    captions: string[];
    visualSuggestions: string[];
    colorSchemes: any;
    image_prompt: string;
    aspect_ratio: string;
    style: string;
    color_palette: string[];
    mood: string;
    text_overlay_zone: string;
    negative_prompt: string;
    recommendVideo: boolean;
  }> {
    const primaryPlatform = platforms[0] || "instagram";
    const aspectRatioGuide: Record<string, string> = {
      instagram: "1:1 or 4:5",
      facebook: "16:9 or 1.91:1",
      linkedin: "16:9 or 1.91:1",
      x: "16:9",
      youtube: "16:9",
    };

    const systemPrompt = `You are a visual art director specializing in social media content that stops the scroll. You brief image generators with precision.

# YOUR TASK
Based on the post content and platform, produce a detailed visual brief that will be passed directly to an AI image generator. Be extremely specific.

# RULES
- Describe the image as if you're directing a real photographer or designer
- Specify: subject, lighting, color palette, mood, composition, and style
- Avoid vague terms like "beautiful", "modern", or "eye-catching" — describe what creates that effect
- Tailor the aspect ratio to the platform: ${aspectRatioGuide[primaryPlatform] || "16:9"}
- Suggest text overlay zones (where copy could be placed without obscuring focal point)
- Reference a visual style archetype: editorial, cinematic, flat design, lifestyle photography, infographic, etc.
- Also provide alternative visual suggestions and caption options
- If the content would benefit from video, set recommendVideo to true

# OUTPUT FORMAT (strict JSON)
{
  "image_prompt": "Detailed, specific image generation prompt — write this as a direct instruction to the image model...",
  "aspect_ratio": "${aspectRatioGuide[primaryPlatform] || "16:9"}",
  "style": "lifestyle photography | flat design | cinematic | editorial | ...",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "mood": "...",
  "text_overlay_zone": "bottom-third | top | center-left | none",
  "negative_prompt": "blurry, watermark, text, logo, stock photo cliche, generic, oversaturated",
  "captions": ["alternative caption 1", "alternative caption 2"],
  "visualSuggestions": ["detailed visual suggestion 1", "[VIDEO] video suggestion if relevant"],
  "colorSchemes": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
  "recommendVideo": false
}

Return valid JSON only. No markdown. No preamble.`;

    const input = {
      content,
      platforms,
      instructions: systemPrompt,
    };

    const task = await this.runAgent("design", "design_suggestions", input, clientId);

    const output = task.output as any;
    if (output?.error) {
      return {
        captions: [], visualSuggestions: [], colorSchemes: {},
        image_prompt: "", aspect_ratio: "", style: "", color_palette: [],
        mood: "", text_overlay_zone: "", negative_prompt: "", recommendVideo: false,
      };
    }

    return {
      captions: Array.isArray(output?.captions) ? output.captions : [],
      visualSuggestions: Array.isArray(output?.visualSuggestions) ? output.visualSuggestions : [],
      colorSchemes: output?.colorSchemes ?? {},
      image_prompt: output?.image_prompt ?? "",
      aspect_ratio: output?.aspect_ratio ?? "",
      style: output?.style ?? "",
      color_palette: Array.isArray(output?.color_palette) ? output.color_palette : [],
      mood: output?.mood ?? "",
      text_overlay_zone: output?.text_overlay_zone ?? "",
      negative_prompt: output?.negative_prompt ?? "",
      recommendVideo: output?.recommendVideo ?? false,
    };
  }

  async reviewPost(
    content: string,
    platforms: string[],
    clientId?: string,
    brandVoice?: BrandVoiceProfile,
    topic?: string
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    revisedContent: string;
    reviews: any;
    approved_for_publish: boolean;
  }> {
    let feedbackContext = "";
    try {
      const feedbackHistory = await this.storage.getTrainingFeedback(clientId);
      if (feedbackHistory.length > 0) {
        const recentFeedback = feedbackHistory.slice(0, 10);
        feedbackContext = `\n\nPast feedback preferences (use these to calibrate your review):\n${recentFeedback
          .map((f) => `- Type: ${f.feedbackType}, Rating: ${f.rating ?? "N/A"}, Notes: ${f.notes ?? "None"}, Vibe: ${f.vibeDirection ?? "N/A"}`)
          .join("\n")}`;
      }
    } catch {
    }

    let brandVoiceGuidelines = "No specific brand voice provided.";
    if (brandVoice) {
      brandVoiceGuidelines = `Brand: "${brandVoice.name}" | Tone: ${brandVoice.tone ?? "N/A"} | Style: ${brandVoice.style ?? "N/A"} | Vocabulary: ${brandVoice.vocabulary?.join(", ") ?? "N/A"} | Avoid: ${brandVoice.avoidWords?.join(", ") ?? "N/A"}`;
    }

    const systemPrompt = `You are a harsh but fair social media editor. Your job is to score content and rewrite anything below a 7. You are not trying to be nice — you are trying to make content that actually performs.

# SCORING RUBRIC (each dimension 1-10)
1. HOOK STRENGTH — Does the first line make someone stop scrolling?
2. PLATFORM FIT — Does it sound native to this platform, or like a press release?
3. CLARITY — Is the message instantly clear? No jargon, no fluff?
4. ENGAGEMENT TRIGGER — Does it invite a comment, share, or save?
5. BRAND ALIGNMENT — Does it match the specified brand voice?

Overall score = average of all 5. Flag any dimension below 6 as a critical issue.

# RULES
- Be specific in your criticism. "The hook is weak" is not acceptable — explain WHY and FIX it.
- If overall score < 7, rewrite the post in full. Don't just suggest; deliver the improved version.
- If a post uses any of these red-flag phrases, automatically deduct 2 points from Clarity: "game-changer", "dive in", "in today's world", "fast-paced", "leverage", "synergy", "Are you looking for"
- Score each platform separately

# BRAND VOICE
${brandVoiceGuidelines}

# TOPIC
${topic || "Not specified"}
${feedbackContext}

# OUTPUT FORMAT (strict JSON)
{
  "reviews": {
    "platform_name": {
      "scores": { "hook": 8, "platform_fit": 7, "clarity": 9, "engagement": 8, "brand": 7 },
      "overall": 7.8,
      "issues": ["specific issue 1", "specific issue 2"],
      "rewritten_post": null
    }
  },
  "approved_for_publish": true
}

Score platforms: ${platforms.join(", ")}. Set approved_for_publish to true only if ALL platform scores >= 7. If overall < 7, provide rewritten_post. Return valid JSON only. No markdown.`;

    const input = {
      content,
      platforms,
      instructions: systemPrompt,
    };

    const task = await this.runAgent("training", "review_post", input, clientId);

    const output = task.output as any;
    if (output?.error) {
      return {
        score: 5,
        feedback: "Unable to generate review at this time.",
        suggestions: [],
        revisedContent: content,
        reviews: {},
        approved_for_publish: false,
      };
    }

    const reviews = output?.reviews || {};
    let totalScore = 0;
    let platformCount = 0;
    const allIssues: string[] = [];
    let bestRewrite = "";

    for (const [, review] of Object.entries(reviews as Record<string, any>)) {
      if (review?.overall) {
        totalScore += review.overall;
        platformCount++;
      }
      if (review?.issues) allIssues.push(...review.issues);
      if (review?.rewritten_post && !bestRewrite) bestRewrite = review.rewritten_post;
    }

    const avgScore = platformCount > 0 ? Math.round((totalScore / platformCount) * 10) / 10 : (typeof output?.score === "number" ? output.score : 5);

    return {
      score: avgScore,
      feedback: allIssues.length > 0 ? allIssues.join(". ") : (output?.feedback ?? "No feedback available."),
      suggestions: allIssues.length > 0 ? allIssues : (Array.isArray(output?.suggestions) ? output.suggestions : []),
      revisedContent: bestRewrite || output?.revisedContent || content,
      reviews,
      approved_for_publish: output?.approved_for_publish ?? (avgScore >= 7),
    };
  }

  async applyVibeEdit(
    content: string,
    vibeDirection: string,
    clientId?: string
  ): Promise<{ editedContent: string; changes: string[] }> {
    let brandContext = "";
    try {
      if (clientId) {
        const profiles = await this.storage.getBrandVoiceProfiles(clientId);
        if (profiles.length > 0) {
          const profile = profiles[0];
          brandContext = `\n\nBrand voice profile:
- Tone: ${profile.tone ?? "Not specified"}
- Style: ${profile.style ?? "Not specified"}
- Vocabulary to use: ${profile.vocabulary?.join(", ") ?? "None specified"}
- Words to avoid: ${profile.avoidWords?.join(", ") ?? "None specified"}
- Example posts: ${profile.examplePosts?.join(" | ") ?? "None provided"}`;
        }
      }
    } catch {
      // ignore errors loading brand voice
    }

    const input = {
      content,
      vibeDirection,
      instructions: `Edit the following social media post to match the requested vibe direction: "${vibeDirection}".${brandContext}

Return JSON with:
- "editedContent": the revised post with the new vibe applied
- "changes": array of strings describing what was changed and why`,
    };

    const task = await this.runAgent("training", "vibe_edit", input, clientId);

    const output = task.output as any;
    if (output?.error) {
      return {
        editedContent: content,
        changes: ["Unable to apply vibe edit at this time."],
      };
    }

    return {
      editedContent: output?.editedContent ?? content,
      changes: Array.isArray(output?.changes) ? output.changes : [],
    };
  }

  async generateImage(
    description: string,
    style?: string,
    negativePrompt?: string
  ): Promise<{ base64: string; revisedPrompt: string }> {
    const negativeClause = negativePrompt ? ` Avoid: ${negativePrompt}.` : " Avoid: blurry, watermark, text, logo, stock photo cliche, generic, oversaturated.";
    const enhancedPrompt = `${description}. ${style ? `Visual style: ${style}.` : "Professional social media visual, clean composition."}${negativeClause} High quality, suitable for social media marketing.`;

    try {
      console.log("[AI IMAGE] Using Gemini flash-image for image generation");
      const { Modality } = await import("@google/genai");
      
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (imagePart?.inlineData?.data) {
        return {
          base64: imagePart.inlineData.data,
          revisedPrompt: enhancedPrompt,
        };
      }
      throw new Error("No image data in Gemini response");
    } catch (geminiErr: any) {
      console.error("[AI IMAGE] Gemini image generation failed:", geminiErr.message);

      try {
        console.log("[AI IMAGE] Falling back to OpenAI gpt-image-1");
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
        });

        const b64 = response.data?.[0]?.b64_json;
        const revisedPrompt = response.data?.[0]?.revised_prompt || description;

        if (!b64) {
          throw new Error("No image data returned from AI");
        }

        return { base64: b64, revisedPrompt };
      } catch (error: any) {
        console.error("[AI IMAGE] OpenAI fallback also failed:", error.message);
        throw new Error(`Image generation failed: ${error.message}`);
      }
    }
  }

  async generateVideo(
    description: string,
    style?: string,
    duration: number = 15
  ): Promise<{ filePath: string; url: string }> {
    // Tier 1: inference.sh Veo 3.1 Fast (real video WITH audio)
    if (process.env.INFERENCE_API_KEY) {
      try {
        return await this.generateVideoInferenceSh(description, style, duration);
      } catch (err: any) {
        console.error(`[AI VIDEO] inference.sh failed, trying Veo 2: ${err.message}`);
      }
    }
    // Tier 2: Direct Gemini API Veo 2 (real video, no audio)
    try {
      return await this.generateVideoVeo(description, style, duration);
    } catch (err: any) {
      console.error(`[AI VIDEO] Veo 2 failed, falling back to slideshow: ${err.message}`);
    }
    // Tier 3: ffmpeg image slideshow (fallback)
    return await this.generateVideoSlideshow(description, style, duration);
  }

  private async generateVideoInferenceSh(
    description: string,
    style?: string,
    duration: number = 15
  ): Promise<{ filePath: string; url: string }> {
    const uploadsDir = path.join(process.cwd(), "uploads", "social-media");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const apiKey = process.env.INFERENCE_API_KEY;
    if (!apiKey) throw new Error("INFERENCE_API_KEY not set");

    const infshBin = await ensureInfshCli();

    const prompt = style ? `${description}. Visual style: ${style}` : description;
    const durationSec = Math.min(8, Math.max(5, Math.round(duration / 2)));

    console.log(`[AI VIDEO INFSH] Submitting to Veo 3.1 Fast: "${prompt.slice(0, 80)}..." (${durationSec}s, with audio)`);

    const input = JSON.stringify({
      prompt,
      duration_seconds: durationSec,
      aspect_ratio: "16:9",
    });

    const env = { ...process.env, INFSH_API_KEY: apiKey, PATH: `${path.dirname(infshBin)}:${process.env.PATH}` };

    // Step 1: submit job (non-blocking) — uses execFileAsync with arg array (no shell)
    const { stdout: submitOut } = await execFileAsync(
      infshBin,
      ["app", "run", "google/veo-3-1-fast", "--input", input, "--no-wait"],
      { env, timeout: 30000 }
    );

    const taskIdMatch = submitOut.match(/Task submitted:\s*(\S+)/);
    if (!taskIdMatch) throw new Error(`Could not parse task ID from: ${submitOut}`);
    const taskId = taskIdMatch[1];
    console.log(`[AI VIDEO INFSH] Task submitted: ${taskId}`);

    // Step 2: poll until done (max 5 min)
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      let taskData: any;
      try {
        const { stdout: pollOut } = await execFileAsync(
          infshBin,
          ["task", "get", taskId, "--json"],
          { env, timeout: 15000 }
        );

        const jsonStart = pollOut.indexOf("{");
        if (jsonStart === -1) {
          console.log(`[AI VIDEO INFSH] Polling... (${i + 1}/${maxAttempts}) — no JSON yet`);
          continue;
        }
        taskData = JSON.parse(pollOut.slice(jsonStart));
      } catch (parseErr: any) {
        console.log(`[AI VIDEO INFSH] Polling... (${i + 1}/${maxAttempts}) — transient error: ${parseErr.message}`);
        continue;
      }

      console.log(`[AI VIDEO INFSH] Polling... (${i + 1}/${maxAttempts}) status=${taskData.status_text}`);

      if (taskData.status_text === "failed" || taskData.error) {
        throw new Error(`inference.sh task failed: ${JSON.stringify(taskData.error) || "unknown error"}`);
      }

      if (taskData.status_text === "completed" && taskData.output) {
        const videoUrl = taskData.output?.videos?.[0];
        if (!videoUrl) throw new Error("inference.sh returned no video URL");

        console.log(`[AI VIDEO INFSH] Video ready, downloading: ${videoUrl}`);

        const dlRes = await fetch(videoUrl);
        if (!dlRes.ok) throw new Error(`Video download failed (${dlRes.status})`);
        const arrayBuf = await dlRes.arrayBuffer();

        const outputFilename = crypto.randomUUID() + ".mp4";
        const outputPath = path.join(uploadsDir, outputFilename);
        fs.writeFileSync(outputPath, Buffer.from(arrayBuf));

        console.log(`[AI VIDEO INFSH] Video with audio saved: ${outputPath} (${(arrayBuf.byteLength / 1024 / 1024).toFixed(1)} MB)`);
        return {
          filePath: outputPath,
          url: `/uploads/social-media/${outputFilename}`,
        };
      }
    }

    throw new Error("inference.sh video generation timed out after 5 minutes");
  }

  private async generateVideoVeo(
    description: string,
    style?: string,
    duration: number = 15
  ): Promise<{ filePath: string; url: string }> {
    const uploadsDir = path.join(process.cwd(), "uploads", "social-media");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const apiKey = process.env.GEMINI_VEO_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!apiKey) throw new Error("No Gemini API key available for Veo generation");

    const prompt = style ? `${description}. Visual style: ${style}` : description;
    const durationSec = Math.min(8, Math.max(5, Math.round(duration / 2)));
    const BASE = "https://generativelanguage.googleapis.com/v1beta";

    // veo-3.0-generate-preview requires Vertex AI and is unavailable on the standard Gemini API.
    // veo-2.0-generate-001 is accessible on the standard API and generates real motion video.
    // generateAudio is also Vertex AI-only; we try it and silently drop it if rejected.
    const model = "veo-2.0-generate-001";

    console.log(`[AI VIDEO VEO] Starting generation via REST: "${prompt.slice(0, 80)}..." (${durationSec}s)`);

    // Step 1 – submit the video generation job directly via REST API.
    const submitRes = await fetch(
      `${BASE}/models/${model}:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            durationSeconds: durationSec,
            aspectRatio: "16:9",
          },
        }),
      }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`Veo submit failed (${submitRes.status}): ${errText}`);
    }

    let operation: any = await submitRes.json();
    console.log(`[AI VIDEO VEO3] Operation started: ${operation.name}`);

    // Step 2 – poll the operation until done (max 5 min, every 10s)
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts && !operation.done; i++) {
      console.log(`[AI VIDEO VEO] Polling... (${i + 1}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const pollRes = await fetch(`${BASE}/${operation.name}?key=${apiKey}`);
      if (!pollRes.ok) {
        const errText = await pollRes.text();
        throw new Error(`Veo poll failed (${pollRes.status}): ${errText}`);
      }
      operation = await pollRes.json();
    }

    if (!operation.done) throw new Error("Veo video generation timed out after 5 minutes");
    if (operation.error) throw new Error(`Veo error: ${JSON.stringify(operation.error)}`);

    // Step 3 – extract the video from the response.
    // Actual response shape: response.generateVideoResponse.generatedSamples[].video.{ uri | encodedVideo }
    const samples: any[] =
      operation.response?.generateVideoResponse?.generatedSamples ?? [];
    if (!samples.length) throw new Error("Veo returned no video samples");

    const videoObj = samples[0]?.video;
    if (!videoObj) throw new Error("Veo response missing video object");

    const outputFilename = crypto.randomUUID() + ".mp4";
    const outputPath = path.join(uploadsDir, outputFilename);

    if (videoObj.encodedVideo) {
      // Base64-encoded bytes returned directly
      fs.writeFileSync(outputPath, Buffer.from(videoObj.encodedVideo, "base64"));
    } else if (videoObj.uri) {
      // URI already contains ?alt=media — just append the API key
      const dlUrl = videoObj.uri.includes("?")
        ? `${videoObj.uri}&key=${apiKey}`
        : `${videoObj.uri}?key=${apiKey}`;
      const dlRes = await fetch(dlUrl);
      if (!dlRes.ok) throw new Error(`Veo video download failed (${dlRes.status})`);
      const arrayBuf = await dlRes.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(arrayBuf));
    } else {
      throw new Error("Veo video object has neither encodedVideo nor uri");
    }

    console.log(`[AI VIDEO VEO] Video saved: ${outputPath}`);
    return {
      filePath: outputPath,
      url: `/uploads/social-media/${outputFilename}`,
    };
  }

  private async generateVideoSlideshow(
    description: string,
    style?: string,
    duration: number = 15
  ): Promise<{ filePath: string; url: string }> {
    const uploadsDir = path.join(process.cwd(), "uploads", "social-media");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Locate ffmpeg binary — PATH varies between dev (Nix) and production containers
    let ffmpegBin = "";
    const candidatePaths = [
      "/usr/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      "/nix/var/nix/profiles/default/bin/ffmpeg",
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) { ffmpegBin = p; break; }
    }
    if (!ffmpegBin) {
      try {
        ffmpegBin = execSync(
          "which ffmpeg 2>/dev/null || find /nix -name 'ffmpeg' -type f 2>/dev/null | grep '/bin/ffmpeg' | head -1",
          { encoding: "utf8", timeout: 8000 }
        ).trim();
      } catch {}
    }
    if (!ffmpegBin) {
      throw new Error("Video generation is not available: ffmpeg is not installed on this server.");
    }
    console.log(`[AI VIDEO SLIDESHOW] Using ffmpeg at: ${ffmpegBin}`);

    const tmpDir = path.join(process.cwd(), "tmp-video-" + crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      console.log(`[AI VIDEO SLIDESHOW] Generating video for: "${description}"`);

      const scenePrompts = await this.generateVideoScenePrompts(description, style);
      console.log(`[AI VIDEO SLIDESHOW] Generated ${scenePrompts.length} scene prompts`);

      const imagePaths: string[] = [];
      for (let i = 0; i < scenePrompts.length; i++) {
        console.log(`[AI VIDEO SLIDESHOW] Generating scene ${i + 1}/${scenePrompts.length}...`);
        try {
          const result = await this.generateImage(scenePrompts[i], style);
          const imgPath = path.join(tmpDir, `scene_${i}.png`);
          fs.writeFileSync(imgPath, Buffer.from(result.base64, "base64"));
          imagePaths.push(imgPath);
        } catch (err: any) {
          console.error(`[AI VIDEO SLIDESHOW] Scene ${i + 1} generation failed:`, err.message);
        }
      }

      if (imagePaths.length === 0) {
        throw new Error("Failed to generate any scenes for the video");
      }

      const sceneDuration = Math.max(3, Math.floor(duration / imagePaths.length));
      const outputFilename = crypto.randomUUID() + ".mp4";
      const outputPath = path.join(uploadsDir, outputFilename);

      const partPaths: string[] = [];
      for (let i = 0; i < imagePaths.length; i++) {
        const partPath = path.join(tmpDir, `part_${i}.mp4`);
        const partCmd = `"${ffmpegBin}" -y -loop 1 -i "${imagePaths[i]}" -t ${sceneDuration} -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -preset ultrafast -crf 28 "${partPath}" 2>&1`;
        try {
          execSync(partCmd, { timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
          partPaths.push(partPath);
        } catch (e: any) {
          console.error(`[AI VIDEO SLIDESHOW] Failed to encode scene ${i + 1}:`, e.message);
        }
      }

      if (partPaths.length === 0) {
        throw new Error("Failed to encode any video scenes");
      }

      const listFile = path.join(tmpDir, "concat.txt");
      fs.writeFileSync(listFile, partPaths.map((p) => `file '${p}'`).join("\n"));

      const concatCmd = `"${ffmpegBin}" -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -movflags +faststart "${outputPath}" 2>&1`;
      execSync(concatCmd, { timeout: 90000, maxBuffer: 50 * 1024 * 1024 });

      console.log(`[AI VIDEO SLIDESHOW] Video generated: ${outputPath}`);
      return {
        filePath: outputPath,
        url: `/uploads/social-media/${outputFilename}`,
      };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch { }
    }
  }

  private async generateVideoScenePrompts(description: string, style?: string): Promise<string[]> {
    try {
      const scenePrompt = `You are a creative director for social media video content. Given a topic, generate 4 scene descriptions for a short video. Each scene should be a standalone, visually striking image that tells part of the story. Return a JSON array of 4 strings, each being a detailed image generation prompt.

Rules:
- Each prompt should describe a different visual angle or aspect of the topic
- Make scenes flow logically as a visual narrative
- Include specific visual details: lighting, composition, colors, mood
- Each prompt should be 1-2 sentences, highly descriptive
- Make them suitable for professional social media content
- Do NOT include any text/words/letters in the image descriptions

IMPORTANT: Do not hallucinate or fabricate details. Base your descriptions on realistic, achievable visual compositions. Return ONLY a valid JSON array of 4 strings, no markdown fences or other text.

Topic: ${description}${style ? `\nVisual style: ${style}` : ""}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [{ role: "user", parts: [{ text: scenePrompt }] }],
        config: { temperature: 0.8, maxOutputTokens: 8192 },
      });

      const text = response.text || "[]";
      const prompts = safeJsonParse(text, []);
      if (Array.isArray(prompts) && prompts.length > 0) {
        return prompts.slice(0, 4).map((p: any) => String(p));
      }
      return [
        `Professional social media visual: ${description}, opening shot, wide angle, dramatic lighting`,
        `Professional social media visual: ${description}, close-up detail shot, vibrant colors`,
        `Professional social media visual: ${description}, action shot, dynamic composition`,
        `Professional social media visual: ${description}, closing shot, inspiring mood`,
      ];
    } catch (error: any) {
      console.error("[AI VIDEO] Scene prompt generation failed:", error.message);
      return [
        `Professional social media visual: ${description}, opening shot, dramatic lighting`,
        `Professional social media visual: ${description}, detail shot, vibrant colors`,
        `Professional social media visual: ${description}, action shot, dynamic composition`,
        `Professional social media visual: ${description}, closing shot, inspiring mood`,
      ];
    }
  }

  async fullyAutonomousCreate(
    briefing: string,
    platforms: string[],
    clientId?: string,
    campaignId?: string,
    onProgress?: (step: string, detail: string) => void,
    brandVoice?: BrandVoiceProfile
  ): Promise<{
    research: any;
    content: string;
    hashtags: string[];
    platformVersions: Record<string, string>;
    designSuggestions: any;
    review: any;
    generatedImages: Array<{ url: string; description: string }>;
    generatedVideos: Array<{ url: string; description: string }>;
    schedule: { scheduledAt: string; bestTimes: any };
    scrapedData: ScrapedData | null;
    scrapedImages: string[];
  }> {
    onProgress?.("scrape", "Checking for URL scrape directives...");
    const { scrapedData, enrichedBriefing, scrapedImages } = await this.scrapeAndEnrich(briefing);
    if (scrapedData) {
      onProgress?.("scrape", `Scraped ${scrapedData.title || scrapedData.url} — ${scrapedImages.length} images found`);
    }

    onProgress?.("research", "Researching trends and audience insights...");
    const research = await this.researchTrends(enrichedBriefing, platforms, clientId, false);

    onProgress?.("content", "Generating optimized post content...");
    const enrichedPrompt = `${enrichedBriefing}

Based on current trends research:
${research.suggestions.slice(0, 5).map((s: string) => `- ${s}`).join("\n")}

Key trends to incorporate:
${research.trends.slice(0, 3).map((t: any) => `- ${t.name ?? t}: ${t.description ?? ""}`).join("\n")}`;

    const postResult = await this.generatePost(enrichedPrompt, platforms, clientId, campaignId, brandVoice);

    postResult.content = stripYoutubePlaceholders(postResult.content);
    for (const platform of Object.keys(postResult.platformVersions)) {
      postResult.platformVersions[platform] = stripYoutubePlaceholders(postResult.platformVersions[platform]);
    }

    onProgress?.("design", "Getting design recommendations...");
    const [designSuggestions, review] = await Promise.all([
      this.getDesignSuggestions(postResult.content, platforms, clientId),
      this.reviewPost(postResult.content, platforms, clientId),
    ]);

    onProgress?.("images", "Creating visual content with AI...");
    const generatedImages: Array<{ url: string; description: string }> = [];
    const generatedVideos: Array<{ url: string; description: string }> = [];
    const visualDescriptions: any[] = Array.isArray(designSuggestions.visualSuggestions)
      ? designSuggestions.visualSuggestions.filter((s: string) => !String(s).startsWith("[VIDEO]")).slice(0, 2)
      : [];

    const wantsVideo = /video|clip|animation|motion|reel|footage/i.test(briefing) || designSuggestions.recommendVideo;

    if (designSuggestions.image_prompt) {
      try {
        const result = await this.generateImage(
          designSuggestions.image_prompt,
          designSuggestions.style,
          designSuggestions.negative_prompt
        );
        generatedImages.push({ url: result.base64, description: designSuggestions.image_prompt });
      } catch (err: any) {
        console.error("[AUTONOMOUS] Primary image generation failed:", err.message);
      }
    }

    if (generatedImages.length === 0) {
      for (const desc of visualDescriptions) {
        try {
          const descText = typeof desc === "object" ? (desc.description || JSON.stringify(desc)) : String(desc);
          const result = await this.generateImage(descText, designSuggestions.style, designSuggestions.negative_prompt);
          generatedImages.push({ url: result.base64, description: descText });
        } catch (err: any) {
          console.error("[AUTONOMOUS] Image generation failed for:", desc, err.message);
        }
      }
    }

    if (wantsVideo) {
      onProgress?.("video", "Generating AI video clip...");
      try {
        const videoDesc = visualDescriptions[0]
          ? (typeof visualDescriptions[0] === "object" ? (visualDescriptions[0] as any).description || briefing : String(visualDescriptions[0]))
          : briefing;
        const videoResult = await this.generateVideo(videoDesc);
        generatedVideos.push({ url: videoResult.url, description: videoDesc });
      } catch (err: any) {
        console.error("[AUTONOMOUS] Video generation failed:", err.message);
      }
    }

    onProgress?.("schedule", "Determining optimal posting schedule...");
    const bestTimes = research.optimalTimes || {};
    const scheduledAt = this.computeNextOptimalTime(bestTimes, platforms);

    return {
      research,
      content: postResult.content,
      hashtags: postResult.hashtags,
      platformVersions: postResult.platformVersions,
      designSuggestions,
      review,
      generatedImages,
      generatedVideos,
      schedule: { scheduledAt, bestTimes },
      scrapedData,
      scrapedImages,
    };
  }

  private computeNextOptimalTime(bestTimes: any, platforms: string[]): string {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let targetDays: string[] = ["Wednesday", "Thursday"];
    let targetHour = 11;

    try {
      const platformKey = platforms[0] || "facebook";
      const platformTimes = bestTimes[platformKey];
      if (platformTimes) {
        const ptObj = typeof platformTimes === "string" ? platformTimes : JSON.stringify(platformTimes);

        const dayMatch = ptObj.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi);
        if (dayMatch && dayMatch.length > 0) {
          targetDays = dayMatch;
        }

        const timeMatch = ptObj.match(/(\d{1,2})(?::00)?\s*(AM|PM)/i);
        if (timeMatch) {
          let hr = parseInt(timeMatch[1]);
          if (timeMatch[2].toUpperCase() === "PM" && hr !== 12) hr += 12;
          if (timeMatch[2].toUpperCase() === "AM" && hr === 12) hr = 0;
          targetHour = hr;
        }
      }
    } catch {
    }

    for (let offset = 1; offset <= 14; offset++) {
      const candidate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
      const candidateDayName = dayNames[candidate.getDay()];
      if (targetDays.some((d) => d.toLowerCase() === candidateDayName.toLowerCase())) {
        candidate.setHours(targetHour, 0, 0, 0);
        if (candidate > now) {
          return candidate.toISOString();
        }
      }
    }

    const fallback = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    fallback.setHours(targetHour, 0, 0, 0);
    return fallback.toISOString();
  }

  async scrapeAndEnrich(briefing: string): Promise<{ scrapedData: ScrapedData | null; enrichedBriefing: string; scrapedImages: string[] }> {
    const scrapeMatch = extractScrapeUrl(briefing);
    if (!scrapeMatch) return { scrapedData: null, enrichedBriefing: briefing, scrapedImages: [] };

    console.log(`[AI-AGENTS] Scrape directive detected: ${scrapeMatch.url}`);
    try {
      const data = await scrapeUrl(scrapeMatch.url, 5);
      const context = formatScrapedDataForAI(data);
      const enrichedBriefing = `${scrapeMatch.cleanedText}\n\n${context}`;
      return { scrapedData: data, enrichedBriefing, scrapedImages: data.images };
    } catch (err: any) {
      console.error(`[AI-AGENTS] Scrape failed for ${scrapeMatch.url}:`, err.message);
      return { scrapedData: null, enrichedBriefing: scrapeMatch.cleanedText, scrapedImages: [] };
    }
  }

  async orchestrateContentCreation(
    briefing: string,
    platforms: string[],
    clientId?: string,
    campaignId?: string,
    brandVoice?: BrandVoiceProfile
  ): Promise<{
    research: any;
    content: string;
    hashtags: string[];
    platformVersions: Record<string, string>;
    designSuggestions: any;
    review: any;
    scrapedData?: ScrapedData | null;
    scrapedImages?: string[];
  }> {
    const { scrapedData, enrichedBriefing, scrapedImages } = await this.scrapeAndEnrich(briefing);

    const research = await this.researchTrends(enrichedBriefing, platforms, clientId, false);

    const enrichedPrompt = `${enrichedBriefing}

Based on current trends research:
${research.suggestions.slice(0, 5).map((s: string) => `- ${s}`).join("\n")}

Key trends to incorporate:
${research.trends.slice(0, 3).map((t: any) => `- ${t.name ?? t}: ${t.description ?? ""}`).join("\n")}`;

    const postResult = await this.generatePost(enrichedPrompt, platforms, clientId, campaignId, brandVoice);

    postResult.content = stripYoutubePlaceholders(postResult.content);
    for (const platform of Object.keys(postResult.platformVersions)) {
      postResult.platformVersions[platform] = stripYoutubePlaceholders(postResult.platformVersions[platform]);
    }

    const [designSuggestions, review] = await Promise.all([
      this.getDesignSuggestions(postResult.content, platforms, clientId),
      this.reviewPost(postResult.content, platforms, clientId),
    ]);

    return {
      research,
      content: postResult.content,
      hashtags: postResult.hashtags,
      platformVersions: postResult.platformVersions,
      designSuggestions,
      review,
      scrapedData,
      scrapedImages,
    };
  }
}
