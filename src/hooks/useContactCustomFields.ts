import { useQueries } from '@tanstack/react-query';
import { contactsApi } from '@/services/ghl/api';

/**
 * Fetches contact custom fields for multiple contacts.
 * Returns a map of contactId -> customFields array.
 */
export function useContactCustomFields(contactIds: string[]) {
  // Filter out null/undefined/empty contact IDs
  const validContactIds = contactIds.filter((id) => id && id.length > 0);

  const queries = useQueries({
    queries: validContactIds.map((contactId) => ({
      queryKey: ['ghl', 'contact', contactId, 'customFields'],
      queryFn: async () => {
        try {
          const contact = await contactsApi.get(contactId);
          return { contactId, customFields: contact.customFields || [] };
        } catch (error) {
          console.warn(`Failed to fetch contact ${contactId}:`, error);
          return { contactId, customFields: [] };
        }
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: !!contactId,
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
