import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi, contactsApi } from '@/services/ghl/api';
import { GHL_QUERY_KEYS } from '@/services/ghl/config';

/**
 * Fetches opportunities and enriches them with full contact data including customFields.
 * The GHL opportunities list endpoint doesn't include contact customFields,
 * so we need to fetch each contact separately to get their custom field values.
 */
export function useEnrichedOpportunities(params?: {
  pipelineId?: string;
  stageId?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...GHL_QUERY_KEYS.opportunities, 'enriched', params],
    queryFn: async () => {
      console.log('🔄 FETCHING ENRICHED OPPORTUNITIES...');

      // Step 1: Fetch all opportunities with pagination
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

        console.log(`📄 Fetching opportunities page ${pageCount}...`);

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
          break;
        }

        if (result.meta?.startAfter && result.meta?.startAfterId) {
          startAfter = result.meta.startAfter;
          startAfterId = result.meta.startAfterId;
        } else {
          break;
        }
      }

      console.log(`📊 Total opportunities: ${allOpportunities.length}`);

      // Step 2: Get unique contact IDs that need enrichment
      const contactIds = new Set<string>();
      allOpportunities.forEach((opp) => {
        const contactId = opp.contact?.id || opp.contactId;
        if (contactId) {
          contactIds.add(contactId);
        }
      });

      console.log(`👥 Fetching ${contactIds.size} contacts for custom fields...`);

      // Step 3: Fetch contacts in parallel (batch of 10 at a time to avoid rate limits)
      const contactIdArray = Array.from(contactIds);
      const contactMap = new Map<string, any>();
      const batchSize = 10;

      for (let i = 0; i < contactIdArray.length; i += batchSize) {
        const batch = contactIdArray.slice(i, i + batchSize);
        const batchPromises = batch.map(async (contactId) => {
          try {
            const contact = await contactsApi.get(contactId);
            return { contactId, contact };
          } catch (error) {
            console.warn(`Failed to fetch contact ${contactId}:`, error);
            return { contactId, contact: null };
          }
        });

        const results = await Promise.all(batchPromises);
        results.forEach(({ contactId, contact }) => {
          if (contact) {
            contactMap.set(contactId, contact);
          }
        });

        console.log(`📋 Fetched contacts ${i + 1}-${Math.min(i + batchSize, contactIdArray.length)} of ${contactIdArray.length}`);
      }

      // Step 4: Enrich opportunities with full contact data
      const enrichedOpportunities = allOpportunities.map((opp) => {
        const contactId = opp.contact?.id || opp.contactId;
        const enrichedContact = contactId ? contactMap.get(contactId) : null;

        return {
          ...opp,
          contact: enrichedContact || opp.contact,
        };
      });

      // Debug: Log first enriched contact's custom fields
      const firstWithFields = enrichedOpportunities.find((o) => o.contact?.customFields?.length > 0);
      if (firstWithFields) {
        console.log('🔧 ENRICHED CUSTOM FIELDS (sample):', {
          name: firstWithFields.name,
          customFields: firstWithFields.contact.customFields.slice(0, 5).map((f: any) => ({
            fieldKey: f.fieldKey,
            value: f.value,
          })),
        });
      }

      console.log(`🎉 ENRICHED ${enrichedOpportunities.length} opportunities with contact data`);

      return { opportunities: enrichedOpportunities, meta: { total: enrichedOpportunities.length } };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
