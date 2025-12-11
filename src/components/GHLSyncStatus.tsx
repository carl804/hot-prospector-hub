import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { API_BASE_URL } from '@/services/ghl/config';

interface SyncStatus {
  status: 'connected' | 'disconnected' | 'checking';
  lastSync: Date | null;
  error?: string;
}

export function GHLSyncStatus() {
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ghl-health'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/ghl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health' }),
      });
      if (!response.ok) throw new Error('Connection failed');
      return response.json();
    },
    refetchInterval: 60000, // Check every minute
    retry: 1,
  });

  useEffect(() => {
    if (data?.connected) {
      setLastSync(new Date());
    }
  }, [data]);

  const status: SyncStatus['status'] = isLoading || isFetching 
    ? 'checking' 
    : isError 
      ? 'disconnected' 
      : data?.connected 
        ? 'connected' 
        : 'disconnected';

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return lastSync.toLocaleDateString();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 h-8 px-2 sm:px-3',
            status === 'connected' && 'text-green-600 dark:text-green-400',
            status === 'disconnected' && 'text-destructive',
            status === 'checking' && 'text-muted-foreground'
          )}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {status === 'checking' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : status === 'connected' ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline text-xs font-medium">
            {status === 'checking' ? 'Checking...' : status === 'connected' ? 'GHL Connected' : 'GHL Offline'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-2 h-2 rounded-full',
              status === 'connected' && 'bg-green-500',
              status === 'disconnected' && 'bg-destructive',
              status === 'checking' && 'bg-muted-foreground animate-pulse'
            )} />
            <span>
              {status === 'connected' ? 'Connected to GoHighLevel' : 
               status === 'disconnected' ? 'Connection failed' : 'Checking connection...'}
            </span>
          </div>
          {lastSync && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Last sync: {formatLastSync()}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
