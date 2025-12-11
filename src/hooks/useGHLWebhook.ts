import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLWebhookPayload, GHLWebhookEvent } from '@/types/ghl';

// This hook handles real-time updates from GHL webhooks via SSE or WebSocket
// Your Vercel backend should broadcast webhook events to connected clients

interface UseGHLWebhookOptions {
  enabled?: boolean;
  onEvent?: (event: GHLWebhookPayload) => void;
}

export function useGHLWebhook(options: UseGHLWebhookOptions = {}) {
  const { enabled = true, onEvent } = options;
  const queryClient = useQueryClient();

  const invalidateQueriesForEvent = useCallback((eventType: GHLWebhookEvent) => {
    switch (eventType) {
      case 'ContactCreate':
      case 'ContactUpdate':
      case 'ContactDelete':
      case 'ContactDndUpdate':
      case 'ContactTagUpdate':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contacts });
        break;
      
      case 'OpportunityCreate':
      case 'OpportunityUpdate':
      case 'OpportunityDelete':
      case 'OpportunityStageUpdate':
      case 'OpportunityStatusUpdate':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
        break;
      
      case 'TaskCreate':
      case 'TaskComplete':
      case 'TaskUpdate':
      case 'TaskDelete':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
        // Also invalidate contact-specific tasks
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    // Option 1: Server-Sent Events (SSE) - simpler, one-way communication
    // Your Vercel backend would have an endpoint that streams GHL webhook events
    const eventSource = new EventSource('/api/ghl/webhooks/stream');

    eventSource.onmessage = (event) => {
      try {
        const payload: GHLWebhookPayload = JSON.parse(event.data);
        
        // Invalidate relevant queries
        invalidateQueriesForEvent(payload.type);
        
        // Call custom handler if provided
        onEvent?.(payload);
      } catch (error) {
        console.error('Failed to parse webhook event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // EventSource will automatically try to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [enabled, invalidateQueriesForEvent, onEvent]);

  // Manual refresh function
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ghl'] });
  }, [queryClient]);

  return { refreshAll };
}

// Alternative: WebSocket connection for bidirectional communication
export function useGHLWebSocket(options: UseGHLWebhookOptions = {}) {
  const { enabled = true, onEvent } = options;
  const queryClient = useQueryClient();

  const invalidateQueriesForEvent = useCallback((eventType: GHLWebhookEvent) => {
    switch (eventType) {
      case 'ContactCreate':
      case 'ContactUpdate':
      case 'ContactDelete':
      case 'ContactDndUpdate':
      case 'ContactTagUpdate':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contacts });
        break;
      
      case 'OpportunityCreate':
      case 'OpportunityUpdate':
      case 'OpportunityDelete':
      case 'OpportunityStageUpdate':
      case 'OpportunityStatusUpdate':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
        break;
      
      case 'TaskCreate':
      case 'TaskComplete':
      case 'TaskUpdate':
      case 'TaskDelete':
        queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ghl/webhooks/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for GHL updates');
    };

    ws.onmessage = (event) => {
      try {
        const payload: GHLWebhookPayload = JSON.parse(event.data);
        invalidateQueriesForEvent(payload.type);
        onEvent?.(payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Implement reconnection logic here if needed
    };

    return () => {
      ws.close();
    };
  }, [enabled, invalidateQueriesForEvent, onEvent]);

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ghl'] });
  }, [queryClient]);

  return { refreshAll };
}
