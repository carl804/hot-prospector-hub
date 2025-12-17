import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { tasksApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLTaskCreate, GHLTaskUpdate } from '@/types/ghl';
import { toast } from 'sonner';

export function usePipelineTasks(pipelineId: string) {
  const { data: opportunitiesData, isLoading: isLoadingOpps } = useGHLOpportunities({ limit: 100 });
  
  const tasksQuery = useQuery({
    queryKey: [...GHL_QUERY_KEYS.tasks, 'pipeline', pipelineId],
    queryFn: async () => {
      const allOpps = ((opportunitiesData as any)?.opportunities || []);
      const pipelineOpps = allOpps.filter((opp: any) => opp.pipelineId === pipelineId);
      
      console.log(`📋 Fetching tasks for ${pipelineOpps.length} clients in pipeline...`);
      
      const taskPromises = pipelineOpps.map(async (opp: any) => {
        const contactId = opp.contactId || opp.contact?.id;
        if (!contactId) {
          console.warn(`⚠️ No contactId for opportunity: ${opp.name}`);
          return [];
        }
        
        try {
          const ghlTasks = await tasksApi.listByContact(contactId);
          console.log(`✅ ${opp.name}: ${ghlTasks.length} tasks`);
          
          return ghlTasks.map((ghlTask: any) => ({
            id: ghlTask.id,
            title: ghlTask.title,
            description: ghlTask.body || '',
            clientId: opp.id,
            clientName: opp.name,
            contactId: contactId,
            dueDate: ghlTask.dueDate,
            priority: 'medium' as const,
            status: ghlTask.completed ? 'completed' as const : 'todo' as const,
            category: 'General',
            completed: ghlTask.completed,
            createdAt: ghlTask.dateAdded || new Date().toISOString(),
            completedAt: ghlTask.completed ? new Date().toISOString() : undefined,
          }));
        } catch (error) {
          console.error(`❌ Failed to fetch tasks for ${opp.name}:`, error);
          return [];
        }
      });
      
      const allTaskArrays = await Promise.all(taskPromises);
      const allTasks = allTaskArrays.flat();
      
      console.log(`🎉 TOTAL TASKS FETCHED: ${allTasks.length}`);
      return allTasks;
    },
    enabled: !!opportunitiesData && !isLoadingOpps,
    staleTime: 5 * 60 * 1000,   // ⭐ 5 minutes - tasks update more frequently
    gcTime: 15 * 60 * 1000,     // ⭐ 15 minutes
  });
  
  return { ...tasksQuery, isLoading: isLoadingOpps || tasksQuery.isLoading };
}

export function useGHLContactTasks(contactId: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.contactTasks(contactId),
    queryFn: () => tasksApi.listByContact(contactId),
    enabled: !!contactId,
    staleTime: 3 * 60 * 1000,   // ⭐ 3 minutes
    gcTime: 10 * 60 * 1000,     // ⭐ 10 minutes
  });
}

export function useGHLTask(contactId: string, taskId: string) {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.contactTasks(contactId), taskId],
    queryFn: () => tasksApi.get(contactId, taskId),
    enabled: !!contactId && !!taskId,
    staleTime: 2 * 60 * 1000,   // ⭐ 2 minutes
    gcTime: 10 * 60 * 1000,     // ⭐ 10 minutes
  });
}

export function useCreateGHLTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: Omit<GHLTaskCreate, 'contactId'> }) =>
      tasksApi.create(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task created');
    },
    onError: (error: Error) => toast.error(`Failed: ${error.message}`),
  });
}

export function useUpdateGHLTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, taskId, data }: { contactId: string; taskId: string; data: Partial<GHLTaskUpdate> }) =>
      tasksApi.update(contactId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task updated');
    },
    onError: (error: Error) => toast.error(`Failed: ${error.message}`),
  });
}

export function useDeleteGHLTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, taskId }: { contactId: string; taskId: string }) =>
      tasksApi.delete(contactId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task deleted');
    },
    onError: (error: Error) => toast.error(`Failed: ${error.message}`),
  });
}

export function useCompleteGHLTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, taskId, completed }: { contactId: string; taskId: string; completed: boolean }) =>
      tasksApi.complete(contactId, taskId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task updated');
    },
    onError: (error: Error) => toast.error(`Failed: ${error.message}`),
  });
}