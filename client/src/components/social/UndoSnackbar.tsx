import { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UndoSnackbarProps {
  message: string;
  duration?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoSnackbar({
  message,
  duration = 8000,
  onUndo,
  onDismiss,
}: UndoSnackbarProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const handleUndo = () => {
    onUndo();
    setExiting(true);
    setTimeout(onDismiss, 150);
  };

  const handleClose = () => {
    setExiting(true);
    setTimeout(onDismiss, 150);
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'max-w-md w-[calc(100%-2rem)]',
        'bg-foreground text-background',
        'rounded-lg shadow-lg',
        'px-4 py-3',
        'flex items-center gap-3',
        'transition-all duration-200',
        exiting
          ? 'opacity-0 translate-y-4'
          : 'opacity-100 translate-y-0 animate-in slide-in-from-bottom-4 fade-in',
      )}
      role="status"
      aria-live="polite"
    >
      <Undo2 className="h-4 w-4 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        className="text-primary font-semibold underline underline-offset-2 hover:bg-transparent hover:text-primary/80 px-2"
      >
        Undo
      </Button>
      <button
        onClick={handleClose}
        className="text-background/70 hover:text-background transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default UndoSnackbar;
