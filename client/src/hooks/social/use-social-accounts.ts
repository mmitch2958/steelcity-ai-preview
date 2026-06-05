import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { SocialAccount } from '@shared/schema';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

export function useSocialAccounts(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/accounts`];

  const query = useQuery<SocialAccount[] | { accounts: SocialAccount[] }>({
    queryKey,
  });

  const accounts: SocialAccount[] = Array.isArray(query.data)
    ? query.data
    : query.data?.accounts ?? [];

  return { ...query, accounts, queryKey };
}

export function useCreateAccount(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/accounts`];

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest('POST', `${base}/accounts`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDisconnectAccount(mode: ApiMode) {
  const base = basePath(mode);
  const queryKey = [`${base}/accounts`];

  return useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest('DELETE', `${base}/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
