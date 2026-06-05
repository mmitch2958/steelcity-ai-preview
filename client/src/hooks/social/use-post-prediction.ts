/**
 * usePredictPostPerformance — Hook for AI prediction scoring
 * 
 * Calls the prediction API with debounced content changes.
 * Returns prediction score, confidence, factors, and suggestions.
 * Supports tracking predictions for accuracy measurement.
 * 
 * P3-B007
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Types ──────────────────────────────────────────────────────────

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  value: number;
  suggestion?: string;
}

export interface PredictionSuggestion {
  id: string;
  title: string;
  description: string;
  potentialImpact: number;
  actionType: 'add_media' | 'change_time' | 'add_hashtags' | 'remove_hashtags' | 'add_cta' | 'adjust_length' | 'add_emoji';
}

export interface PredictionResult {
  score: number;
  confidence: number;
  factors: PredictionFactor[];
  suggestions: PredictionSuggestion[];
}

export interface PredictionInput {
  content: string;
  platforms: string[];
  hashtags: string[];
  mediaUrls: string[];
  scheduledAt?: string | null;
}

export interface PredictionAccuracy {
  avgError: number;
  predictionCount: number;
  accuracy: number;
  recentAccuracy: Array<{
    postId: string;
    predicted: number;
    actual: number;
    error: number;
    predictedAt: string;
  }>;
}

// ─── Hook: Predict Post Performance ─────────────────────────────────

export function usePredictPostPerformance(
  input: PredictionInput,
  mode: ApiMode,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const { debounceMs = 500, enabled = true } = options || {};
  const base = basePath(mode);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  // Create a stable stringified version for dependency tracking
  const inputKey = JSON.stringify({
    content: input.content,
    platforms: input.platforms,
    hashtags: input.hashtags,
    mediaCount: input.mediaUrls.length,
    scheduledAt: input.scheduledAt,
  });

  useEffect(() => {
    if (!enabled || !input.content || input.content.length < 5 || input.platforms.length === 0) {
      setPrediction(null);
      return;
    }

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Cancel previous request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${base}/ai/predict-performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Prediction failed: ${res.status}`);
        }

        const result: PredictionResult = await res.json();
        setPrediction(result);
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

  return { prediction, isLoading, error };
}

// ─── Hook: Track Prediction (save for accuracy measurement) ─────────

export function useTrackPrediction(mode: ApiMode) {
  const base = basePath(mode);

  return useMutation({
    mutationFn: async (data: {
      postId: string;
      predictedScore: number;
      confidence: number;
      factors: PredictionFactor[];
    }) => {
      const res = await apiRequest('POST', `${base}/ai/predictions/track`, data);
      return res.json();
    },
  });
}

// ─── Hook: Get Prediction Accuracy ──────────────────────────────────

export function usePredictionAccuracy(mode: ApiMode) {
  const base = basePath(mode);
  const url = `${base}/ai/prediction-accuracy`;

  const query = useQuery<PredictionAccuracy>({
    queryKey: [url],
  });

  return {
    ...query,
    accuracy: query.data ?? null,
  };
}

// ─── Hook: Get Prediction for a Specific Post ──────────────────────

export function usePostPrediction(postId: string | null, mode: ApiMode) {
  const base = basePath(mode);
  const url = postId ? `${base}/ai/predictions/${postId}` : null;

  const query = useQuery({
    queryKey: [url],
    enabled: !!postId,
  });

  return {
    ...query,
    prediction: query.data ?? null,
  };
}
