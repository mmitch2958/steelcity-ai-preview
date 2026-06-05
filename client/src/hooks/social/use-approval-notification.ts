/**
 * useApprovalNotification — Hook for notification preferences
 * 
 * Manages notification preferences for approval workflow:
 * - Query/update email notification settings
 * - Toggle individual notification types
 * - Set email address for notifications
 * 
 * P3-B009
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type ApiMode = 'portal' | 'admin';

function basePath(mode: ApiMode): string {
  return mode === 'admin' ? '/api/admin/social' : '/api/portal/social';
}

// ─── Types ──────────────────────────────────────────────────────────

export interface NotificationPreferences {
  id?: string;
  emailOnApprovalRequest: boolean;
  emailOnApprovalResponse: boolean;
  emailOnChangesRequested: boolean;
  inAppNotifications: boolean;
  emailAddress: string | null;
}

// ─── Hook: Get Notification Preferences ─────────────────────────────

export function useNotificationPreferences(mode: ApiMode) {
  const base = basePath(mode);
  const url = `${base}/notification-preferences`;

  const query = useQuery<NotificationPreferences>({
    queryKey: [url],
  });

  return {
    ...query,
    preferences: query.data ?? {
      emailOnApprovalRequest: true,
      emailOnApprovalResponse: true,
      emailOnChangesRequested: true,
      inAppNotifications: true,
      emailAddress: null,
    },
  };
}

// ─── Hook: Update Notification Preferences ──────────────────────────

export function useUpdateNotificationPreferences(mode: ApiMode) {
  const base = basePath(mode);
  const url = `${base}/notification-preferences`;
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const res = await apiRequest('PUT', url, data);
      return res.json();
    },

    onMutate: async (data) => {
      // Optimistic update
      const previousData = queryClient.getQueryData<NotificationPreferences>([url]);
      if (previousData) {
        queryClient.setQueryData([url], { ...previousData, ...data });
      }
      return { previousData };
    },

    onSuccess: () => {
      toast({ title: 'Preferences updated', description: 'Your notification settings have been saved.' });
      queryClient.invalidateQueries({ queryKey: [url] });
    },

    onError: (error: Error, _data, context) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData([url], context.previousData);
      }
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
