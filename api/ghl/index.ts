// Consolidated GHL API Route for Vercel (single endpoint to stay within free tier limits)
// This handles ALL GHL operations through a single API route

import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

type GHLAction = 
  | 'contacts.list' | 'contacts.get' | 'contacts.create' | 'contacts.update' | 'contacts.delete'
  | 'opportunities.list' | 'opportunities.get' | 'opportunities.create' | 'opportunities.update' | 'opportunities.delete' | 'opportunities.updateStatus'
  | 'pipelines.list' | 'pipelines.get'
  | 'tasks.list' | 'tasks.get' | 'tasks.create' | 'tasks.update' | 'tasks.delete' | 'tasks.complete'
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

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return res.status(500).json({ error: 'Missing GHL configuration' });
  }

  const headers = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  };

  try {
    const { action, params, data, id, contactId, taskId } = req.body as GHLRequest;

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      // ============ CONTACTS ============
      case 'contacts.list': {
        const searchParams = new URLSearchParams({ location_id: GHL_LOCATION_ID });
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

      // ============ OPPORTUNITIES ============
      case 'opportunities.list': {
        const searchParams = new URLSearchParams({ location_id: GHL_LOCATION_ID });
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

    const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
      method,
      headers,
      body,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('GHL API Error:', responseData);
      return res.status(response.status).json(responseData);
    }

    // ⭐ FIX: Extract tasks array from GHL response
    // GHL returns {tasks: [...], traceId: "..."} but we expect just the array
    if (action === 'tasks.list' && responseData.tasks) {
      return res.status(200).json(responseData.tasks);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('GHL API Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with GHL' });
  }
}