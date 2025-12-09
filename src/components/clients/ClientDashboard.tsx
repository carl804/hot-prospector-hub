import { useState, useMemo } from 'react';
import { Search, Plus, Building2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Client, CLIENTS as INITIAL_CLIENTS, CSM_LIST } from '@/types/client';
import { Task } from '@/types/task';
import { MOCK_TASKS } from '@/data/taskData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type StatusFilter = 'all' | 'active' | 'completed';

export function ClientDashboard() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');

  // Get tasks for each client
  const getClientTasks = (clientId: string) => tasks.filter((t) => t.clientId === clientId);

  // Calculate client completion status
  const getClientProgress = (clientId: string) => {
    const clientTasks = getClientTasks(clientId);
    if (clientTasks.length === 0) return 0;
    return Math.round((clientTasks.filter((t) => t.status === 'completed').length / clientTasks.length) * 100);
  };

  // Filter clients
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

  // Global stats
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

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'todo' : 'completed',
              completedAt: task.status === 'completed' ? undefined : new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    setSelectedClient(updatedClient);
  };

  const handleNotifyCSM = (type: 'draft' | 'complete') => {
    if (!selectedClient) return;
    
    const updated = {
      ...selectedClient,
      draftBuildNotified: type === 'draft' ? true : selectedClient.draftBuildNotified,
      setupCompleteNotified: type === 'complete' ? true : selectedClient.setupCompleteNotified,
    };
    
    handleUpdateClient(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">HP</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Client Setup Tasks</h1>
                <p className="text-sm text-muted-foreground">Hot Prospector</p>
              </div>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Client
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium">Active Clients</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stats.activeClients}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Open Tasks</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stats.totalTasks}</p>
            </div>
            <div className={cn(
              'rounded-lg p-3',
              stats.overdue > 0 ? 'bg-destructive/10' : 'bg-secondary/50'
            )}>
              <div className={cn(
                'flex items-center gap-2 mb-1',
                stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className={cn(
                'text-2xl font-semibold',
                stats.overdue > 0 ? 'text-destructive' : 'text-foreground'
              )}>{stats.overdue}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Due Today</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stats.dueToday}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={csmFilter} onValueChange={setCsmFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All CSMs" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All CSMs</SelectItem>
                {CSM_LIST.map((csm) => (
                  <SelectItem key={csm.id} value={csm.id}>
                    {csm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Client Grid */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              tasks={getClientTasks(client.id)}
              onClick={() => setSelectedClient(client)}
            />
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

      {/* Client Task Panel */}
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

      {/* Intake Form Modal */}
      {showIntakeForm && selectedClient && (
        <IntakeFormModal
          client={selectedClient}
          onClose={() => setShowIntakeForm(false)}
        />
      )}
    </div>
  );
}
