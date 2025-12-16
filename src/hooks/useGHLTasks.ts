import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGHLContacts } from '@/hooks/useGHLContacts';
import { tasksApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLTaskCreate, GHLTaskUpdate } from '@/types/ghl';
import { toast } from 'sonner';

export function useGHLContactTasks(contactId: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.contactTasks(contactId),
    queryFn: () => tasksApi.listByContact(contactId),
    enabled: !!contactId,
  });
}

export function useGHLTask(contactId: string, taskId: string) {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.contactTasks(contactId), taskId],
    queryFn: () => tasksApi.get(contactId, taskId),
    enabled: !!contactId && !!taskId,
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

export function useAllGHLTasks() {
  const { data: contactsData, isLoading: isLoadingContacts } = useGHLContacts();
  const contacts = ((contactsData as any)?.contacts || []);
  const contactIds = contacts.map((c) => c.id);

  const tasksQuery = useQuery({
    queryKey: [...GHL_QUERY_KEYS.tasks, 'all-contacts', contactIds],
    queryFn: async () => {
      const taskPromises = contacts.map(async (contact) => {
        const ghlTasks = await tasksApi.listByContact(contact.id);
        return ghlTasks.map((ghlTask: any) => ({
          id: ghlTask.id,
          title: ghlTask.title,
          description: ghlTask.body || '',
          clientId: ghlTask.contactId,
          clientName: contact.contactName || `${contact.firstName} ${contact.lastName}` || 'Unknown',
          dueDate: ghlTask.dueDate,
          priority: 'medium' as const,
          status: ghlTask.completed ? 'completed' as const : 'todo' as const,
          category: 'General',
          createdAt: ghlTask.dateAdded || new Date().toISOString(),
          completedAt: ghlTask.completed ? new Date().toISOString() : undefined,
        }));
      });
      
      const allTaskArrays = await Promise.all(taskPromises);
      return allTaskArrays.flat();
    },
    enabled: contactIds.length > 0,
    refetchInterval: 30000,
    staleTime: 25000,
  });
  
  return { ...tasksQuery, isLoading: isLoadingContacts || tasksQuery.isLoading };
}
