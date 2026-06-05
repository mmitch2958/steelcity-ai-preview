import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

function useAiMutation(mode: ApiMode, endpoint: string) {
  const base = basePath(mode);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest('POST', `${base}/${endpoint}`, payload);
      return res.json();
    },
  });
}

export function useAiOrchestrate(mode: ApiMode) {
  return useAiMutation(mode, 'ai/orchestrate');
}

export function useAiGeneratePost(mode: ApiMode) {
  return useAiMutation(mode, 'ai/generate-post');
}

export function useAiVibeEdit(mode: ApiMode) {
  return useAiMutation(mode, 'ai/vibe-edit');
}

export function useAiReview(mode: ApiMode) {
  return useAiMutation(mode, 'ai/review');
}

export function useAiResearch(mode: ApiMode) {
  return useAiMutation(mode, 'ai/research');
}

export function useAiDesign(mode: ApiMode) {
  return useAiMutation(mode, 'ai/design');
}

export function useAiAutonomous(mode: ApiMode) {
  return useAiMutation(mode, 'ai/autonomous');
}

export function useAiGenerateImage(mode: ApiMode) {
  return useAiMutation(mode, 'ai/generate-image');
}

export function useAiGenerateVideo(mode: ApiMode) {
  return useAiMutation(mode, 'ai/generate-video');
}
