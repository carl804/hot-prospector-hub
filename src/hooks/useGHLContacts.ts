import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLContactCreate, GHLContactUpdate } from '@/types/ghl';
import { toast } from 'sonner';

export function useGHLContacts(params?: { limit?: number; skip?: number; query?: string }) {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.contacts, params],
    queryFn: () => contactsApi.list(params),
  });
}

export function useGHLContact(id: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.contact(id),
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateGHLContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLContactCreate) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contacts });
      toast.success('Contact created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });
}

export function useUpdateGHLContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLContactUpdate) => contactsApi.update(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contacts });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contact(data.id) });
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

export function useDeleteGHLContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.contacts });
      toast.success('Contact deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });
}
