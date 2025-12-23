import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '@/services/ghl/config';

export interface ActivityLog {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  page: string;
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
}

export function useActivityLogs(limit = 100) {
  return useQuery({
    queryKey: ['activity-logs', limit],
    queryFn: async (): Promise<ActivityLogsResponse> => {
      const response = await fetch(`${API_BASE_URL}/activity/log?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { page: string; action: string; userId?: string; metadata?: Record<string, unknown> }) => {
      const response = await fetch(`${API_BASE_URL}/activity/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to log activity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

// Hook to automatically log page views (throttled to prevent spam)
export function useAutoLogPageView() {
  const location = useLocation();
  const logActivity = useLogActivity();

  useEffect(() => {
    // Only log in production (when API is available)
    if (import.meta.env.PROD || import.meta.env.VITE_API_BASE_URL) {
      const page = location.pathname;
      const now = Date.now();
      const storageKey = `activity_log_${page}`;
      const lastLogged = localStorage.getItem(storageKey);

      // Only log if:
      // 1. Never logged this page before, OR
      // 2. Last log was more than 30 minutes ago
      const THROTTLE_TIME = 30 * 60 * 1000; // 30 minutes

      if (!lastLogged || now - parseInt(lastLogged) > THROTTLE_TIME) {
        logActivity.mutate({
          page,
          action: 'page_view',
        });
        localStorage.setItem(storageKey, now.toString());
      }
    }
  }, [location.pathname]);
}
