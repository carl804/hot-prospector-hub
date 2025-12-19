import { useQueries, useQuery } from '@tanstack/react-query';
import { contactsApi, customFieldsApi } from '@/services/ghl/api';

/**
 * Fetches contact custom fields for multiple contacts.
 * Maps custom field IDs to fieldKeys using the custom field definitions.
 * Returns a map of contactId -> customFields array (with fieldKey added).
 */
export function useContactCustomFields(contactIds: string[]) {
  // Filter out null/undefined/empty contact IDs
  const validContactIds = contactIds.filter((id) => id && id.length > 0);

  // First, fetch custom field definitions to get ID -> fieldKey mapping
  const { data: customFieldDefs = [], isSuccess: defsLoaded } = useQuery({
    queryKey: ['ghl', 'customFields', 'contact'],
    queryFn: async () => {
      console.log('🔍 Fetching custom field definitions...');
      const result = await customFieldsApi.list('contact');
      console.log('🔍 Custom field definitions:', result);
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - field definitions rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Build ID -> fieldKey map from definitions
  const fieldIdToKeyMap = new Map<string, string>();
  if (customFieldDefs && Array.isArray(customFieldDefs)) {
    customFieldDefs.forEach((def: any) => {
      if (def.id && def.fieldKey) {
        fieldIdToKeyMap.set(def.id, def.fieldKey);
      }
    });
  }

  console.log('🗺️ Field ID to Key map:', Object.fromEntries(fieldIdToKeyMap));
  console.log('🗺️ Defs loaded:', defsLoaded, 'Map size:', fieldIdToKeyMap.size);

  // Then fetch contacts to get their custom field values
  const queries = useQueries({
    queries: validContactIds.map((contactId) => ({
      queryKey: ['ghl', 'contact', contactId, 'customFields'],
      queryFn: async () => {
        try {
          console.log(`📦 Fetching contact ${contactId}...`);
          const contact = await contactsApi.get(contactId);
          console.log(`📦 Contact ${contactId} FULL API response:`, JSON.stringify(contact, null, 2));

          // Map custom fields: add fieldKey from definitions
          const rawCustomFields = contact.customFields || [];
          console.log(`📦 Contact ${contactId} raw customFields:`, rawCustomFields);

          const customFieldsWithKeys = rawCustomFields.map((field: any) => ({
            ...field,
            fieldKey: fieldIdToKeyMap.get(field.id) || field.fieldKey || field.id,
          }));

          console.log(`📦 Contact ${contactId} customFields (mapped):`, customFieldsWithKeys);
          return { contactId, customFields: customFieldsWithKeys };
        } catch (error) {
          console.error(`❌ Failed to fetch contact ${contactId}:`, error);
          return { contactId, customFields: [] };
        }
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: !!contactId && defsLoaded, // Wait for field definitions to load
    })),
  });

  // Build a map of contactId -> customFields
  const customFieldsMap = new Map<string, any[]>();
  queries.forEach((query) => {
    if (query.data) {
      customFieldsMap.set(query.data.contactId, query.data.customFields);
    }
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  return {
    customFieldsMap,
    isLoading,
    isError,
  };
}
