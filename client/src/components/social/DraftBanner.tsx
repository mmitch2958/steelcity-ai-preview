// P2-B008: Draft restore banner — shown when a previously saved draft exists

import { FileText, RotateCcw, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraftBannerProps {
  lastSaved: string | null;
  onRestore: () => void;
  onDelete: () => void;
  onSaveNow: () => void;
  className?: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DraftBanner({
  lastSaved,
  onRestore,
  onDelete,
  onSaveNow,
  className,
}: DraftBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        'animate-in slide-in-from-top-2 fade-in duration-200',
        className,
      )}
    >
      <FileText className="h-4 w-4 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Unsaved draft found
        </p>
        {lastSaved && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Saved {formatTimeAgo(lastSaved)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-amber-300 hover:bg-amber-100"
          onClick={onRestore}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Restore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-amber-600 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/** Inline auto-save indicator shown in the compose area */
export function AutoSaveIndicator({
  lastSaved,
  onSaveNow,
}: {
  lastSaved: string | null;
  onSaveNow: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {lastSaved ? (
        <span>Auto-saved {formatTimeAgo(lastSaved)}</span>
      ) : (
        <span>Not saved</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 px-1.5 text-[10px]"
        onClick={onSaveNow}
      >
        <Save className="h-3 w-3 mr-0.5" />
        Save now
      </Button>
    </div>
  );
}

export default DraftBanner;
