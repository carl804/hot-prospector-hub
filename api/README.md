# Vercel API Routes for GHL Integration

This folder contains the API routes that will be deployed to Vercel.
When you deploy to Vercel, create these files in the `/api` folder.

## Required Environment Variables (set in Vercel dashboard)

```
GHL_API_KEY=your_gohighlevel_api_key
GHL_LOCATION_ID=your_location_id
GHL_WEBHOOK_SECRET=your_webhook_verification_secret (optional)
```

## API Routes to Create

### Contacts
- `api/ghl/contacts/index.ts` - GET (list), POST (create)
- `api/ghl/contacts/[id].ts` - GET, PUT, DELETE

### Opportunities  
- `api/ghl/opportunities/index.ts` - GET (list), POST (create)
- `api/ghl/opportunities/[id].ts` - GET, PUT, DELETE
- `api/ghl/opportunities/[id]/status.ts` - PUT (update status)

### Tasks
- `api/ghl/contacts/[contactId]/tasks/index.ts` - GET (list), POST (create)
- `api/ghl/contacts/[contactId]/tasks/[taskId].ts` - GET, PUT, DELETE
- `api/ghl/contacts/[contactId]/tasks/[taskId]/complete.ts` - PUT

### Pipelines
- `api/ghl/pipelines/index.ts` - GET (list)
- `api/ghl/pipelines/[id].ts` - GET

### Location Data
- `api/ghl/locations/tags/index.ts` - GET, POST
- `api/ghl/locations/tags/[id].ts` - GET, PUT, DELETE
- `api/ghl/locations/custom-fields/index.ts` - GET, POST
- `api/ghl/locations/custom-fields/[id].ts` - GET, PUT, DELETE
- `api/ghl/locations/custom-values/index.ts` - GET, POST
- `api/ghl/locations/custom-values/[id].ts` - GET, PUT, DELETE

### Webhooks
- `api/ghl/webhooks/index.ts` - POST (receive GHL webhooks)
- `api/ghl/webhooks/stream.ts` - GET (SSE for real-time updates)

## Example: Contacts API Route

```typescript
// api/ghl/contacts/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { GHL_API_KEY, GHL_LOCATION_ID } = process.env;

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    return res.status(500).json({ error: 'Missing GHL configuration' });
  }

  const headers = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': '2021-07-28',
  };

  try {
    if (req.method === 'GET') {
      const { limit = '20', skip = '0', query } = req.query;
      
      const params = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        limit: limit as string,
        skip: skip as string,
      });
      if (query) params.set('query', query as string);

      const response = await fetch(
        `${GHL_API_BASE}/contacts/?${params}`,
        { headers }
      );
      
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const response = await fetch(`${GHL_API_BASE}/contacts/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...req.body,
          locationId: GHL_LOCATION_ID,
        }),
      });
      
      const data = await response.json();
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('GHL API Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with GHL' });
  }
}
```

## Example: Webhook Handler

```typescript
// api/ghl/webhooks/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory store for SSE connections (use Redis in production)
// For Vercel, you'll need to use a service like Pusher, Ably, or Supabase Realtime

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature if you have a secret
  const { GHL_WEBHOOK_SECRET } = process.env;
  if (GHL_WEBHOOK_SECRET) {
    // Implement signature verification
  }

  const event = req.body;
  console.log('Received GHL webhook:', event.type);

  // Process the webhook event
  // Broadcast to connected clients via your real-time service
  
  return res.status(200).json({ received: true });
}
```

## Setting up GHL Webhooks

1. Go to GHL Settings > Webhooks
2. Add a new webhook pointing to: `https://your-vercel-domain.vercel.app/api/ghl/webhooks`
3. Select the events you want to receive:
   - Contact Created/Updated/Deleted
   - Opportunity Created/Updated/Deleted/Stage Changed
   - Task Created/Updated/Completed/Deleted

## Real-time Updates

For real-time sync from GHL to your app, you have options:

1. **Polling** (simplest): Periodically refetch data
2. **Pusher/Ably**: Use a real-time service to broadcast webhook events
3. **Supabase Realtime**: If you add Supabase later for database
4. **Vercel KV + SSE**: Store events in Vercel KV and stream via SSE
