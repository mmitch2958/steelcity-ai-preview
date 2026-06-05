/**
 * Post Performance Predictor — Heuristic v1
 * 
 * Weighted composite scoring algorithm that predicts engagement (0-10 scale)
 * based on content signals, posting time, hashtags, media, and platform factors.
 * 
 * Designed behind an interface so heuristic can be swapped for ML model later.
 * 
 * P3-B007
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface PredictionInput {
  content: string;
  platforms: string[];
  hashtags: string[];
  mediaUrls: string[];
  scheduledAt?: string | null; // ISO date string
  clientId?: string;
}

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  value: number; // contribution to score (-2 to +2)
  suggestion?: string;
}

export interface PredictionResult {
  score: number; // 0-10
  confidence: number; // 0-1
  factors: PredictionFactor[];
  suggestions: PredictionSuggestion[];
}

export interface PredictionSuggestion {
  id: string;
  title: string;
  description: string;
  potentialImpact: number; // how much score could improve
  actionType: 'add_media' | 'change_time' | 'add_hashtags' | 'remove_hashtags' | 'add_cta' | 'adjust_length' | 'add_emoji';
}

// ─── Scoring Interface ─────────────────────────────────────────────

export interface IPostPredictor {
  predict(input: PredictionInput): Promise<PredictionResult>;
}

// ─── Optimal Posting Times (platform-specific) ─────────────────────

const OPTIMAL_HOURS: Record<string, number[]> = {
  instagram: [9, 10, 11, 12, 17, 18, 19],
  facebook: [9, 10, 11, 13, 14, 15, 16],
  twitter: [8, 9, 10, 12, 13, 17, 18],
  linkedin: [7, 8, 9, 10, 11, 12, 17],
  tiktok: [7, 8, 9, 12, 15, 19, 20, 21, 22],
};

const OPTIMAL_DAYS: Record<string, number[]> = {
  // 0 = Sunday, 6 = Saturday
  instagram: [1, 2, 3, 4, 5], // weekdays
  facebook: [1, 2, 3, 4, 5],
  twitter: [1, 2, 3, 4],
  linkedin: [1, 2, 3, 4], // Mon-Thu
  tiktok: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

// ─── Content Quality Signals ────────────────────────────────────────

function countEmojis(text: string): number {
  // Match common emoji ranges without the 'u' flag for broader target compat
  const emojiRegex = /[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g;
  return (text.match(emojiRegex) || []).length;
}

function hasCTA(text: string): boolean {
  const ctaPatterns = [
    /\b(click|tap|swipe|visit|check out|sign up|subscribe|follow|share|comment|tag|link in bio|dm|message|learn more|get started|join|grab|shop|buy|order|book|register|download)\b/i,
    /\?$/, // ends with question
    /👇|⬇️|🔗|📲|💬|👆|📧/,
  ];
  return ctaPatterns.some(p => p.test(text));
}

function hasQuestion(text: string): boolean {
  return /\?/.test(text);
}

function getContentSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = /\b(amazing|awesome|great|love|incredible|wonderful|fantastic|beautiful|perfect|best|happy|excited|grateful|thankful|blessed|brilliant|outstanding|superb|magnificent)\b/gi;
  const negativeWords = /\b(bad|terrible|awful|hate|worst|horrible|ugly|disappointed|frustrated|annoyed|angry|sad|depressing|failure|mistake)\b/gi;
  
  const posCount = (text.match(positiveWords) || []).length;
  const negCount = (text.match(negativeWords) || []).length;
  
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

// ─── Platform-Specific Content Length Ranges ────────────────────────

const IDEAL_LENGTH: Record<string, { min: number; max: number; optimal: number }> = {
  instagram: { min: 50, max: 300, optimal: 150 },
  facebook: { min: 40, max: 250, optimal: 100 },
  twitter: { min: 20, max: 280, optimal: 100 },
  linkedin: { min: 100, max: 700, optimal: 300 },
  tiktok: { min: 10, max: 150, optimal: 50 },
};

const IDEAL_HASHTAGS: Record<string, { min: number; max: number; optimal: number }> = {
  instagram: { min: 3, max: 15, optimal: 8 },
  facebook: { min: 0, max: 5, optimal: 2 },
  twitter: { min: 1, max: 3, optimal: 2 },
  linkedin: { min: 1, max: 5, optimal: 3 },
  tiktok: { min: 2, max: 8, optimal: 4 },
};

// ─── Heuristic Predictor ────────────────────────────────────────────

export class HeuristicPostPredictor implements IPostPredictor {
  async predict(input: PredictionInput): Promise<PredictionResult> {
    const factors: PredictionFactor[] = [];
    const suggestions: PredictionSuggestion[] = [];

    // Baseline score (5.0 — average)
    let baseScore = 5.0;
    let totalWeight = 0;
    let weightedSum = 0;

    // ── Factor 1: Time-of-Day Fit (weight: 20%) ─────────────────
    const timeFactor = this.scorePostingTime(input, suggestions);
    factors.push(timeFactor);
    weightedSum += (timeFactor.value + 5) * 0.20; // normalize value from [-2,2] → [3,7]
    totalWeight += 0.20;

    // ── Factor 2: Content Quality Signals (weight: 25%) ──────────
    const contentFactors = this.scoreContentQuality(input, suggestions);
    for (const f of contentFactors) {
      factors.push(f);
    }
    const avgContentValue = contentFactors.reduce((sum, f) => sum + f.value, 0) / Math.max(contentFactors.length, 1);
    weightedSum += (avgContentValue + 5) * 0.25;
    totalWeight += 0.25;

    // ── Factor 3: Hashtag Strength (weight: 15%) ─────────────────
    const hashtagFactor = this.scoreHashtags(input, suggestions);
    factors.push(hashtagFactor);
    weightedSum += (hashtagFactor.value + 5) * 0.15;
    totalWeight += 0.15;

    // ── Factor 4: Media Presence (weight: 20%) ───────────────────
    const mediaFactor = this.scoreMedia(input, suggestions);
    factors.push(mediaFactor);
    weightedSum += (mediaFactor.value + 5) * 0.20;
    totalWeight += 0.20;

    // ── Factor 5: Platform-Specific Optimization (weight: 20%) ───
    const platformFactor = this.scorePlatformFit(input, suggestions);
    factors.push(platformFactor);
    weightedSum += (platformFactor.value + 5) * 0.20;
    totalWeight += 0.20;

    // Calculate final score
    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : baseScore;
    const score = Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10));

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(input);

    // Sort suggestions by potential impact (highest first)
    suggestions.sort((a, b) => b.potentialImpact - a.potentialImpact);

    return { score, confidence, factors, suggestions };
  }

  private scorePostingTime(input: PredictionInput, suggestions: PredictionSuggestion[]): PredictionFactor {
    if (!input.scheduledAt) {
      suggestions.push({
        id: 'schedule_time',
        title: 'Schedule your post',
        description: 'Scheduling posts at optimal times can increase engagement by up to 30%.',
        potentialImpact: 0.8,
        actionType: 'change_time',
      });
      return { name: 'Posting Time', impact: 'neutral', value: 0, suggestion: 'Schedule your post for optimal engagement' };
    }

    const date = new Date(input.scheduledAt);
    const hour = date.getHours();
    const day = date.getDay();

    let bestScore = 0;
    for (const platform of input.platforms) {
      const optHours = OPTIMAL_HOURS[platform] || OPTIMAL_HOURS.instagram;
      const optDays = OPTIMAL_DAYS[platform] || OPTIMAL_DAYS.instagram;

      let platformScore = 0;

      // Check hour
      if (optHours.includes(hour)) {
        platformScore += 1.0;
      } else {
        // Check if close to optimal
        const closestDist = Math.min(...optHours.map(h => Math.abs(h - hour)));
        if (closestDist <= 1) platformScore += 0.5;
        else if (closestDist <= 2) platformScore += 0.2;
      }

      // Check day
      if (optDays.includes(day)) {
        platformScore += 1.0;
      }

      bestScore = Math.max(bestScore, platformScore);
    }

    const value = bestScore - 1; // range: -1 to +1

    if (value < 0) {
      const bestHoursStr = (OPTIMAL_HOURS[input.platforms[0]] || OPTIMAL_HOURS.instagram)
        .slice(0, 3)
        .map(h => `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`)
        .join(', ');
      suggestions.push({
        id: 'change_time',
        title: 'Post at a better time',
        description: `Try posting at ${bestHoursStr} for higher engagement on ${input.platforms[0]}.`,
        potentialImpact: 0.6,
        actionType: 'change_time',
      });
    }

    return {
      name: 'Posting Time',
      impact: value > 0.3 ? 'positive' : value < -0.3 ? 'negative' : 'neutral',
      value,
      suggestion: value < 0 ? 'Consider scheduling at a higher-traffic time' : undefined,
    };
  }

  private scoreContentQuality(input: PredictionInput, suggestions: PredictionSuggestion[]): PredictionFactor[] {
    const factors: PredictionFactor[] = [];
    const content = input.content;

    // Content length
    const primaryPlatform = input.platforms[0] || 'instagram';
    const ideal = IDEAL_LENGTH[primaryPlatform] || IDEAL_LENGTH.instagram;
    const len = content.length;

    let lengthValue: number;
    if (len >= ideal.min && len <= ideal.max) {
      // Closer to optimal = higher score
      const distFromOptimal = Math.abs(len - ideal.optimal) / ideal.optimal;
      lengthValue = 1.5 - distFromOptimal;
    } else if (len < ideal.min) {
      lengthValue = -1;
      suggestions.push({
        id: 'lengthen_content',
        title: 'Add more detail',
        description: `Posts with ${ideal.min}-${ideal.max} characters perform best on ${primaryPlatform}. Your post has ${len}.`,
        potentialImpact: 0.5,
        actionType: 'adjust_length',
      });
    } else {
      lengthValue = -0.5;
      suggestions.push({
        id: 'shorten_content',
        title: 'Shorten your post',
        description: `Posts over ${ideal.max} characters tend to lose engagement on ${primaryPlatform}.`,
        potentialImpact: 0.4,
        actionType: 'adjust_length',
      });
    }
    factors.push({ name: 'Content Length', impact: lengthValue > 0.3 ? 'positive' : lengthValue < -0.3 ? 'negative' : 'neutral', value: lengthValue });

    // CTA presence
    const ctaPresent = hasCTA(content);
    if (ctaPresent) {
      factors.push({ name: 'Call-to-Action', impact: 'positive', value: 1.0 });
    } else {
      factors.push({ name: 'Call-to-Action', impact: 'negative', value: -0.5, suggestion: 'Add a call-to-action to boost engagement' });
      suggestions.push({
        id: 'add_cta',
        title: 'Add a call-to-action',
        description: 'Posts with CTAs get 2-3x more engagement. Try "Comment below", "Share your thoughts", or "Link in bio".',
        potentialImpact: 0.7,
        actionType: 'add_cta',
      });
    }

    // Question mark (engagement driver)
    if (hasQuestion(content)) {
      factors.push({ name: 'Question', impact: 'positive', value: 0.6 });
    }

    // Emoji usage
    const emojiCount = countEmojis(content);
    if (emojiCount === 0) {
      factors.push({ name: 'Emoji', impact: 'neutral', value: -0.3, suggestion: 'Adding 1-3 emojis can increase engagement' });
      suggestions.push({
        id: 'add_emoji',
        title: 'Add emojis',
        description: 'Posts with 1-3 emojis see 17% higher engagement on average.',
        potentialImpact: 0.3,
        actionType: 'add_emoji',
      });
    } else if (emojiCount >= 1 && emojiCount <= 4) {
      factors.push({ name: 'Emoji', impact: 'positive', value: 0.5 });
    } else {
      factors.push({ name: 'Emoji', impact: 'neutral', value: 0.1, suggestion: 'Too many emojis can reduce credibility' });
    }

    // Sentiment
    const sentiment = getContentSentiment(content);
    if (sentiment === 'positive') {
      factors.push({ name: 'Sentiment', impact: 'positive', value: 0.5 });
    } else if (sentiment === 'negative') {
      factors.push({ name: 'Sentiment', impact: 'negative', value: -0.3 });
    }

    return factors;
  }

  private scoreHashtags(input: PredictionInput, suggestions: PredictionSuggestion[]): PredictionFactor {
    const primaryPlatform = input.platforms[0] || 'instagram';
    const ideal = IDEAL_HASHTAGS[primaryPlatform] || IDEAL_HASHTAGS.instagram;
    const count = input.hashtags.length;

    let value: number;
    if (count === 0) {
      value = -1;
      suggestions.push({
        id: 'add_hashtags',
        title: 'Add hashtags',
        description: `Add ${ideal.optimal} relevant hashtags for ${primaryPlatform} to increase discoverability.`,
        potentialImpact: 0.8,
        actionType: 'add_hashtags',
      });
    } else if (count >= ideal.min && count <= ideal.max) {
      const distFromOptimal = Math.abs(count - ideal.optimal) / ideal.optimal;
      value = 1.5 - distFromOptimal;
    } else if (count > ideal.max) {
      value = -0.5;
      suggestions.push({
        id: 'reduce_hashtags',
        title: 'Reduce hashtags',
        description: `${primaryPlatform} performs best with ${ideal.min}-${ideal.max} hashtags. You have ${count}.`,
        potentialImpact: 0.3,
        actionType: 'remove_hashtags',
      });
    } else {
      value = 0;
    }

    return {
      name: 'Hashtag Strategy',
      impact: value > 0.3 ? 'positive' : value < -0.3 ? 'negative' : 'neutral',
      value,
    };
  }

  private scoreMedia(input: PredictionInput, suggestions: PredictionSuggestion[]): PredictionFactor {
    const mediaCount = input.mediaUrls.length;

    if (mediaCount === 0) {
      suggestions.push({
        id: 'add_media',
        title: 'Add an image or video',
        description: 'Posts with visuals get 2.3x more engagement than text-only posts.',
        potentialImpact: 1.2,
        actionType: 'add_media',
      });
      return { name: 'Media', impact: 'negative', value: -1.5, suggestion: 'Add an image or video' };
    } else if (mediaCount === 1) {
      return { name: 'Media', impact: 'positive', value: 1.0 };
    } else if (mediaCount <= 4) {
      return { name: 'Media', impact: 'positive', value: 1.5 };
    } else {
      return { name: 'Media', impact: 'neutral', value: 0.5, suggestion: 'Consider using a carousel with fewer items' };
    }
  }

  private scorePlatformFit(input: PredictionInput, suggestions: PredictionSuggestion[]): PredictionFactor {
    if (input.platforms.length === 0) {
      return { name: 'Platform Fit', impact: 'negative', value: -1, suggestion: 'Select at least one platform' };
    }

    // Multi-platform posting is generally good (broader reach) but can be slightly less optimal per-platform
    let value: number;
    if (input.platforms.length === 1) {
      value = 1.0; // focused, can optimize for one platform
    } else if (input.platforms.length <= 3) {
      value = 0.7; // good cross-posting
    } else {
      value = 0.3; // many platforms, likely less optimized content
    }

    return {
      name: 'Platform Strategy',
      impact: value > 0.5 ? 'positive' : 'neutral',
      value,
    };
  }

  private calculateConfidence(input: PredictionInput): number {
    let confidence = 0.5; // base confidence for heuristic

    // More data = higher confidence
    if (input.content.length > 20) confidence += 0.1;
    if (input.platforms.length > 0) confidence += 0.1;
    if (input.hashtags.length > 0) confidence += 0.05;
    if (input.mediaUrls.length > 0) confidence += 0.1;
    if (input.scheduledAt) confidence += 0.1;

    // Cap at 0.85 for heuristic (ML model could go higher)
    return Math.min(0.85, Math.round(confidence * 100) / 100);
  }
}

// Singleton instance
export const postPredictor: IPostPredictor = new HeuristicPostPredictor();
