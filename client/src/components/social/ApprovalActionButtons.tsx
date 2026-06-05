import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

type ActionType = 'approve' | 'reject' | 'request_changes';

interface ApprovalActionButtonsProps {
  postId: string;
  approvalStatus: string | null;
  onApprove: (postId: string, comments?: string) => void;
  onReject: (postId: string, comments?: string) => void;
  onRequestChanges: (postId: string, comments?: string) => void;
  isLoading?: boolean;
}

const actionConfig: Record<ActionType, {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'default' | 'destructive' | 'outline';
}> = {
  approve: {
    title: 'Approve Post',
    description: 'Add an optional comment with your approval.',
    confirmLabel: 'Approve',
    variant: 'default',
  },
  reject: {
    title: 'Reject Post',
    description: 'Please provide a reason for rejecting this post.',
    confirmLabel: 'Reject',
    variant: 'destructive',
  },
  request_changes: {
    title: 'Request Changes',
    description: 'Describe what changes are needed.',
    confirmLabel: 'Request Changes',
    variant: 'outline',
  },
};

export function ApprovalActionButtons({
  postId,
  approvalStatus,
  onApprove,
  onReject,
  onRequestChanges,
  isLoading = false,
}: ApprovalActionButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [comments, setComments] = useState('');

  if (approvalStatus !== 'pending') return null;

  const openDialog = (type: ActionType) => {
    setActionType(type);
    setComments('');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!actionType) return;
    const trimmed = comments.trim() || undefined;

    switch (actionType) {
      case 'approve':
        onApprove(postId, trimmed);
        break;
      case 'reject':
        onReject(postId, trimmed);
        break;
      case 'request_changes':
        onRequestChanges(postId, trimmed);
        break;
    }

    setDialogOpen(false);
    setComments('');
    setActionType(null);
  };

  const config = actionType ? actionConfig[actionType] : null;

  return (
    <>
      <div className="flex items-center gap-2" role="group" aria-label="Approval actions">
        <Button
          size="sm"
          variant="default"
          onClick={() => openDialog('approve')}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white"
          aria-label="Approve this post"
        >
          <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => openDialog('reject')}
          disabled={isLoading}
          aria-label="Reject this post"
        >
          <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openDialog('request_changes')}
          disabled={isLoading}
          aria-label="Request changes to this post"
        >
          <MessageSquare className="h-4 w-4 mr-1" aria-hidden="true" />
          Request Changes
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config?.title}</DialogTitle>
            <DialogDescription>{config?.description}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add a comment..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            aria-label={config?.description || 'Comment'}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={config?.variant || 'default'}
              onClick={handleConfirm}
              disabled={isLoading}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : undefined}
            >
              {config?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
