import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SocialPost } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

type PostPayload = {
  content: string;
  platforms: string[];
  hashtags?: string[];
  scheduledAt?: string;
  mediaUrls?: string[];
  campaignId?: string;
  accountIds?: string[];
  status?: string;
  aiGenerated?: boolean;
};

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Query ──────────────────────────────────────────────────────────

export function useSocialPosts(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];

  const query = useQuery<{ posts: SocialPost[] } | SocialPost[]>({
    queryKey,
  });

  const posts: SocialPost[] = Array.isArray(query.data)
    ? query.data
    : query.data?.posts ?? [];

  return { ...query, posts, queryKey };
}

// ─── Helper: read current posts cache ───────────────────────────────

function getCachedPosts(queryKey: string[]): SocialPost[] {
  const data = queryClient.getQueryData<{ posts: SocialPost[] } | SocialPost[]>(queryKey);
  if (!data) return [];
  return Array.isArray(data) ? data : data.posts ?? [];
}

function setCachedPosts(queryKey: string[], posts: SocialPost[]) {
  const current = queryClient.getQueryData<{ posts: SocialPost[] } | SocialPost[]>(queryKey);
  if (current && !Array.isArray(current)) {
    queryClient.setQueryData(queryKey, { ...current, posts });
  } else {
    queryClient.setQueryData(queryKey, posts);
  }
}

// ─── Create Post (optimistic) ───────────────────────────────────────

export function useCreatePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: PostPayload) => {
      const res = await apiRequest('POST', `${base}/posts`, payload);
      return res.json();
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCachedPosts(queryKey);

      // Optimistic placeholder
      const optimistic: SocialPost = {
        id: `_optimistic_${Date.now()}`,
        clientId: null,
        campaignId: payload.campaignId ?? null,
        content: payload.content,
        mediaUrls: payload.mediaUrls ?? null,
        platforms: payload.platforms,
        accountIds: payload.accountIds ?? null,
        status: payload.status ?? 'draft',
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        publishedAt: null,
        platformPostIds: null,
        platformOptions: null,
        hashtags: payload.hashtags ?? null,
        aiGenerated: payload.aiGenerated ?? false,
        agentId: null,
        engagement: null,
        approvalStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCachedPosts(queryKey, [optimistic, ...previous]);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Rollback
      if (context?.previous) setCachedPosts(queryKey, context.previous);
      toast({ title: 'Failed to create post', description: 'Your post could not be saved. Please try again.', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Update Post (optimistic) ───────────────────────────────────────

export function useUpdatePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const res = await apiRequest('PUT', `${base}/posts/${id}`, payload);
      return res.json();
    },

    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCachedPosts(queryKey);

      const updated = previous.map((p) =>
        String(p.id) === String(id)
          ? { ...p, ...payload, updatedAt: new Date() }
          : p
      );
      setCachedPosts(queryKey, updated);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCachedPosts(queryKey, context.previous);
      toast({ title: 'Update failed', description: 'Could not update the post. Please try again.', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Delete Post (optimistic) ───────────────────────────────────────

export function useDeletePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest('DELETE', `${base}/posts/${postId}`);
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCachedPosts(queryKey);

      setCachedPosts(queryKey, previous.filter((p) => String(p.id) !== String(postId)));
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCachedPosts(queryKey, context.previous);
      toast({ title: 'Delete failed', description: 'Could not delete the post. It has been restored.', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Publish Post (optimistic) ──────────────────────────────────────

export function usePublishPost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/publish`, {});
      return res.json();
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCachedPosts(queryKey);

      const updated = previous.map((p) =>
        String(p.id) === String(postId)
          ? { ...p, status: 'publishing', updatedAt: new Date() }
          : p
      );
      setCachedPosts(queryKey, updated);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCachedPosts(queryKey, context.previous);
      toast({ title: 'Publish failed', description: 'Could not publish the post. Please try again.', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ─── Schedule Post (optimistic) ─────────────────────────────────────

export function useSchedulePost(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: string }) => {
      const res = await apiRequest('PUT', `${base}/posts/${id}`, { scheduledAt, status: 'scheduled' });
      return res.json();
    },

    onMutate: async ({ id, scheduledAt }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = getCachedPosts(queryKey);

      const updated = previous.map((p) =>
        String(p.id) === String(id)
          ? { ...p, scheduledAt: new Date(scheduledAt), status: 'scheduled', updatedAt: new Date() }
          : p
      );
      setCachedPosts(queryKey, updated);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) setCachedPosts(queryKey, context.previous);
      toast({ title: 'Schedule failed', description: 'Could not reschedule the post. Please try again.', variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
