import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    queryKey: GHL_QUERY_KEYS.task(contactId, taskId),
    queryFn: () => tasksApi.get(contactId, taskId),
    enabled: !!contactId && !!taskId,
  });
}

export function useCreateGHLTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: Omit<GHLTaskCreate, 'contactId'> }) =>
      tasksApi.create(contactId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contactTasks(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

export function useUpdateGHLTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      contactId, 
      taskId, 
      data 
    }: { 
      contactId: string; 
      taskId: string; 
      data: Partial<GHLTaskUpdate>;
    }) => tasksApi.update(contactId, taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contactTasks(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.task(variables.contactId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

export function useDeleteGHLTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, taskId }: { contactId: string; taskId: string }) =>
      tasksApi.delete(contactId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contactTasks(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success('Task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}

export function useCompleteGHLTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      contactId, 
      taskId, 
      completed 
    }: { 
      contactId: string; 
      taskId: string; 
      completed: boolean;
    }) => tasksApi.complete(contactId, taskId, completed),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contactTasks(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.task(variables.contactId, variables.taskId) });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tasks });
      toast.success(variables.completed ? 'Task completed' : 'Task reopened');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}
