/**
 * Hashtag Suggestions Engine — P3-B010
 *
 * Analyzes post content to suggest relevant hashtags.
 * Cross-references with hashtag_metrics for performance ranking.
 * Detects trending hashtags in the client's niche.
 */

import { db } from '../storage';
import { socialHashtagMetrics, socialPosts } from '@shared/schema';
import { sql, desc, and, gte, lte } from 'drizzle-orm';

// ─── Types ──────────────────────────────────────────────────────────

export interface HashtagSuggestion {
  hashtag: string;
  confidence: number;        // 0-1
  source: 'content' | 'trending' | 'historical';
  avgEngagement: number;
  postCount: number;
  reason: string;
}

interface SuggestOptions {
  content: string;
  platforms: string[];
  clientId?: string;
  limit?: number;
}

// ─── Content Analysis ───────────────────────────────────────────────

/** Extract keywords from content using simple NLP heuristics */
function extractKeywords(content: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'but', 'and', 'or', 'if', 'while', 'this', 'that',
    'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'get', 'got', 'new', 'also', 'like',
  ]);

  return content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .reduce((acc: string[], word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, [])
    .slice(0, 20);
}

/** Generate candidate hashtags from extracted keywords */
function generateCandidates(keywords: string[]): string[] {
  const candidates: string[] = [];

  // Single-word hashtags
  for (const kw of keywords) {
    candidates.push(kw);
  }

  // Two-word compound hashtags (adjacent pairs)
  for (let i = 0; i < keywords.length - 1; i++) {
    candidates.push(keywords[i] + keywords[i + 1]);
  }

  return candidates;
}

// ─── Database Queries ───────────────────────────────────────────────

/** Get historical performance data for matching hashtags */
async function getHistoricalPerformance(
  candidates: string[],
  startDate?: Date,
): Promise<Map<string, { avgEngagement: number; postCount: number }>> {
  const result = new Map<string, { avgEngagement: number; postCount: number }>();

  if (candidates.length === 0) return result;

  try {
    const dateFilter = startDate
      ? and(gte(socialHashtagMetrics.measuredAt, startDate))
      : undefined;

    // Query hashtag metrics for candidates using ILIKE matching
    for (const candidate of candidates.slice(0, 30)) {
      const metrics = await db
        .select({
          hashtag: socialHashtagMetrics.hashtag,
          avgEngagement: sql<number>`AVG(${socialHashtagMetrics.engagementRate})`,
          totalImpressions: sql<number>`SUM(${socialHashtagMetrics.impressions})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(socialHashtagMetrics)
        .where(
          dateFilter
            ? and(
                sql`LOWER(${socialHashtagMetrics.hashtag}) LIKE ${`%${candidate.toLowerCase()}%`}`,
                dateFilter,
              )
            : sql`LOWER(${socialHashtagMetrics.hashtag}) LIKE ${`%${candidate.toLowerCase()}%`}`,
        )
        .groupBy(socialHashtagMetrics.hashtag)
        .limit(5);

      for (const m of metrics) {
        result.set(m.hashtag, {
          avgEngagement: Number(m.avgEngagement) || 0,
          postCount: Number(m.count) || 0,
        });
      }
    }
  } catch {
    // If table doesn't exist or query fails, return empty
  }

  return result;
}

/** Get trending hashtags from recent high-performing posts */
async function getTrendingHashtags(limit: number = 10): Promise<Array<{
  hashtag: string;
  avgEngagement: number;
  postCount: number;
}>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await db
      .select({
        hashtag: socialHashtagMetrics.hashtag,
        avgEngagement: sql<number>`AVG(${socialHashtagMetrics.engagementRate})`,
        totalImpressions: sql<number>`SUM(${socialHashtagMetrics.impressions})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(socialHashtagMetrics)
      .where(gte(socialHashtagMetrics.measuredAt, thirtyDaysAgo))
      .groupBy(socialHashtagMetrics.hashtag)
      .orderBy(desc(sql`AVG(${socialHashtagMetrics.engagementRate})`))
      .limit(limit);

    return trending.map(t => ({
      hashtag: t.hashtag,
      avgEngagement: Number(t.avgEngagement) || 0,
      postCount: Number(t.count) || 0,
    }));
  } catch {
    return [];
  }
}

// ─── Main Suggestion Engine ─────────────────────────────────────────

export async function suggestHashtags(options: SuggestOptions): Promise<HashtagSuggestion[]> {
  const { content, platforms, limit = 10 } = options;
  const suggestions: HashtagSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Extract keywords and generate candidates from content
  const keywords = extractKeywords(content);
  const candidates = generateCandidates(keywords);

  // 2. Get historical performance for candidates
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const historical = await getHistoricalPerformance(candidates, thirtyDaysAgo);

  // 3. Score content-derived hashtags
  for (const candidate of candidates) {
    if (seen.has(candidate.toLowerCase())) continue;

    const histData = historical.get(candidate) || historical.get(`#${candidate}`);
    const avgEngagement = histData?.avgEngagement || 0;
    const postCount = histData?.postCount || 0;

    // Confidence: higher if we have historical data
    const confidence = histData
      ? Math.min(0.5 + (postCount * 0.05) + (avgEngagement * 0.1), 0.95)
      : 0.3 + (keywords.indexOf(candidate) < 5 ? 0.15 : 0);

    suggestions.push({
      hashtag: candidate,
      confidence,
      source: histData ? 'historical' : 'content',
      avgEngagement,
      postCount,
      reason: histData
        ? `Used in ${postCount} posts with ${avgEngagement.toFixed(1)}% avg engagement`
        : `Derived from your post content`,
    });

    seen.add(candidate.toLowerCase());
  }

  // 4. Add trending hashtags that aren't already suggested
  const trending = await getTrendingHashtags(15);
  for (const t of trending) {
    const tag = t.hashtag.replace(/^#/, '').toLowerCase();
    if (seen.has(tag)) continue;

    // Check if trending hashtag is somewhat relevant to content
    const isRelevant = keywords.some(kw => tag.includes(kw) || kw.includes(tag));
    if (!isRelevant && suggestions.length >= limit / 2) continue;

    suggestions.push({
      hashtag: t.hashtag.replace(/^#/, ''),
      confidence: isRelevant ? 0.7 : 0.4,
      source: 'trending',
      avgEngagement: t.avgEngagement,
      postCount: t.postCount,
      reason: `Trending — ${t.avgEngagement.toFixed(1)}% avg engagement across ${t.postCount} posts`,
    });

    seen.add(tag);
  }

  // 5. Sort by confidence * engagement weight and take top N
  return suggestions
    .sort((a, b) => {
      const scoreA = a.confidence * (1 + a.avgEngagement * 0.1);
      const scoreB = b.confidence * (1 + b.avgEngagement * 0.1);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
