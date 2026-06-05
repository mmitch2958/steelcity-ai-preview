// P2-B007: Post templates CRUD hook
// Templates are stored as posts with status='template' to reuse existing infrastructure

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface PostTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  platforms: string[];
  hashtags: string[];
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
}

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Query ──────────────────────────────────────────────────────────

export function useSocialTemplates(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/templates`];

  const query = useQuery<PostTemplate[]>({
    queryKey,
    queryFn: async () => {
      // Templates are stored as posts with status='template'
      // We fetch all posts and filter client-side for now
      // TODO: Add dedicated /templates endpoint if needed
      const res = await apiRequest('GET', `${base}/posts`);
      const data = await res.json();
      const posts = Array.isArray(data) ? data : data?.posts ?? [];
      return posts
        .filter((p: any) => p.status === 'template')
        .map((p: any) => ({
          id: p.id,
          name: p.content?.split('\n')[0]?.slice(0, 50) || 'Untitled Template',
          category: p.campaignId || 'general',
          content: p.content || '',
          platforms: Array.isArray(p.platforms) ? p.platforms : [],
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          mediaUrls: Array.isArray(p.mediaUrls) ? p.mediaUrls : [],
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
    },
  });

  return { ...query, templates: query.data ?? [], queryKey };
}

// ─── Create Template ────────────────────────────────────────────────

export function useCreateTemplate(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/templates`];
  const postsQueryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      content: string;
      platforms: string[];
      hashtags?: string[];
      mediaUrls?: string[];
      category?: string;
    }) => {
      const res = await apiRequest('POST', `${base}/posts`, {
        content: `${payload.name}\n${payload.content}`,
        platforms: payload.platforms,
        hashtags: payload.hashtags ?? [],
        mediaUrls: payload.mediaUrls ?? [],
        status: 'template',
        campaignId: payload.category || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      toast({ title: 'Template created', description: 'Your post template has been saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });
}

// ─── Update Template ────────────────────────────────────────────────

export function useUpdateTemplate(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/templates`];
  const postsQueryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name?: string;
      content?: string;
      platforms?: string[];
      hashtags?: string[];
      mediaUrls?: string[];
      category?: string;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (payload.content !== undefined || payload.name !== undefined) {
        updateData.content = `${payload.name ?? ''}\n${payload.content ?? ''}`;
      }
      if (payload.platforms !== undefined) updateData.platforms = payload.platforms;
      if (payload.hashtags !== undefined) updateData.hashtags = payload.hashtags;
      if (payload.mediaUrls !== undefined) updateData.mediaUrls = payload.mediaUrls;
      if (payload.category !== undefined) updateData.campaignId = payload.category;

      const res = await apiRequest('PUT', `${base}/posts/${payload.id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      toast({ title: 'Template updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update template', description: error.message, variant: 'destructive' });
    },
  });
}

// ─── Delete Template ────────────────────────────────────────────────

export function useDeleteTemplate(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/templates`];
  const postsQueryKey = [`${base}/posts`];
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest('DELETE', `${base}/posts/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: postsQueryKey });
      toast({ title: 'Template deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete template', description: error.message, variant: 'destructive' });
    },
  });
}
