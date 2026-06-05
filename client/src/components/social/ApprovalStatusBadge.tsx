import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested' | null | undefined;

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  pending: {
    label: 'Pending Approval',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: MessageSquare,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  },
};

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  if (!status) return null;

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
