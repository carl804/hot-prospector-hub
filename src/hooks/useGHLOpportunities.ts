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
    queryFn: async () => {
      console.log('🔄 FETCHING OPPORTUNITIES WITH PAGINATION...');
      let allOpportunities: any[] = [];
      let pageCount = 0;
      let startAfter: string | number | null = null;
      let startAfterId: string | null = null;
      const seenIds = new Set<string>();
      
      while (pageCount < 10) {
        pageCount++;
        
        const queryParams: any = { ...params, limit: 100 };
        if (startAfter && startAfterId) {
          queryParams.startAfter = startAfter;
          queryParams.startAfterId = startAfterId;
        }
        
        console.log(`📄 Fetching page ${pageCount}${startAfter ? ` (cursor: ${startAfterId})` : ''}...`);
        
        const result: any = await opportunitiesApi.list(queryParams);
        
        if (!result.opportunities || result.opportunities.length === 0) {
          console.log('🏁 No more opportunities');
          break;
        }
        
        const firstId = result.opportunities[0]?.id;
        if (firstId && seenIds.has(firstId)) {
          console.warn('⚠️ Infinite loop detected, stopping');
          break;
        }
        
        result.opportunities.forEach((opp: any) => seenIds.add(opp.id));
        allOpportunities = [...allOpportunities, ...result.opportunities];
        
        console.log(`✅ Page ${pageCount}: Got ${result.opportunities.length} (Total: ${allOpportunities.length})`);
        
        if (result.opportunities.length < 100) {
          console.log('🏁 Got less than 100, reached end');
          break;
        }
        
        if (result.meta?.startAfter && result.meta?.startAfterId) {
          startAfter = result.meta.startAfter;
          startAfterId = result.meta.startAfterId;
          console.log(`🔄 Next cursor: ${startAfterId}`);
        } else {
          console.log('🏁 No cursor in response, stopping');
          break;
        }
      }
      
      console.log(`🎉 TOTAL FETCHED: ${allOpportunities.length} opportunities`);
      return { opportunities: allOpportunities, meta: { total: allOpportunities.length } };
    },
    staleTime: 10 * 60 * 1000,  // ⭐ 10 minutes - data stays fresh
    gcTime: 30 * 60 * 1000,     // ⭐ 30 minutes - keep in cache
  });
}

export function useGHLOpportunity(id: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.opportunity(id),
    queryFn: () => opportunitiesApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,   // ⭐ 5 minutes
    gcTime: 15 * 60 * 1000,     // ⭐ 15 minutes
  });
}

export function useGHLPipelines() {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.pipelines,
    queryFn: () => pipelinesApi.list(),
    staleTime: 30 * 60 * 1000,  // ⭐ 30 minutes - pipelines rarely change
    gcTime: 60 * 60 * 1000,     // ⭐ 1 hour
  });
}

export function useGHLPipeline(id: string) {
  return useQuery({
    queryKey: GHL_QUERY_KEYS.pipeline(id),
    queryFn: () => pipelinesApi.get(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,  // ⭐ 30 minutes
    gcTime: 60 * 60 * 1000,     // ⭐ 1 hour
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