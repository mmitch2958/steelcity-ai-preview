import { Component, type ErrorInfo, type ReactNode } from 'react';

export type ErrorBoundaryLevel = 'root' | 'tab' | 'component';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: ErrorBoundaryLevel;
  name?: string;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  level: ErrorBoundaryLevel;
  name: string;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    const context = {
      level: this.props.level ?? 'component',
      name: this.props.name ?? 'unknown',
      componentStack: errorInfo.componentStack ?? '',
      timestamp: new Date().toISOString(),
    };

    // Always log to console
    console.error(`[ErrorBoundary:${context.level}:${context.name}]`, error, context);

    // Store in localStorage for offline bug reports
    try {
      const stored = JSON.parse(localStorage.getItem('error_log') || '[]');
      stored.push({
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        message: error.message,
        stack: error.stack,
        ...context,
      });
      // Keep last 50
      if (stored.length > 50) stored.splice(0, stored.length - 50);
      localStorage.setItem('error_log', JSON.stringify(stored));
    } catch {
      // ignore
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const fallbackProps: ErrorFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        level: this.props.level ?? 'component',
        name: this.props.name ?? 'unknown',
        resetError: this.resetError,
      };

      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(fallbackProps)
          : this.props.fallback;
      }

      return <DefaultErrorFallback {...fallbackProps} />;
    }

    return this.props.children;
  }
}

// ─── Default Fallback UI ────────────────────────────────────────────

function DefaultErrorFallback({ error, errorInfo, level, name, resetError }: ErrorFallbackProps) {
  const isRoot = level === 'root';

  const handleReport = () => {
    const body = [
      `**Error:** ${error.message}`,
      `**Component:** ${name} (${level})`,
      `**URL:** ${window.location.href}`,
      `**User Agent:** ${navigator.userAgent}`,
      `**Time:** ${new Date().toISOString()}`,
      '',
      '```',
      error.stack ?? 'No stack trace',
      '```',
    ].join('\n');

    // Open mailto with pre-filled bug report
    const mailto = `mailto:support@steelcity-ai.com?subject=${encodeURIComponent(
      `Bug Report: ${error.message.slice(0, 80)}`
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-8 text-center ${
        isRoot ? 'min-h-screen bg-background' : 'rounded-lg border border-destructive/20 bg-destructive/5'
      }`}
    >
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-foreground">
        {isRoot ? 'Something went wrong' : `This section encountered an error`}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {isRoot
          ? "We're sorry — the app ran into an unexpected problem. Please try refreshing the page."
          : 'This part of the app hit an issue, but everything else should still work.'}
      </p>

      {isDev && (
        <details className="mt-2 w-full max-w-xl text-left">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Developer details
          </summary>
          <div className="mt-2 space-y-2 rounded bg-muted p-3 text-xs">
            <p className="font-mono text-destructive">{error.message}</p>
            {error.stack && (
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
                {error.stack}
              </pre>
            )}
            {errorInfo?.componentStack && (
              <>
                <p className="font-medium">Component Stack:</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </details>
      )}

      <div className="flex gap-2">
        <button
          onClick={resetError}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
        <button
          onClick={handleReport}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Report Bug
        </button>
        {isRoot && (
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;
