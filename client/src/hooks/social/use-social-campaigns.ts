import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SocialCampaign } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Query ──────────────────────────────────────────────────────────

export function useSocialCampaigns(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/campaigns`];

  const query = useQuery<SocialCampaign[] | { campaigns: SocialCampaign[] }>({
    queryKey,
  });

  const campaigns: SocialCampaign[] = Array.isArray(query.data)
    ? query.data
    : query.data?.campaigns ?? [];

  return { ...query, campaigns, queryKey };
}

// ─── Helpers ────────────────────────────────────────────────────────

function getCached(queryKey: string[]): SocialCampaign[] {
  const data = queryClient.getQueryData<SocialCampaign[] | { campaigns: SocialCampaign[] }>(queryKey);
  if (!data) return [];
  return Array.isArray(data) ? data : data.campaigns ?? [];
}

function setCached(queryKey: string[], campaigns: SocialCampaign[]) {
  const current = queryClient.getQueryData<SocialCampaign[] | { campaigns: SocialCampaign[] }>(queryKey);
  if (current && !Array.isArray(current)) {
    queryClient.setQueryData(queryKey, { ...current, campaigns });
  } else {
    queryClient.setQueryData(queryKey, campaigns);
  }
}

// ─── Create Campaign (optimistic) ───────────────────────────────────

export function useCreateCampaign(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/campaigns`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest('POST', `${base}/campaigns`, payload);
      return res.json();
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCached(queryKey);

      const optimistic: SocialCampaign = {
        id: `_optimistic_${Date.now()}`,
        clientId: (payload.clientId as string | null | undefined) ?? null,
        name: (payload.name as string | undefined) ?? 'Untitled campaign',
        description: (payload.description as string | null | undefined) ?? null,
        status: (payload.status as string | undefined) ?? 'draft',
        startDate: payload.startDate ? new Date(payload.startDate as string) : null,
        endDate: payload.endDate ? new Date(payload.endDate as string) : null,
        goals: (payload.goals as string[] | null | undefined) ?? null,
        targetAudience: (payload.targetAudience as string | null | undefined) ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCached(queryKey, [optimistic, ...previous]);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCached(queryKey, context.previous);
      toast({ title: 'Failed to create campaign', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Update Campaign (optimistic) ───────────────────────────────────

export function useUpdateCampaign(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/campaigns`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest('PUT', `${base}/campaigns/${id}`, payload);
      return res.json();
    },

    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCached(queryKey);

      setCached(
        queryKey,
        previous.map((c) =>
          String(c.id) === String(id)
            ? { ...c, ...payload, updatedAt: new Date() }
            : c
        )
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCached(queryKey, context.previous);
      toast({ title: 'Failed to update campaign', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Delete Campaign (optimistic) ───────────────────────────────────

export function useDeleteCampaign(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/campaigns`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest('DELETE', `${base}/campaigns/${campaignId}`);
    },

    onMutate: async (campaignId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCached(queryKey);

      setCached(queryKey, previous.filter((c) => String(c.id) !== String(campaignId)));
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCached(queryKey, context.previous);
      toast({ title: 'Failed to delete campaign', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
