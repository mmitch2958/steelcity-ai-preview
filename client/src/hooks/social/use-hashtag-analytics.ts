import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SocialHashtagMetric } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Types ──────────────────────────────────────────────────────────

interface TopHashtag {
  hashtag: string;
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
  postCount: number;
}

interface HashtagFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ─── Query: Top Hashtags ────────────────────────────────────────────

export function useTopHashtags(mode: ApiMode, filters?: HashtagFilters) {
  const base = basePath(mode);
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const url = `${base}/analytics/hashtags${qs ? `?${qs}` : ''}`;

  const query = useQuery<{ hashtags: TopHashtag[] }>({
    queryKey: [url],
  });

  return {
    ...query,
    hashtags: query.data?.hashtags ?? [],
  };
}

// ─── Query: Single Hashtag Time Series ──────────────────────────────

export function useHashtagTimeSeries(hashtag: string | null, mode: ApiMode, filters?: { startDate?: string; endDate?: string }) {
  const base = basePath(mode);
  const params = new URLSearchParams();
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  const qs = params.toString();
  const tag = hashtag ? encodeURIComponent(hashtag) : '';
  const url = `${base}/analytics/hashtags/${tag}${qs ? `?${qs}` : ''}`;

  const query = useQuery<{ hashtag: string; metrics: SocialHashtagMetric[] }>({
    queryKey: [url],
    enabled: !!hashtag,
  });

  return {
    ...query,
    metrics: query.data?.metrics ?? [],
  };
}

// ─── Types: Suggestions ─────────────────────────────────────────────

export interface HashtagSuggestion {
  hashtag: string;
  confidence: number;
  source: 'content' | 'trending' | 'historical';
  avgEngagement: number;
  postCount: number;
  reason: string;
}

// ─── Hook: Hashtag Suggestions (P3-B010) ────────────────────────────

export function useHashtagSuggestions(
  content: string,
  platforms: string[],
  mode: ApiMode,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const { debounceMs = 600, enabled = true } = options || {};
  const base = basePath(mode);
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  const inputKey = JSON.stringify({ content, platforms });

  useEffect(() => {
    if (!enabled || !content || content.length < 10 || platforms.length === 0) {
      setSuggestions([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${base}/analytics/hashtags/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content, platforms }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);

        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err as Error);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [inputKey, enabled, base, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { suggestions, isLoading, error };
}
