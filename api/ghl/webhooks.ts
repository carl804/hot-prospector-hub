// GHL Webhook Handler for Vercel
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Webhook event types from GHL
type WebhookEventType =
  | 'OpportunityStageUpdate'
  | 'OpportunityStatusUpdate'
  | 'TaskComplete'
  | 'TaskCreate'
  | 'TaskUpdate'
  | 'ContactCreate'
  | 'ContactUpdate'
  | 'ContactDelete'
  | 'NoteCreate'
  | 'NoteUpdate';

interface WebhookEvent {
  type: WebhookEventType;
  locationId: string;
  id?: string;
  contactId?: string;
  opportunityId?: string;
  taskId?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

// In-memory event store (replace with database in production)
const eventStore: WebhookEvent[] = [];
const MAX_EVENTS = 500;

// Process different event types
async function processEvent(event: WebhookEvent): Promise<{ processed: boolean; action?: string }> {
  const { type, contactId, opportunityId, taskId } = event;

  switch (type) {
    case 'OpportunityStageUpdate':
    case 'OpportunityStatusUpdate':
      console.log(`📊 Opportunity update: ${opportunityId}`);
      // Cache invalidation hint - clients should refetch opportunities
      return { processed: true, action: 'invalidate:opportunities' };

    case 'TaskComplete':
    case 'TaskCreate':
    case 'TaskUpdate':
      console.log(`✅ Task event (${type}): ${taskId} for contact ${contactId}`);
      // Cache invalidation hint - clients should refetch tasks
      return { processed: true, action: 'invalidate:tasks' };

    case 'ContactCreate':
    case 'ContactUpdate':
    case 'ContactDelete':
      console.log(`👤 Contact event (${type}): ${contactId}`);
      // Cache invalidation hint - clients should refetch contacts
      return { processed: true, action: 'invalidate:contacts' };

    case 'NoteCreate':
    case 'NoteUpdate':
      console.log(`📝 Note event (${type}) for contact: ${contactId}`);
      return { processed: true, action: 'invalidate:notes' };

    default:
      console.log(`❓ Unknown event type: ${type}`);
      return { processed: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Return recent events (for polling/debugging)
  if (req.method === 'GET') {
    const limit = Math.min(Number(req.query.limit) || 50, MAX_EVENTS);
    const events = eventStore.slice(-limit);
    return res.status(200).json({ events, total: eventStore.length });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event: WebhookEvent = {
      ...req.body,
      timestamp: new Date().toISOString(),
    };

    console.log('🔔 Received GHL webhook:', event.type);

    // Store event
    eventStore.push(event);
    if (eventStore.length > MAX_EVENTS) {
      eventStore.shift(); // Remove oldest
    }

    // Process the event
    const result = await processEvent(event);

    return res.status(200).json({
      received: true,
      type: event.type,
      ...result,
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
