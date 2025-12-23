import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Session replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% when errors occur
      // Filter out non-error events in development
      beforeSend(event) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          return null;
        }
        return event;
      },
    });

    console.log('Sentry initialized');
  }
}

// Helper to capture exceptions with context
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log to console
  console.error('Error captured:', error, context);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
}

// Helper to add breadcrumb
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'app',
      data,
      level: 'info',
    });
  }
}

// Re-export Sentry for direct access when needed
export { Sentry };
