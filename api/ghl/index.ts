// Consolidated GHL API Route for Vercel (single endpoint to stay within free tier limits)
// This handles ALL GHL operations through a single API route
// Rate limiting and validation are inlined to reduce serverless function count

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Bottleneck from 'bottleneck';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// ============ INLINED RATE LIMITER ============
// GHL API limits: ~100 requests per minute, we'll be conservative
const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100,
  reservoir: 100,
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60 * 1000,
});

let consecutiveRateLimits = 0;
const MAX_BACKOFF_MS = 30000;
const BASE_BACKOFF_MS = 1000;

function getBackoffDelay(): number {
  if (consecutiveRateLimits === 0) return 0;
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, consecutiveRateLimits - 1), MAX_BACKOFF_MS);
}

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  return limiter.schedule(async () => {
    const backoffDelay = getBackoffDelay();
    if (backoffDelay > 0) {
      console.log(`⏳ Rate limit backoff: waiting ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    const response = await fetch(url, options);

    if (response.status === 429) {
      consecutiveRateLimits++;
      console.warn(`⚠️ GHL Rate limit hit (${consecutiveRateLimits} consecutive)`);
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : getBackoffDelay();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      const retryResponse = await fetch(url, options);
      if (retryResponse.status !== 429) {
        consecutiveRateLimits = Math.max(0, consecutiveRateLimits - 1);
      }
      return retryResponse;
    }

    if (response.ok) {
      consecutiveRateLimits = 0;
    }

    return response;
  });
}

// ============ INLINED VALIDATION ============
function validateGHLConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.GHL_API_KEY) missing.push('GHL_API_KEY');
  if (!process.env.GHL_LOCATION_ID) missing.push('GHL_LOCATION_ID');
  return { valid: missing.length === 0, missing };
}

// ============ GHL ACTION TYPES ============
type GHLAction =
  | 'contacts.list' | 'contacts.get' | 'contacts.create' | 'contacts.update' | 'contacts.delete' | 'contacts.addTag' | 'contacts.updateCustomField'
  | 'opportunities.list' | 'opportunities.get' | 'opportunities.create' | 'opportunities.update' | 'opportunities.delete' | 'opportunities.updateStatus'
  | 'pipelines.list' | 'pipelines.get'
  | 'tasks.list' | 'tasks.get' | 'tasks.create' | 'tasks.update' | 'tasks.delete' | 'tasks.complete'
  | 'notes.list' | 'notes.get' | 'notes.create' | 'notes.update' | 'notes.delete'
  | 'tags.list' | 'tags.get' | 'tags.create' | 'tags.update' | 'tags.delete'
  | 'customFields.list' | 'customFields.get' | 'customFields.create' | 'customFields.update' | 'customFields.delete'
  | 'customValues.list' | 'customValues.get' | 'customValues.create' | 'customValues.update' | 'customValues.delete'
  | 'health';

interface GHLRequest {
  action: GHLAction;
  params?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>;
  id?: string;
  contactId?: string;
  taskId?: string;
  noteId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { GHL_API_KEY, GHL_LOCATION_ID } = process.env;

  // Health check
  if (req.method === 'GET' && !req.body?.action) {
    return res.status(200).json({
      status: 'ok',
      connected: !!GHL_API_KEY && !!GHL_LOCATION_ID,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate GHL configuration
  const ghlConfig = validateGHLConfig();
  if (!ghlConfig.valid) {
    return res.status(500).json({
      error: 'Missing GHL configuration',
      missing: ghlConfig.missing,
    });
  }

  const headers = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  };

  try {
    const { action, params, data, id, contactId, taskId, noteId } = req.body as GHLRequest;

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      // ============ CONTACTS ============
      case 'contacts.list': {
        const searchParams = new URLSearchParams({ location_id: GHL_LOCATION_ID! });
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.startAfter) searchParams.set('startAfter', String(params.startAfter));
        if (params?.startAfterId) searchParams.set('startAfterId', String(params.startAfterId));
        if (params?.skip) searchParams.set('skip', String(params.skip));
        if (params?.query) searchParams.set('query', String(params.query));
        endpoint = `/contacts/?${searchParams}`;
        break;
      }
      case 'contacts.get':
        endpoint = `/contacts/${id}`;
        break;
      case 'contacts.create':
        endpoint = '/contacts/';
        method = 'POST';
        body = JSON.stringify({ ...data, location_id: GHL_LOCATION_ID });
        break;
      case 'contacts.update':
        endpoint = `/contacts/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'contacts.delete':
        endpoint = `/contacts/${id}`;
        method = 'DELETE';
        break;
      case 'contacts.addTag':
        endpoint = `/contacts/${contactId}/tags`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'contacts.updateCustomField':
        endpoint = `/contacts/${contactId}`;
        method = 'PUT';
        body = JSON.stringify({
          customFields: [
            {
              key: (data as any).fieldKey,
              field_value: (data as any).value,
            },
          ],
        });
        break;

      // ============ OPPORTUNITIES ============
      case 'opportunities.list': {
        const searchParams = new URLSearchParams({ location_id: GHL_LOCATION_ID! });
        if (params?.pipelineId) searchParams.set('pipelineId', String(params.pipelineId));
        if (params?.stageId) searchParams.set('stageId', String(params.stageId));
        if (params?.status) searchParams.set('status', String(params.status));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.startAfter) searchParams.set('startAfter', String(params.startAfter));
        if (params?.startAfterId) searchParams.set('startAfterId', String(params.startAfterId));
        endpoint = `/opportunities/search?${searchParams}`;
        break;
      }
      case 'opportunities.get':
        endpoint = `/opportunities/${id}`;
        break;
      case 'opportunities.create':
        endpoint = '/opportunities/';
        method = 'POST';
        body = JSON.stringify({ ...data, location_id: GHL_LOCATION_ID });
        break;
      case 'opportunities.update':
        endpoint = `/opportunities/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'opportunities.delete':
        endpoint = `/opportunities/${id}`;
        method = 'DELETE';
        break;
      case 'opportunities.updateStatus':
        endpoint = `/opportunities/${id}/status`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;

      // ============ PIPELINES ============
      case 'pipelines.list':
        endpoint = `/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`;
        break;
      case 'pipelines.get':
        endpoint = `/opportunities/pipelines/${id}`;
        break;

      // ============ TASKS ============
      case 'tasks.list':
        endpoint = `/contacts/${contactId}/tasks`;
        break;
      case 'tasks.get':
        endpoint = `/contacts/${contactId}/tasks/${taskId}`;
        break;
      case 'tasks.create':
        endpoint = `/contacts/${contactId}/tasks`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'tasks.update':
        endpoint = `/contacts/${contactId}/tasks/${taskId}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'tasks.delete':
        endpoint = `/contacts/${contactId}/tasks/${taskId}`;
        method = 'DELETE';
        break;
      case 'tasks.complete':
        endpoint = `/contacts/${contactId}/tasks/${taskId}/completed`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;

      // ============ NOTES ============
      case 'notes.list':
        endpoint = `/contacts/${contactId}/notes`;
        break;
      case 'notes.get':
        endpoint = `/contacts/${contactId}/notes/${noteId}`;
        break;
      case 'notes.create':
        endpoint = `/contacts/${contactId}/notes`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'notes.update':
        endpoint = `/contacts/${contactId}/notes/${noteId}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'notes.delete':
        endpoint = `/contacts/${contactId}/notes/${noteId}`;
        method = 'DELETE';
        break;

      // ============ TAGS ============
      case 'tags.list':
        endpoint = `/locations/${GHL_LOCATION_ID}/tags`;
        break;
      case 'tags.get':
        endpoint = `/locations/${GHL_LOCATION_ID}/tags/${id}`;
        break;
      case 'tags.create':
        endpoint = `/locations/${GHL_LOCATION_ID}/tags`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'tags.update':
        endpoint = `/locations/${GHL_LOCATION_ID}/tags/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'tags.delete':
        endpoint = `/locations/${GHL_LOCATION_ID}/tags/${id}`;
        method = 'DELETE';
        break;

      // ============ CUSTOM FIELDS ============
      case 'customFields.list': {
        const model = params?.model || 'contact';
        endpoint = `/locations/${GHL_LOCATION_ID}/customFields?model=${model}`;
        break;
      }
      case 'customFields.get':
        endpoint = `/locations/${GHL_LOCATION_ID}/customFields/${id}`;
        break;
      case 'customFields.create':
        endpoint = `/locations/${GHL_LOCATION_ID}/customFields`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'customFields.update':
        endpoint = `/locations/${GHL_LOCATION_ID}/customFields/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'customFields.delete':
        endpoint = `/locations/${GHL_LOCATION_ID}/customFields/${id}`;
        method = 'DELETE';
        break;

      // ============ CUSTOM VALUES ============
      case 'customValues.list':
        endpoint = `/locations/${GHL_LOCATION_ID}/customValues`;
        break;
      case 'customValues.get':
        endpoint = `/locations/${GHL_LOCATION_ID}/customValues/${id}`;
        break;
      case 'customValues.create':
        endpoint = `/locations/${GHL_LOCATION_ID}/customValues`;
        method = 'POST';
        body = JSON.stringify(data);
        break;
      case 'customValues.update':
        endpoint = `/locations/${GHL_LOCATION_ID}/customValues/${id}`;
        method = 'PUT';
        body = JSON.stringify(data);
        break;
      case 'customValues.delete':
        endpoint = `/locations/${GHL_LOCATION_ID}/customValues/${id}`;
        method = 'DELETE';
        break;

      // ============ HEALTH CHECK ============
      case 'health':
        return res.status(200).json({
          status: 'ok',
          connected: true,
          timestamp: new Date().toISOString(),
        });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // Use rate-limited fetch with exponential backoff
    const response = await rateLimitedFetch(`${GHL_API_BASE}${endpoint}`, {
      method,
      headers,
      body,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('GHL API Error:', responseData);
      return res.status(response.status).json(responseData);
    }

    // Extract nested data from GHL responses
    if (action === 'contacts.get' && responseData.contact) {
      return res.status(200).json(responseData.contact);
    }
    if (action === 'customFields.list' && responseData.customFields) {
      return res.status(200).json(responseData.customFields);
    }
    if (action === 'tasks.list' && responseData.tasks) {
      return res.status(200).json(responseData.tasks);
    }
    if (action === 'notes.list' && responseData.notes) {
      return res.status(200).json(responseData.notes);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('GHL API Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with GHL' });
  }
}
