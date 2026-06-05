import { useApprovalHistory } from '@/hooks/social/use-approval-workflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, MessageSquare, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialPostApproval, SocialPostApprovalChain } from '@shared/schema';

interface ApprovalHistoryTimelineProps {
  postId: string;
  mode: 'admin' | 'portal';
}

const statusIcons: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: 'text-blue-500' },
  approved: { icon: CheckCircle, color: 'text-green-500' },
  rejected: { icon: XCircle, color: 'text-red-500' },
  changes_requested: { icon: MessageSquare, color: 'text-yellow-500' },
};

const statusLabels: Record<string, string> = {
  pending: 'Submitted for approval',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
};

function formatTimestamp(ts: string | Date | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function TimelineEntry({
  status,
  actorLabel,
  comments,
  timestamp,
  isLast,
}: {
  status: string;
  actorLabel: string;
  comments: string | null;
  timestamp: string | Date | null;
  isLast: boolean;
}) {
  const config = statusIcons[status] || statusIcons.pending;
  const Icon = config.icon;

  return (
    <div className="relative flex gap-3 pb-4">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
      )}
      {/* Icon */}
      <div className={cn('mt-0.5 flex-shrink-0 rounded-full p-1 border bg-background', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {statusLabels[status] || status}
        </p>
        <p className="text-xs text-muted-foreground">
          {actorLabel} {timestamp ? `• ${formatTimestamp(timestamp)}` : ''}
        </p>
        {comments && (
          <div className="mt-1 rounded-md bg-muted px-3 py-2 text-sm">
            {comments}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApprovalHistoryTimeline({ postId, mode }: ApprovalHistoryTimelineProps) {
  const { approvals, chain, isLoading } = useApprovalHistory(postId, mode);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (approvals.length === 0 && chain.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No approval history yet.
      </p>
    );
  }

  // Combine approvals and chain events into a timeline
  const entries: {
    status: string;
    actorLabel: string;
    comments: string | null;
    timestamp: string | Date | null;
    sortKey: number;
  }[] = [];

  for (const a of approvals) {
    entries.push({
      status: a.status,
      actorLabel: a.approverId ? `by ${a.approverId}` : '',
      comments: a.comments,
      timestamp: a.createdAt,
      sortKey: new Date(a.createdAt).getTime(),
    });
  }

  for (const step of chain) {
    if (step.respondedAt) {
      entries.push({
        status: step.status,
        actorLabel: `${step.approverRole}${step.approverId ? ` (${step.approverId})` : ''} — Step ${step.chainOrder}`,
        comments: step.comments,
        timestamp: step.respondedAt,
        sortKey: new Date(step.respondedAt).getTime(),
      });
    }
  }

  // Sort chronologically (oldest first)
  entries.sort((a, b) => a.sortKey - b.sortKey);

  // Deduplicate: if approval and chain step have same status + similar timestamp, keep one
  const deduped = entries.filter((entry, idx) => {
    if (idx === 0) return true;
    const prev = entries[idx - 1];
    const timeDiff = Math.abs(entry.sortKey - prev.sortKey);
    return !(entry.status === prev.status && timeDiff < 2000);
  });

  return (
    <ScrollArea className="max-h-64">
      <div className="pr-4">
        {deduped.map((entry, idx) => (
          <TimelineEntry
            key={`${entry.status}-${entry.sortKey}-${idx}`}
            status={entry.status}
            actorLabel={entry.actorLabel}
            comments={entry.comments}
            timestamp={entry.timestamp}
            isLast={idx === deduped.length - 1}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
