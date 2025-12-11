import { useState } from 'react';
import { useActivityLogs, type ActivityLog } from '@/hooks/useActivityLog';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  Globe, 
  Monitor, 
  RefreshCw, 
  Search,
  Eye,
  MousePointer,
  FileText,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ACTION_ICONS: Record<string, typeof Activity> = {
  page_view: Eye,
  click: MousePointer,
  form_submit: FileText,
  default: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  page_view: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  click: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  form_submit: 'bg-green-500/10 text-green-600 dark:text-green-400',
  default: 'bg-muted text-muted-foreground',
};

function parseUserAgent(ua: string) {
  // Simple UA parsing
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'Unknown';
  const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/)?.[0] || 'Unknown';
  return { browser, os };
}

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { data, isLoading, refetch, isFetching } = useActivityLogs(200);

  const logs = data?.logs || [];

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.ip.toLowerCase().includes(search.toLowerCase()) ||
      log.page.toLowerCase().includes(search.toLowerCase()) ||
      log.userAgent.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  // Get unique actions for filter
  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  // Stats
  const uniqueIPs = new Set(logs.map((log) => log.ip)).size;
  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor page visits and user activity
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{todayLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unique IPs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{uniqueIPs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by IP, page, or browser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <ScrollArea className="h-[500px] md:h-[600px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No activity logs found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here when users visit pages
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-border">
                {filteredLogs.map((log) => {
                  const ActionIcon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                  const { browser, os } = parseUserAgent(log.userAgent);
                  
                  return (
                    <div key={log.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', ACTION_COLORS[log.action] || ACTION_COLORS.default)}
                        >
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {log.action.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs">{log.ip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{log.page}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="w-4 h-4 shrink-0" />
                        <span className="text-xs">{browser} / {os}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Time</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead className="w-[180px]">Browser / OS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const ActionIcon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                    const { browser, os } = parseUserAgent(log.userAgent);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          <div className="space-y-0.5">
                            <div>{format(new Date(log.timestamp), 'MMM d, HH:mm')}</div>
                            <div className="text-muted-foreground">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn('text-xs', ACTION_COLORS[log.action] || ACTION_COLORS.default)}
                          >
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{log.ip}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.page}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Monitor className="w-4 h-4" />
                            <span>{browser} / {os}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
