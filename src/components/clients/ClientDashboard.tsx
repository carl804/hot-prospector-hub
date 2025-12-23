import { useState, useMemo } from 'react';
import { Search, Building2, Clock, AlertTriangle, Users, Activity } from 'lucide-react';
import { Client, CSM_LIST } from '@/types/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCard } from './ClientCard';
import { NotesModal } from '@/components/notes/NotesModal';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { usePipelineTasks } from '@/hooks/useGHLTasks';
import { useContactCustomFields } from '@/hooks/useContactCustomFields';

type StatusFilter = 'all' | 'active' | 'completed';

const TARGET_PIPELINE_ID = "QNloaHE61P6yedF6jEzk"; // 002. Account Setup

// GHL Custom Field Keys for booking status (exact fieldKey values from GHL)
const GHL_FIELD_KEYS = {
  assessmentBooked: 'contact.assessment_call_booked',
  assessmentDate: 'contact.assessment_call_booked_date',
  onboardingBooked: 'contact.onboarding_call_booked',
  onboardingDate: 'contact.onboarding_call_booked_date',
  kickoffBooked: 'contact.kickoff_call_booked',
  kickoffDate: 'contact.kickoff_call_booked_date',
  draftBuildNotified: 'contact.draft_build_notified',
  setupCompleteNotified: 'contact.setup_complete_notified',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');
  const [notesClient, setNotesClient] = useState<Client & { tasks: any[] } | null>(null);

  // First pass: extract basic client data and contact IDs
  const { basicClients, contactIds } = useMemo(() => {
    const allOpps = ((opportunitiesData as any)?.opportunities || []);
    const filtered = allOpps.filter((opp: any) => opp.pipelineId === TARGET_PIPELINE_ID);

    const ids: string[] = [];
    const clients = filtered.map((opp: any) => {
      const contact = opp.contact;
      const contactId = contact?.id || opp.contactId || null;
      if (contactId) ids.push(contactId);

      return {
        id: opp.id,
        name: opp.name,
        contactId,
        contactName: contact?.name || 'Unknown',
        contactEmail: contact?.email || '',
        contactPhone: contact?.phone || '',
        status: 'active' as const,
        stage: opp.pipelineStageId || '',
        setupProgress: 0,
        lastActivity: opp.updatedAt || new Date().toISOString(),
        tags: [],
      };
    });

    return { basicClients: clients, contactIds: ids };
  }, [opportunitiesData]);

  // Fetch custom fields for all contacts (separate API calls)
  const { customFieldsMap, isLoading: isLoadingCustomFields } = useContactCustomFields(contactIds);

  const isLoading = isLoadingOpps || isLoadingTasks;

  // Merge custom fields into clients
  const clients: Client[] = useMemo(() => {
    return basicClients.map((client) => {
      const customFields = client.contactId ? customFieldsMap.get(client.contactId) : null;

      // Helper to get value from the fetched custom fields
      // GHL custom fields can use either fieldKey or key property
      const getValue = (fieldKey: string) => {
        if (!customFields) return null;
        const field = customFields.find((f: any) => {
          const fKey = f.fieldKey || f.key || '';
          return fKey === fieldKey || fKey.toLowerCase() === fieldKey.toLowerCase();
        });
        return field?.value ?? null;
      };

      const assessmentValue = getValue(GHL_FIELD_KEYS.assessmentBooked);
      const onboardingValue = getValue(GHL_FIELD_KEYS.onboardingBooked);
      const kickoffValue = getValue(GHL_FIELD_KEYS.kickoffBooked);
      const draftBuildNotifiedValue = getValue(GHL_FIELD_KEYS.draftBuildNotified);
      const setupCompleteNotifiedValue = getValue(GHL_FIELD_KEYS.setupCompleteNotified);

      // Debug logging for all clients
      console.log(`📋 ${client.name} Custom Fields:`, {
        contactId: client.contactId,
        assessmentValue,
        onboardingValue,
        kickoffValue,
        draftBuildNotifiedValue,
        setupCompleteNotifiedValue,
        customFieldsCount: customFields?.length || 0,
        customFields: customFields?.slice(0, 5), // First 5 fields
      });

      return {
        ...client,
        assessmentBooked: isFieldTrue(assessmentValue),
        assessmentDate: getValue(GHL_FIELD_KEYS.assessmentDate) || undefined,
        onboardingBooked: isFieldTrue(onboardingValue),
        onboardingDate: getValue(GHL_FIELD_KEYS.onboardingDate) || undefined,
        kickoffBooked: isFieldTrue(kickoffValue),
        kickoffDate: getValue(GHL_FIELD_KEYS.kickoffDate) || undefined,
        draftBuildNotified: isFieldTrue(draftBuildNotifiedValue),
        setupCompleteNotified: isFieldTrue(setupCompleteNotifiedValue),
      };
    });
  }, [basicClients, customFieldsMap]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your client accounts</p>
      </div>

      {/* 🚀 2025 Modern Stats Cards - Glassmorphism + Gradients */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients - Primary gradient */}
        <div className="group relative card-modern overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-primary drop-shadow" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/70 px-2.5 py-1 bg-muted/60 rounded-lg uppercase tracking-wider">
                Total
              </span>
            </div>
            <p className="text-4xl font-black tracking-tighter tabular-nums mb-1">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-semibold">Clients</p>
          </div>
        </div>

        {/* Active - Success gradient */}
        <div className="group relative card-modern overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-5 h-5 text-success drop-shadow" />
              </div>
              <span className="text-[10px] font-bold text-success/80 px-2.5 py-1 bg-success/10 rounded-lg uppercase tracking-wider shadow-soft">
                Active
              </span>
            </div>
            <p className="text-4xl font-black tracking-tighter tabular-nums text-success mb-1">{stats.active}</p>
            <p className="text-xs text-muted-foreground font-semibold">In progress</p>
          </div>
        </div>

        {/* At Risk - Destructive gradient */}
        <div className="group relative card-modern overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-destructive/15 to-destructive/5 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-5 h-5 text-destructive drop-shadow animate-pulse" />
              </div>
              <span className="text-[10px] font-bold text-destructive/80 px-2.5 py-1 bg-destructive/10 rounded-lg uppercase tracking-wider shadow-soft">
                Risk
              </span>
            </div>
            <p className="text-4xl font-black tracking-tighter tabular-nums text-destructive mb-1">{stats.atRisk}</p>
            <p className="text-xs text-muted-foreground font-semibold">Need attention</p>
          </div>
        </div>

        {/* Due Today - Warning gradient */}
        <div className="group relative card-modern overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-warning/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning/15 to-warning/5 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5 text-warning drop-shadow" />
              </div>
              <span className="text-[10px] font-bold text-warning/90 px-2.5 py-1 bg-warning/10 rounded-lg uppercase tracking-wider shadow-soft">
                Today
              </span>
            </div>
            <p className="text-4xl font-black tracking-tighter tabular-nums text-warning mb-1">{stats.dueToday}</p>
            <p className="text-xs text-muted-foreground font-semibold">Due today</p>
          </div>
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
                  setNotesClient({ ...client, tasks: client.tasks });
                }
              }}
              onNotesClick={(e) => {
                e.stopPropagation();
                if (client.contactId) {
                  setNotesClient({ ...client, tasks: client.tasks });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {notesClient && notesClient.contactId && (
        <NotesModal
          contactId={notesClient.contactId}
          clientName={notesClient.name}
          completedTasks={notesClient.tasks.filter((t: any) => t.status === 'completed').length}
          totalTasks={notesClient.tasks.length}
          draftBuildNotified={notesClient.draftBuildNotified}
          setupCompleteNotified={notesClient.setupCompleteNotified}
          assessmentBooked={notesClient.assessmentBooked}
          assessmentDate={notesClient.assessmentDate}
          onboardingBooked={notesClient.onboardingBooked}
          onboardingDate={notesClient.onboardingDate}
          kickoffBooked={notesClient.kickoffBooked}
          kickoffDate={notesClient.kickoffDate}
          onClose={() => setNotesClient(null)}
        />
      )}
    </div>
  );
}