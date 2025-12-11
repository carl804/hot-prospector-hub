# Vercel API Routes for GHL Integration

This project uses a **consolidated API approach** to stay within Vercel's free tier limit of 12 API routes.

## Required Environment Variables (set in Vercel dashboard)

```
GHL_API_KEY=your_gohighlevel_api_key
GHL_LOCATION_ID=your_location_id
VITE_API_BASE_URL=/api (or your custom domain)
```

## API Routes (Only 3 needed!)

1. **`api/ghl/index.ts`** - Single endpoint handling ALL GHL operations
2. **`api/ghl/webhooks.ts`** - Webhook receiver for real-time GHL updates  
3. **`api/activity/log.ts`** - Activity logging with IP detection

## How It Works

Instead of separate endpoints for each GHL resource, we use a single POST endpoint with an `action` parameter:

```typescript
// Client-side call example
fetch('/api/ghl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'contacts.list',
    params: { limit: 20 }
  })
});

// Available actions:
// contacts: list, get, create, update, delete
// opportunities: list, get, create, update, delete, updateStatus
// pipelines: list, get
// tasks: list, get, create, update, delete, complete
// tags: list, get, create, update, delete
// customFields: list, get, create, update, delete
// customValues: list, get, create, update, delete
// health: check connection status
```

## Setting up GHL Webhooks

1. Go to GHL Settings > Webhooks
2. Add webhook URL: `https://your-domain.vercel.app/api/ghl/webhooks`
3. Select events: Contact, Opportunity, Task changes

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!
