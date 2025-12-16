import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Clock, AlertTriangle } from 'lucide-react';
import { Client, CSM_LIST } from '@/types/client';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientCard } from './ClientCard';
import { ClientTaskPanel } from './ClientTaskPanel';
import { IntakeFormModal } from './IntakeFormModal';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { useAllGHLTasks } from '@/hooks/useGHLTasks';

type StatusFilter = 'all' | 'active' | 'completed';

export function ClientDashboard() {
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useGHLOpportunities({ pipelineId: "QNloaHE61P6yedF6jEzk" });
  const { data: tasksData = [], isLoading: isLoadingTasks } = useAllGHLTasks();
  const isLoading = isLoadingOpportunities || isLoadingTasks;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');

  const clients: Client[] = useMemo(() => {
    const allOpportunities = ((opportunitiesData as any)?.opportunities || []);
    const filtered = allOpportunities.filter((opp: any) => opp.pipelineId === "QNloaHE61P6yedF6jEzk");
    if (filtered.length === 0) return [];
    if (!(opportunitiesData as any)?.opportunities) return [];
    
    return filtered.map((opp: any) => ({
      id: opp.id,
      name: opp.name,
      contactName: opp.contact?.name || 'Unknown Contact',
      contactEmail: opp.contact?.email || '',
      contactPhone: opp.contact?.phone || '',
      startDate: opp.createdAt,
      status: opp.status === 'won' ? 'completed' : opp.status === 'lost' || opp.status === 'abandoned' ? 'on_hold' : 'active',
      pipelineStage: opp.pipelineStageId as any,
      assignedCsmId: opp.assignedTo || 'csm-1',
      assessmentBooked: false,
      onboardingBooked: false,
      draftBuildNotified: false,
      setupCompleteNotified: false,
      intakeForm: {
        submittedAt: opp.createdAt,
        agencyName: opp.name,
        firstName: '',
        lastName: '',
        email: opp.contact?.email || '',
        phone: opp.contact?.phone || '',
      } as any,
    }));
  }, [opportunitiesData]);

  const tasks: Task[] = tasksData;
  const getClientTasks = (clientId: string) => tasks.filter((t) => t.clientId === clientId);

  const getClientProgress = (clientId: string) => {
    const clientTasks = getClientTasks(clientId);
    if (clientTasks.length === 0) return 0;
    return Math.round((clientTasks.filter((t) => t.status === 'completed').length / clientTasks.length) * 100);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contactName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const progress = getClientProgress(client.id);
      const isComplete = client.status === 'completed' || progress === 100;
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !isComplete) ||
        (statusFilter === 'completed' && isComplete);

      const matchesCsm = csmFilter === 'all' || client.assignedCsmId === csmFilter;
      return matchesSearch && matchesStatus && matchesCsm;
    });
  }, [clients, searchQuery, statusFilter, csmFilter, tasks]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const overdueTasks = activeTasks.filter((t) => {
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });
    const dueTodayTasks = activeTasks.filter((t) => isToday(new Date(t.dueDate)));
    const activeClients = clients.filter((c) => {
      const progress = getClientProgress(c.id);
      return c.status !== 'completed' && progress < 100;
    });

    return {
      activeClients: activeClients.length,
      totalTasks: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
    };
  }, [clients, tasks]);

  const handleToggleTask = () => console.log('Handled by mutation');
  const handleAddTask = () => console.log('Handled by mutation');
  const handleUpdateTask = () => console.log('Handled by mutation');
  const handleUpdateClient = (updatedClient: Client) => setSelectedClient(updatedClient);
  const handleNotifyCSM = (type: 'draft' | 'complete') => {
    if (!selectedClient) return;
    handleUpdateClient({
      ...selectedClient,
      draftBuildNotified: type === 'draft' ? true : selectedClient.draftBuildNotified,
      setupCompleteNotified: type === 'complete' ? true : selectedClient.setupCompleteNotified,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="border-b border-border bg-card shrink-0">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-foreground">Client Setup Tasks</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Manage client onboarding</p>
            </div>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Client</Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Building2 className="w-4 h-4" /><span className="text-xs">Active Clients</span></div>
              <p className="text-2xl font-semibold">{stats.activeClients}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Open Tasks</span></div>
              <p className="text-2xl font-semibold">{stats.totalTasks}</p>
            </div>
            <div className={cn('rounded-lg p-3 border', stats.overdue > 0 ? 'bg-destructive/10' : 'bg-secondary/50')}>
              <div className={cn('flex items-center gap-2 mb-1', stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                <AlertTriangle className="w-4 h-4" /><span className="text-xs">Overdue</span>
              </div>
              <p className={cn('text-2xl font-semibold', stats.overdue > 0 ? 'text-destructive' : '')}>{stats.overdue}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
              <div className="flex items-center gap-2 text-primary mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Due Today</span></div>
              <p className="text-2xl font-semibold">{stats.dueToday}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={csmFilter} onValueChange={setCsmFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All CSMs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CSMs</SelectItem>
                {CSM_LIST.map((csm) => <SelectItem key={csm.id} value={csm.id}>{csm.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} tasks={getClientTasks(client.id)} onClick={() => setSelectedClient(client)} />
          ))}
        </div>
        {filteredClients.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No clients found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {selectedClient && !showIntakeForm && (
        <ClientTaskPanel
          client={selectedClient}
          tasks={getClientTasks(selectedClient.id)}
          onClose={() => setSelectedClient(null)}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onViewIntakeForm={() => setShowIntakeForm(true)}
          onNotifyCSM={handleNotifyCSM}
          onUpdateClient={handleUpdateClient}
        />
      )}

      {showIntakeForm && selectedClient && (
        <IntakeFormModal client={selectedClient} onClose={() => setShowIntakeForm(false)} />
      )}
    </div>
  );
}