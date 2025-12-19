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

// CSM notification tag - triggers GHL workflow for Slack notification
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
    }: {
      contactId: string;
      recipients: CSMRecipient[];
      noteIds: string[];
      clientName: string;
    }) => {
      // Add notification tags to trigger GHL workflow
      const tags = recipients.map(r => CSM_NOTIFY_TAGS[r]);

      // Also add a tag with the note info for the workflow to pick up
      // The workflow will read the latest notes and send to Slack
      const notifyTag = `csm-notify-${Date.now()}`;

      await contactsApi.addTag(contactId, [...tags, notifyTag]);

      return { success: true, recipients, noteIds };
    },
    onSuccess: (_, variables) => {
      const recipientNames = variables.recipients.map(r =>
        r === 'chloe' ? 'Chloe' : 'Jonathan'
      ).join(' and ');
      toast.success(`Notification sent to ${recipientNames}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to notify CSM: ${error.message}`);
    },
  });
}
