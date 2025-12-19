import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Clock, AlertTriangle, Users, Activity } from 'lucide-react';
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

// GHL Custom Field Keys for booking status (exact fieldKey values from GHL)
const GHL_FIELD_KEYS = {
  assessmentBooked: 'contact.assessment_call_booked',
  assessmentDate: 'contact.assessment_call_booked_date',
  onboardingBooked: 'contact.onboarding_call_booked',
  onboardingDate: 'contact.onboarding_call_booked_date',
  kickoffBooked: 'contact.kickoff_call_booked',
  kickoffDate: 'contact.kick_off_call_booked_date',
};

// Helper to get custom field value from contact by exact fieldKey
function getCustomFieldValue(contact: any, fieldKey: string): any {
  if (!contact?.customFields) return null;

  // Find field by exact fieldKey match first, then try partial match as fallback
  const field = contact.customFields.find((f: any) =>
    f.fieldKey === fieldKey ||
    f.fieldKey?.toLowerCase() === fieldKey.toLowerCase()
  );

  return field?.value ?? null;
}

// Check if a custom field value indicates "Yes" or true
function isFieldTrue(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1';
  }
  return false;
}

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

    // Debug: Log custom fields from first contact to help identify field keys
    if (filtered.length > 0 && filtered[0].contact?.customFields) {
      console.log('🔧 CUSTOM FIELDS DEBUG (first contact):',
        filtered[0].contact.customFields.map((f: any) => ({
          id: f.id,
          fieldKey: f.fieldKey,
          value: f.value
        }))
      );
    }

    return filtered.map((opp: any) => {
      const contact = opp.contact;

      // Extract custom field values for booking status using exact GHL field keys
      const assessmentValue = getCustomFieldValue(contact, GHL_FIELD_KEYS.assessmentBooked);
      const onboardingValue = getCustomFieldValue(contact, GHL_FIELD_KEYS.onboardingBooked);
      const kickoffValue = getCustomFieldValue(contact, GHL_FIELD_KEYS.kickoffBooked);

      // Extract dates
      const assessmentDate = getCustomFieldValue(contact, GHL_FIELD_KEYS.assessmentDate);
      const onboardingDate = getCustomFieldValue(contact, GHL_FIELD_KEYS.onboardingDate);
      const kickoffDate = getCustomFieldValue(contact, GHL_FIELD_KEYS.kickoffDate);

      // Debug logging for Micaela's contact
      if (opp.name?.toLowerCase().includes('micaela') || contact?.name?.toLowerCase().includes('micaela')) {
        console.log(`📋 ${opp.name} Custom Fields:`, {
          assessmentValue,
          onboardingValue,
          kickoffValue,
          allCustomFields: contact?.customFields
        });
      }

      return {
        id: opp.id,
        name: opp.name,
        contactId: contact?.id || null,
        contactName: contact?.name || 'Unknown',
        contactEmail: contact?.email || '',
        contactPhone: contact?.phone || '',
        status: 'active' as const,
        stage: opp.pipelineStageId || '',
        setupProgress: 0,
        lastActivity: opp.updatedAt || new Date().toISOString(),
        tags: [],
        // Map custom field values to boolean flags
        assessmentBooked: isFieldTrue(assessmentValue),
        assessmentDate: assessmentDate || undefined,
        onboardingBooked: isFieldTrue(onboardingValue),
        onboardingDate: onboardingDate || undefined,
        kickoffBooked: isFieldTrue(kickoffValue),
        kickoffDate: kickoffDate || undefined,
      };
    });
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
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client accounts</p>
        </div>
        <Button className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <div className="group relative bg-card rounded-2xl border border-border/40 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-secondary/80 rounded-md">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{stats.total}</p>
          <p className="text-sm text-muted-foreground mt-1">Clients</p>
        </div>

        {/* Active */}
        <div className="group relative bg-card rounded-2xl border border-border/40 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs font-medium text-success px-2 py-1 bg-success/10 rounded-md">
              Active
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-success">{stats.active}</p>
          <p className="text-sm text-muted-foreground mt-1">In progress</p>
        </div>

        {/* At Risk */}
        <div className="group relative bg-card rounded-2xl border border-border/40 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-xs font-medium text-destructive px-2 py-1 bg-destructive/10 rounded-md">
              Risk
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-destructive">{stats.atRisk}</p>
          <p className="text-sm text-muted-foreground mt-1">Need attention</p>
        </div>

        {/* Due Today */}
        <div className="group relative bg-card rounded-2xl border border-border/40 p-5 transition-all duration-200 hover:border-border/60 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-xs font-medium text-warning px-2 py-1 bg-warning/10 rounded-md">
              Today
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-warning">{stats.dueToday}</p>
          <p className="text-sm text-muted-foreground mt-1">Due today</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/50 border-transparent focus:bg-background focus:border-border transition-colors"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[160px] h-11 bg-secondary/50 border-transparent">
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
        <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center bg-secondary/20">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">No clients found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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