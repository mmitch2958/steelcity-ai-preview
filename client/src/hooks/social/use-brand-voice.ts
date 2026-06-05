import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { BrandVoiceProfile } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

export function useBrandVoices(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/brand-voice`];

  const query = useQuery<BrandVoiceProfile[] | { profiles: BrandVoiceProfile[] } | { brandVoices: BrandVoiceProfile[] }>({
    queryKey,
  });

  const brandVoices: BrandVoiceProfile[] = Array.isArray(query.data)
    ? query.data
    : query.data
      ? ('profiles' in query.data ? query.data.profiles : query.data.brandVoices)
      : [];

  return { ...query, brandVoices, queryKey };
}

export function useSaveBrandVoice(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/brand-voice`];

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id?: string } & Record<string, unknown>) => {
      if (id) {
        const res = await apiRequest('PUT', `${base}/brand-voice/${id}`, payload);
        return res.json();
      }

      const res = await apiRequest('POST', `${base}/brand-voice`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteBrandVoice(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/brand-voice`];

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `${base}/brand-voice/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
