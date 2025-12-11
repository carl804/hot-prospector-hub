import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi, pipelinesApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';
import type { GHLOpportunityCreate, GHLOpportunityUpdate, GHLOpportunity } from '@/types/ghl';
import { toast } from 'sonner';

export function useGHLOpportunities(params?: { 
  pipelineId?: string; 
  stageId?: string; 
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.opportunities, params],
    queryFn: () => opportunitiesApi.list(params),
  });
}

export function useGHLOpportunity(id: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.opportunity(id),
    queryFn: () => opportunitiesApi.get(id),
    enabled: !!id,
  });
}

export function useGHLPipelines() {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.pipelines,
    queryFn: () => pipelinesApi.list(),
  });
}

export function useGHLPipeline(id: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.pipeline(id),
    queryFn: () => pipelinesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateGHLOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLOpportunityCreate) => opportunitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
      toast.success('Opportunity created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create opportunity: ${error.message}`);
    },
  });
}

export function useUpdateGHLOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GHLOpportunityUpdate) => opportunitiesApi.update(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunity(data.id) });
      toast.success('Opportunity updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update opportunity: ${error.message}`);
    },
  });
}

export function useDeleteGHLOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => opportunitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
      toast.success('Opportunity deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete opportunity: ${error.message}`);
    },
  });
}

export function useUpdateGHLOpportunityStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: GHLOpportunity['status'] }) =>
      opportunitiesApi.updateStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunities });
      queryClient.invalidateQueries({ queryKey: GHL_QUERY_KEYS.opportunity(data.id) });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
