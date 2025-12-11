import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi, customFieldsApi, customValuesApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLTagCreate, GHLCustomFieldCreate, GHLCustomValueCreate } from '@/types/ghl';
import { toast } from 'sonner';

// ============ TAGS ============
export function useGHLTags() {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.tags,
    queryFn: () => tagsApi.list(),
  });
}

export function useCreateGHLTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLTagCreate) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tags });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });
}

export function useUpdateGHLTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GHLTagCreate> }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tags });
      toast.success('Tag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tag: ${error.message}`);
    },
  });
}

export function useDeleteGHLTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.tags });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete tag: ${error.message}`);
    },
  });
}

// ============ CUSTOM FIELDS ============
export function useGHLCustomFields(model?: 'contact' | 'opportunity') {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.customFields, model],
    queryFn: () => customFieldsApi.list(model),
  });
}

export function useCreateGHLCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLCustomFieldCreate) => customFieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customFields });
      toast.success('Custom field created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create custom field: ${error.message}`);
    },
  });
}

export function useUpdateGHLCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GHLCustomFieldCreate> }) =>
      customFieldsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customFields });
      toast.success('Custom field updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update custom field: ${error.message}`);
    },
  });
}

export function useDeleteGHLCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customFields });
      toast.success('Custom field deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete custom field: ${error.message}`);
    },
  });
}

// ============ CUSTOM VALUES ============
export function useGHLCustomValues() {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.customValues,
    queryFn: () => customValuesApi.list(),
  });
}

export function useCreateGHLCustomValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLCustomValueCreate) => customValuesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customValues });
      toast.success('Custom value created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create custom value: ${error.message}`);
    },
  });
}

export function useUpdateGHLCustomValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GHLCustomValueCreate> }) =>
      customValuesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customValues });
      toast.success('Custom value updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update custom value: ${error.message}`);
    },
  });
}

export function useDeleteGHLCustomValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customValuesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.customValues });
      toast.success('Custom value deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete custom value: ${error.message}`);
    },
  });
}
