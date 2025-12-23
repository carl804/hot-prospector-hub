import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureError } from '@/lib/sentry';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm font-mono text-muted-foreground overflow-auto max-h-32">
            {error.message}
          </div>
          <Button
            onClick={resetErrorBoundary}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function logError(error: Error, info: { componentStack?: string | null }) {
  // Log to console
  console.error('Error caught by boundary:', error);
  console.error('Component stack:', info.componentStack);

  // Send to Sentry in production
  captureError(error, { componentStack: info.componentStack });
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export function ErrorBoundary({ children, fallback, onReset }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}
      onError={logError}
      onReset={onReset}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Page-level error boundary with navigation reset
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleReset = () => {
    // Reload the current page
    window.location.reload();
  };

  return (
    <ErrorBoundary onReset={handleReset}>
      {children}
    </ErrorBoundary>
  );
}

// Component-level error boundary (doesn't reload page)
export function ComponentErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
