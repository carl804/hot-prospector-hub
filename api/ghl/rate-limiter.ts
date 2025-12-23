// GHL API Rate Limiter using Bottleneck
import Bottleneck from 'bottleneck';

// GHL API limits: ~100 requests per minute, we'll be conservative
// Using 10 req/sec max with 5 concurrent requests
const limiter = new Bottleneck({
  maxConcurrent: 5,        // Max 5 concurrent requests
  minTime: 100,            // Min 100ms between requests (10 req/sec)
  reservoir: 100,          // Start with 100 requests available
  reservoirRefreshAmount: 100,  // Refill to 100
  reservoirRefreshInterval: 60 * 1000, // Refill every minute
});

// Track 429 responses for adaptive backoff
let consecutiveRateLimits = 0;
const MAX_BACKOFF_MS = 30000;
const BASE_BACKOFF_MS = 1000;

// Exponential backoff calculator
function getBackoffDelay(): number {
  if (consecutiveRateLimits === 0) return 0;
  const delay = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, consecutiveRateLimits - 1),
    MAX_BACKOFF_MS
  );
  return delay;
}

// Rate-limited fetch wrapper
export async function rateLimitedFetch(
  url: string,
  options: RequestInit
): Promise<Response> {
  return limiter.schedule(async () => {
    // Add backoff delay if we've hit rate limits
    const backoffDelay = getBackoffDelay();
    if (backoffDelay > 0) {
      console.log(`⏳ Rate limit backoff: waiting ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    const response = await fetch(url, options);

    if (response.status === 429) {
      consecutiveRateLimits++;
      console.warn(`⚠️ GHL Rate limit hit (${consecutiveRateLimits} consecutive)`);

      // Get retry-after header if available
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : getBackoffDelay();

      // Wait and retry once
      await new Promise(resolve => setTimeout(resolve, waitTime));
      const retryResponse = await fetch(url, options);

      if (retryResponse.status !== 429) {
        consecutiveRateLimits = Math.max(0, consecutiveRateLimits - 1);
      }

      return retryResponse;
    }

    // Reset counter on successful requests
    if (response.ok) {
      consecutiveRateLimits = 0;
    }

    return response;
  });
}

// Get current limiter status
export function getRateLimiterStatus() {
  return {
    running: limiter.running(),
    queued: limiter.queued(),
    done: limiter.done(),
    consecutiveRateLimits,
  };
}

// Reset rate limiter (useful for testing)
export function resetRateLimiter() {
  consecutiveRateLimits = 0;
  limiter.updateSettings({
    reservoir: 100,
  });
}

export default limiter;
