import { Helmet } from 'react-helmet-async';
/**
 * ApprovalQueueTab — P3-B005
 *
 * Displays pending approval requests with post preview, requester info,
 * and approve/reject/request-changes actions. Filterable by status.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useApprovePost,
  useRejectPost,
  useRequestChanges,
  useApprovalHistory,
} from '../../../hooks/social/use-approval-workflow';
import type { ApprovalStatus } from '@shared/schema';
import { ApprovalActionButtons } from '../../../components/social/ApprovalActionButtons';
import { ApprovalStatusBadge } from '../../../components/social/ApprovalStatusBadge';
import { ApprovalHistoryTimeline } from '../../../components/social/ApprovalHistoryTimeline';
import { apiRequest } from '../../../lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Filter,
  Inbox,
  Eye,
  ChevronRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface ApprovalRequest {
  id: string;
  postId: string;
  post: {
    id: string;
    content: string;
    platforms: string[];
    mediaUrls?: string[];
    hashtags?: string[];
    scheduledAt?: string;
    createdAt: string;
  };
  requesterName?: string;
  requesterEmail?: string;
  status: string;
  level: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

// ─── Skeleton ───────────────────────────────────────────────────────

function ApprovalCardSkeleton() {
      <Helmet>
      <title>Approvals | Steel City AI</title>
      <meta name="description" content="Review and approve content before it goes live" />
    </Helmet>
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status Config ──────────────────────────────────────────────────

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-blue-600', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-600', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'Rejected' },
  changes_requested: { icon: MessageSquare, color: 'text-yellow-600', label: 'Changes Requested' },
};

// ─── Main Component ─────────────────────────────────────────────────

export default function ApprovalQueueTab() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Fetch approval requests
  const { data, isLoading, error } = useQuery<{ approvals: ApprovalRequest[] }>({
    queryKey: ['/api/portal/social/approval-requests', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/portal/social/approval-requests${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch approvals');
      return res.json();
    },
  });

  const approveMutation = useApprovePost('portal');
  const rejectMutation = useRejectPost('portal');
  const requestChangesMutation = useRequestChanges('portal');

  const approvals = data?.approvals ?? [];
  const isActionLoading = approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending;

  // Count by status
  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, changes_requested: 0 };
    for (const a of approvals) {
      if (a.status in c) c[a.status as keyof typeof c]++;
    }
    return c;
  }, [approvals]);

  const openHistory = (postId: string) => {
    setSelectedPostId(postId);
    setHistoryDialogOpen(true);
  };

  if (error) {
        <Helmet>
      <title>Approvals | Steel City AI</title>
      <meta name="description" content="Review and approve content before it goes live" />
    </Helmet>
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Failed to load approval queue. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

      <Helmet>
      <title>Approvals | Steel City AI</title>
      <meta name="description" content="Review and approve content before it goes live" />
    </Helmet>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Approval Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve posts before they go live
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]" aria-label="Filter approval requests by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">
                Pending ({counts.pending})
              </SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="changes_requested">Changes Requested</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = counts[key as keyof typeof counts] ?? 0;
              <Helmet>
      <title>Approvals | Steel City AI</title>
      <meta name="description" content="Review and approve content before it goes live" />
    </Helmet>
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(key as StatusFilter)}
              role="button"
              tabIndex={0}
              aria-label={`${cfg.label}: ${count} approval${count !== 1 ? 's' : ''}. ${statusFilter === key ? 'Currently selected.' : 'Click to filter.'}`}
              aria-pressed={statusFilter === key}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStatusFilter(key as StatusFilter)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${cfg.color}`} aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-lg font-semibold">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approval Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
          <ApprovalCardSkeleton />
        </div>
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No approvals to show</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'pending'
                ? 'No posts are waiting for your approval.'
                : `No ${statusFilter.replace('_', ' ')} approvals found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ApprovalStatusBadge status={approval.status as ApprovalStatus} />
                      {approval.requesterName && (
                        <span className="text-xs text-muted-foreground">
                          by {approval.requesterName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {new Date(approval.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {approval.post.scheduledAt && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(approval.post.scheduledAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Badge>
                  )}
                </div>

                {/* Post preview */}
                <div className="p-3 rounded-md bg-muted/50 border" role="article" aria-label="Post preview">
                  <p className="text-sm whitespace-pre-wrap line-clamp-4" aria-hidden="true">
                    {approval.post.content}
                  </p>
                  <span className="sr-only">{approval.post.content}</span>

                  {approval.post.mediaUrls && approval.post.mediaUrls.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {approval.post.mediaUrls.slice(0, 4).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Media ${i + 1}`}
                          className="h-16 w-16 rounded-md object-cover border"
                        />
                      ))}
                      {approval.post.mediaUrls.length > 4 && (
                        <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{approval.post.mediaUrls.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {approval.post.hashtags && approval.post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {approval.post.hashtags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          #{tag.replace(/^#/, '')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {approval.post.platforms && (
                    <div className="flex gap-1 mt-2">
                      {approval.post.platforms.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs capitalize">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments from previous action */}
                {approval.comments && (
                  <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 text-sm">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">
                      Feedback:
                    </p>
                    <p className="text-sm">{approval.comments}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div role="group" aria-label="Approval actions">
                    <ApprovalActionButtons
                      postId={approval.postId}
                      approvalStatus={approval.status}
                      onApprove={(postId, comments) => approveMutation.mutate({ postId, comments })}
                      onReject={(postId, comments) => rejectMutation.mutate({ postId, comments })}
                      onRequestChanges={(postId, comments) => requestChangesMutation.mutate({ postId, comments })}
                      isLoading={isActionLoading}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openHistory(approval.postId)}
                    className="text-muted-foreground"
                    aria-label="View approval history"
                  >
                    <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                    History
                    <ChevronRight className="h-3 w-3 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg" aria-describedby="approval-history-desc">
          <DialogHeader>
            <DialogTitle>Approval History</DialogTitle>
            <p id="approval-history-desc" className="sr-only">Timeline of all approval actions taken on this post</p>
          </DialogHeader>
          {selectedPostId && (
            <ApprovalHistoryTimeline postId={selectedPostId} mode="portal" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
