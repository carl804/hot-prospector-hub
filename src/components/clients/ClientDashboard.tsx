import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Clock, AlertTriangle } from 'lucide-react';
import { Client, CSM_LIST } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCard } from './ClientCard';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';

type StatusFilter = 'all' | 'active' | 'completed';

export function ClientDashboard() {
  const { data: opportunitiesData, isLoading } = useGHLOpportunities({ limit: 100 });
  // REMOVED: useAllGHLTasks() - was causing 403 error
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');

  const clients: Client[] = useMemo(() => {
    console.log('====== CLIENT MAPPING DEBUG ======');
    console.log('1. Raw data:', opportunitiesData);
    
    const allOpps = ((opportunitiesData as any)?.opportunities || []);
    console.log('2. Total fetched:', allOpps.length);
    console.log('3. Pipeline IDs:', [...new Set(allOpps.map((o: any) => o.pipelineId))]);
    
    const filtered = allOpps.filter((opp: any) => opp.pipelineId === "QNloaHE61P6yedF6jEzk");
    console.log('4. Filtered count:', filtered.length);
    console.log('5. Names:', filtered.map((o: any) => o.name));

    return filtered.map((opp: any) => ({
      id: opp.id,
      name: opp.name,
      contactName: opp.contact?.name || 'Unknown',
      contactEmail: opp.contact?.email || '',
      contactPhone: opp.contact?.phone || '',
      status: 'active' as const,
      stage: opp.pipelineStageId || '',
      setupProgress: 0,
      lastActivity: opp.updatedAt || new Date().toISOString(),
      tags: [],
    }));
  }, [opportunitiesData]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client accounts</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Client</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <Building2 className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-3xl font-bold">{clients.length}</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
          <p className="text-sm text-muted-foreground">Check console for debug info</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client} 
              tasks={[]} 
              onClick={() => console.log('Clicked:', client.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}