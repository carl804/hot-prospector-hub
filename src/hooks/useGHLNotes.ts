import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, contactsApi } from '@/services/ghl/api';
import type { GHLNote, GHLNoteCreate, GHLNoteUpdate } from '@/types/ghl';
import { toast } from 'sonner';

// Query key factory for notes
export const NOTES_QUERY_KEYS = {
  all: ['ghl', 'notes'] as const,
  byContact: (contactId: string) => ['ghl', 'notes', contactId] as const,
  single: (contactId: string, noteId: string) => ['ghl', 'notes', contactId, noteId] as const,
};

// Hook to fetch notes for a contact
export function useGHLNotes(contactId: string | undefined) {
  return useQuery({
    queryKey: NOTES_QUERY_KEYS.byContact(contactId || ''),
    queryFn: () => notesApi.listByContact(contactId!),
    enabled: !!contactId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}

// Hook to fetch a single note
export function useGHLNote(contactId: string, noteId: string) {
  return useQuery({
    queryKey: NOTES_QUERY_KEYS.single(contactId, noteId),
    queryFn: () => notesApi.get(contactId, noteId),
    enabled: !!contactId && !!noteId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to create a note
export function useCreateGHLNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: GHLNoteCreate }) =>
      notesApi.create(contactId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEYS.byContact(variables.contactId) });
      toast.success('Note added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });
}

// Hook to update a note
export function useUpdateGHLNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, noteId, data }: { contactId: string; noteId: string; data: GHLNoteUpdate }) =>
      notesApi.update(contactId, noteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEYS.byContact(variables.contactId) });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEYS.single(variables.contactId, variables.noteId) });
      toast.success('Note updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update note: ${error.message}`);
    },
  });
}

// Hook to delete a note
export function useDeleteGHLNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, noteId }: { contactId: string; noteId: string }) =>
      notesApi.delete(contactId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEYS.byContact(variables.contactId) });
      toast.success('Note deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });
}

// Notification tags - triggers GHL workflow for Slack notification
// Using actual GHL tag names from the location
const NOTIFICATION_TAGS = {
  draftBuild: 'build-draft-notified',
  setupComplete: 'build-complete-notified',
} as const;

// Legacy CSM-specific tags (kept for manual note notifications)
const CSM_NOTIFY_TAGS = {
  chloe: 'notify-csm-chloe',
  jonathan: 'notify-csm-jonathan',
} as const;

export type CSMRecipient = keyof typeof CSM_NOTIFY_TAGS;

// Hook to notify CSM via GHL workflow (adds tag to trigger workflow)
export function useNotifyCSM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      recipients,
      noteIds,
      clientName,
      notificationType,
    }: {
      contactId: string;
      recipients: CSMRecipient[];
      noteIds: string[];
      clientName: string;
      notificationType?: 'draft' | 'complete' | null;
    }) => {
      // Build tags array based on notification type
      const tags: string[] = [];

      // Add milestone tag (triggers GHL workflow)
      if (notificationType === 'complete') {
        tags.push(NOTIFICATION_TAGS.setupComplete);
      } else if (notificationType === 'draft') {
        tags.push(NOTIFICATION_TAGS.draftBuild);
      } else {
        // For manual notifications without type, add CSM-specific tags
        tags.push(...recipients.map(r => CSM_NOTIFY_TAGS[r]));
      }

      // Add timestamp tag for tracking
      const notifyTag = `csm-notify-${Date.now()}`;
      tags.push(notifyTag);

      // Add tags to contact
      console.log('🏷️  Adding tags to contact:', { contactId, tags, notificationType });
      await contactsApi.addTag(contactId, tags);

      // If this is a setup complete notification, update the custom field
      if (notificationType === 'complete') {
        console.log('✅ Updating custom field: setup_complete_notified = Yes');
        await contactsApi.updateCustomField(contactId, 'contact.setup_complete_notified', 'Yes');
      } else if (notificationType === 'draft') {
        console.log('✅ Updating custom field: draft_build_notified = Yes');
        await contactsApi.updateCustomField(contactId, 'contact.draft_build_notified', 'Yes');
      }

      console.log('🎉 Notification complete!', { tags, notificationType });
      return { success: true, recipients, noteIds, notificationType, tags };
    },
    onSuccess: (data, variables) => {
      if (data.notificationType === 'complete') {
        toast.success(`🎉 Setup Complete notification sent! GHL workflow triggered.`);
      } else if (data.notificationType === 'draft') {
        toast.success(`📝 Draft Build notification sent! GHL workflow triggered.`);
      } else {
        const recipientNames = variables.recipients.map(r =>
          r === 'chloe' ? 'Chloe' : 'Jonathan'
        ).join(' and ');
        toast.success(`Notification sent to ${recipientNames}`);
      }

      // Invalidate custom fields query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['ghl', 'contacts', 'customFields'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to notify CSM: ${error.message}`);
    },
  });
}
