import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Clock, AlertTriangle } from 'lucide-react';
import { Client, CSM_LIST } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCard } from './ClientCard';
import { NotesModal } from '@/components/notes/NotesModal';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { usePipelineTasks } from '@/hooks/useGHLTasks';

type StatusFilter = 'all' | 'active' | 'completed';

const TARGET_PIPELINE_ID = "QNloaHE61P6yedF6jEzk"; // 002. Account Setup

export function ClientDashboard() {
  const { data: opportunitiesData, isLoading: isLoadingOpps } = useGHLOpportunities({ limit: 100 });
  const { data: tasksData = [], isLoading: isLoadingTasks } = usePipelineTasks(TARGET_PIPELINE_ID);
  const isLoading = isLoadingOpps || isLoadingTasks;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');
  const [notesClient, setNotesClient] = useState<{ contactId: string; name: string; tasks: any[] } | null>(null);

  const clients: Client[] = useMemo(() => {
    console.log('====== CLIENT MAPPING DEBUG ======');
    console.log('1. Raw data:', opportunitiesData);
    
    const allOpps = ((opportunitiesData as any)?.opportunities || []);
    console.log('2. Total fetched:', allOpps.length);
    console.log('3. Pipeline IDs:', [...new Set(allOpps.map((o: any) => o.pipelineId))]);
    
    const filtered = allOpps.filter((opp: any) => opp.pipelineId === TARGET_PIPELINE_ID);
    console.log('4. Filtered count:', filtered.length);
    console.log('5. Names:', filtered.map((o: any) => o.name));

    return filtered.map((opp: any) => ({
      id: opp.id,
      name: opp.name,
      contactId: opp.contact?.id || null,
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

  const clientsWithTasks = useMemo(() => {
    console.log('====== TASKS MAPPING DEBUG ======');
    console.log('1. Total tasks fetched:', tasksData.length);
    console.log('2. Tasks by client:', tasksData.reduce((acc: any, task: any) => {
      acc[task.clientName] = (acc[task.clientName] || 0) + 1;
      return acc;
    }, {}));

    return clients.map(client => {
      const clientTasks = tasksData.filter((task: any) => task.clientId === client.id);
      
      const overdueTasks = clientTasks.filter((task: any) => 
        !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
      );
      
      const dueTodayTasks = clientTasks.filter((task: any) => {
        if (!task.dueDate || task.completed) return false;
        const today = new Date().toDateString();
        return new Date(task.dueDate).toDateString() === today;
      });

      console.log(`📊 ${client.name}: ${clientTasks.length} tasks (${overdueTasks.length} overdue, ${dueTodayTasks.length} today)`);

      return {
        ...client,
        tasks: clientTasks,
        overdueTaskCount: overdueTasks.length,
        dueTodayTaskCount: dueTodayTasks.length,
      };
    });
  }, [clients, tasksData]);

  const filteredClients = useMemo(() => {
    return clientsWithTasks.filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && client.status === 'active') ||
        (statusFilter === 'completed' && client.status === 'completed');
      
      return matchesSearch && matchesStatus;
    });
  }, [clientsWithTasks, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const atRisk = clientsWithTasks.filter(c => c.overdueTaskCount > 0).length;
    const dueToday = clientsWithTasks.filter(c => c.dueTodayTaskCount > 0).length;

    return { total, active, atRisk, dueToday };
  }, [clients, clientsWithTasks]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
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
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Clients</p>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <p className="text-3xl font-bold text-blue-500">{stats.active}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <p className="text-sm text-muted-foreground">At Risk</p>
          </div>
          <p className="text-3xl font-bold text-orange-500">{stats.atRisk}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <p className="text-sm text-muted-foreground">Due Today</p>
          </div>
          <p className="text-3xl font-bold text-purple-500">{stats.dueToday}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
          <p className="text-sm text-muted-foreground">Check console for debug info</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              tasks={client.tasks}
              onClick={() => {
                // Clicking the card also opens notes modal
                if (client.contactId) {
                  setNotesClient({
                    contactId: client.contactId,
                    name: client.name,
                    tasks: client.tasks,
                  });
                }
              }}
              onNotesClick={(e) => {
                e.stopPropagation();
                if (client.contactId) {
                  setNotesClient({
                    contactId: client.contactId,
                    name: client.name,
                    tasks: client.tasks,
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {notesClient && (
        <NotesModal
          contactId={notesClient.contactId}
          clientName={notesClient.name}
          completedTasks={notesClient.tasks.filter((t: any) => t.status === 'completed').length}
          totalTasks={notesClient.tasks.length}
          onClose={() => setNotesClient(null)}
        />
      )}
    </div>
  );
}