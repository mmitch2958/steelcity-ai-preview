import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { SocialPost, SocialPostApproval, SocialPostApprovalChain } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Types ──────────────────────────────────────────────────────────

interface ApprovalHistoryResponse {
  approvals: SocialPostApproval[];
  chain: SocialPostApprovalChain[];
}

interface ApprovalActionPayload {
  comments?: string;
}

interface RequestApprovalPayload extends ApprovalActionPayload {
  chain?: { role: string; approverId?: string; required?: boolean }[];
}

// ─── Query: Approval History ────────────────────────────────────────

export function useApprovalHistory(postId: string | null, mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/posts/${postId}/approval-history`];

  const query = useQuery<ApprovalHistoryResponse>({
    queryKey,
    enabled: !!postId,
  });

  return {
    ...query,
    approvals: query.data?.approvals ?? [],
    chain: query.data?.chain ?? [],
    queryKey,
  };
}

// ─── Helper: Optimistically update post approval status ─────────────

function optimisticPostUpdate(mode: ApiMode, postId: string, approvalStatus: string) {
  const base = basePath(mode);
  const postsKey = [`${base}/posts`];
  const data = queryClient.getQueryData<{ posts: SocialPost[] } | SocialPost[]>(postsKey);
  if (!data) return;

  const posts: SocialPost[] = Array.isArray(data) ? data : data.posts ?? [];
  const updated = posts.map(p =>
    p.id === postId ? { ...p, approvalStatus } : p
  );

  if (!Array.isArray(data)) {
    queryClient.setQueryData(postsKey, { ...data, posts: updated });
  } else {
    queryClient.setQueryData(postsKey, updated);
  }
}

// ─── Mutation: Request Approval ─────────────────────────────────────

export function useRequestApproval(mode: ApiMode) {
  const base = basePath(mode);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, ...payload }: RequestApprovalPayload & { postId: string }) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/request-approval`, payload);
      return res.json();
    },

    onMutate: async ({ postId }) => {
      optimisticPostUpdate(mode, postId, 'pending');
    },

    onSuccess: (_data, { postId }) => {
      toast({ title: 'Approval requested', description: 'Post has been submitted for approval.' });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts/${postId}/approval-history`] });
    },

    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ─── Mutation: Approve Post ─────────────────────────────────────────

export function useApprovePost(mode: ApiMode) {
  const base = basePath(mode);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, comments }: { postId: string; comments?: string }) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/approve`, { comments });
      return res.json();
    },

    onMutate: async ({ postId }) => {
      optimisticPostUpdate(mode, postId, 'approved');
    },

    onSuccess: (_data, { postId }) => {
      toast({ title: 'Post approved', description: 'The post has been approved.' });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts/${postId}/approval-history`] });
    },

    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ─── Mutation: Reject Post ──────────────────────────────────────────

export function useRejectPost(mode: ApiMode) {
  const base = basePath(mode);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, comments }: { postId: string; comments?: string }) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/reject`, { comments });
      return res.json();
    },

    onMutate: async ({ postId }) => {
      optimisticPostUpdate(mode, postId, 'rejected');
    },

    onSuccess: (_data, { postId }) => {
      toast({ title: 'Post rejected', description: 'The post has been rejected.' });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts/${postId}/approval-history`] });
    },

    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ─── Mutation: Request Changes ──────────────────────────────────────

export function useRequestChanges(mode: ApiMode) {
  const base = basePath(mode);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, comments }: { postId: string; comments?: string }) => {
      const res = await apiRequest('POST', `${base}/posts/${postId}/request-changes`, { comments });
      return res.json();
    },

    onMutate: async ({ postId }) => {
      optimisticPostUpdate(mode, postId, 'changes_requested');
    },

    onSuccess: (_data, { postId }) => {
      toast({ title: 'Changes requested', description: 'Feedback has been sent to the author.' });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      queryClient.invalidateQueries({ queryKey: [`${base}/posts/${postId}/approval-history`] });
    },

    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: [`${base}/posts`] });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
