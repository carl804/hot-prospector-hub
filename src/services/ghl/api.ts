// Consolidated GHL API Service - Single endpoint for all GHL operations
// This keeps us within Vercel's free tier API route limits

import { API_BASE_URL } from './config';
import type {
  GHLContact,
  GHLContactCreate,
  GHLContactUpdate,
  GHLOpportunity,
  GHLOpportunityCreate,
  GHLOpportunityUpdate,
  GHLTask,
  GHLTaskCreate,
  GHLTaskUpdate,
  GHLNote,
  GHLNoteCreate,
  GHLNoteUpdate,
  GHLTag,
  GHLTagCreate,
  GHLCustomField,
  GHLCustomFieldCreate,
  GHLCustomValue,
  GHLCustomValueCreate,
  GHLPipeline,
  GHLPaginatedResponse,
} from '@/types/ghl';

type GHLAction =
  | 'contacts.list' | 'contacts.get' | 'contacts.create' | 'contacts.update' | 'contacts.delete' | 'contacts.addTag'
  | 'opportunities.list' | 'opportunities.get' | 'opportunities.create' | 'opportunities.update' | 'opportunities.delete' | 'opportunities.updateStatus'
  | 'pipelines.list' | 'pipelines.get'
  | 'tasks.list' | 'tasks.get' | 'tasks.create' | 'tasks.update' | 'tasks.delete' | 'tasks.complete'
  | 'notes.list' | 'notes.get' | 'notes.create' | 'notes.update' | 'notes.delete'
  | 'tags.list' | 'tags.get' | 'tags.create' | 'tags.update' | 'tags.delete'
  | 'customFields.list' | 'customFields.get' | 'customFields.create' | 'customFields.update' | 'customFields.delete'
  | 'customValues.list' | 'customValues.get' | 'customValues.create' | 'customValues.update' | 'customValues.delete'
  | 'health';

interface GHLRequestPayload {
  action: GHLAction;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  id?: string;
  contactId?: string;
  taskId?: string;
  noteId?: string;
}

// Single API endpoint for all GHL operations
async function ghlRequest<T>(payload: GHLRequestPayload): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/ghl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// Health check
export const healthApi = {
  check: () => ghlRequest<{ status: string; connected: boolean; timestamp: string }>({ action: 'health' }),
};

// ============ CONTACTS ============
export const contactsApi = {
  list: (params?: { limit?: number; skip?: number; query?: string }) =>
    ghlRequest<GHLPaginatedResponse<GHLContact>>({ action: 'contacts.list', params }),

  get: (id: string) =>
    ghlRequest<GHLContact>({ action: 'contacts.get', id }),

  create: (data: GHLContactCreate) =>
    ghlRequest<GHLContact>({ action: 'contacts.create', data }),

  update: (data: GHLContactUpdate) =>
    ghlRequest<GHLContact>({ action: 'contacts.update', id: data.id, data }),

  delete: (id: string) =>
    ghlRequest<void>({ action: 'contacts.delete', id }),

  addTag: (contactId: string, tags: string[]) =>
    ghlRequest<GHLContact>({ action: 'contacts.addTag', contactId, data: { tags } }),
};

// ============ OPPORTUNITIES ============
export const opportunitiesApi = {
  list: (params?: { pipelineId?: string; stageId?: string; status?: string; limit?: number }) =>
    ghlRequest<GHLPaginatedResponse<GHLOpportunity>>({ action: 'opportunities.list', params }),

  get: (id: string) =>
    ghlRequest<GHLOpportunity>({ action: 'opportunities.get', id }),

  create: (data: GHLOpportunityCreate) =>
    ghlRequest<GHLOpportunity>({ action: 'opportunities.create', data }),

  update: (data: GHLOpportunityUpdate) =>
    ghlRequest<GHLOpportunity>({ action: 'opportunities.update', id: data.id, data }),

  delete: (id: string) =>
    ghlRequest<void>({ action: 'opportunities.delete', id }),

  updateStatus: (id: string, status: GHLOpportunity['status']) =>
    ghlRequest<GHLOpportunity>({ action: 'opportunities.updateStatus', id, data: { status } }),
};

// ============ PIPELINES ============
export const pipelinesApi = {
  list: () =>
    ghlRequest<GHLPipeline[]>({ action: 'pipelines.list' }),

  get: (id: string) =>
    ghlRequest<GHLPipeline>({ action: 'pipelines.get', id }),
};

// ============ TASKS ============
export const tasksApi = {
  listByContact: (contactId: string) =>
    ghlRequest<GHLTask[]>({ action: 'tasks.list', contactId }),

  get: (contactId: string, taskId: string) =>
    ghlRequest<GHLTask>({ action: 'tasks.get', contactId, taskId }),

  create: (contactId: string, data: Omit<GHLTaskCreate, 'contactId'>) =>
    ghlRequest<GHLTask>({ action: 'tasks.create', contactId, data }),

  update: (contactId: string, taskId: string, data: Partial<GHLTaskUpdate>) =>
    ghlRequest<GHLTask>({ action: 'tasks.update', contactId, taskId, data }),

  delete: (contactId: string, taskId: string) =>
    ghlRequest<void>({ action: 'tasks.delete', contactId, taskId }),

  complete: (contactId: string, taskId: string, completed: boolean) =>
    ghlRequest<GHLTask>({ action: 'tasks.complete', contactId, taskId, data: { completed } }),
};

// ============ NOTES ============
export const notesApi = {
  listByContact: (contactId: string) =>
    ghlRequest<GHLNote[]>({ action: 'notes.list', contactId }),

  get: (contactId: string, noteId: string) =>
    ghlRequest<GHLNote>({ action: 'notes.get', contactId, noteId }),

  create: (contactId: string, data: GHLNoteCreate) =>
    ghlRequest<GHLNote>({ action: 'notes.create', contactId, data }),

  update: (contactId: string, noteId: string, data: GHLNoteUpdate) =>
    ghlRequest<GHLNote>({ action: 'notes.update', contactId, noteId, data }),

  delete: (contactId: string, noteId: string) =>
    ghlRequest<void>({ action: 'notes.delete', contactId, noteId }),
};

// ============ TAGS ============
export const tagsApi = {
  list: () =>
    ghlRequest<GHLTag[]>({ action: 'tags.list' }),

  get: (id: string) =>
    ghlRequest<GHLTag>({ action: 'tags.get', id }),

  create: (data: GHLTagCreate) =>
    ghlRequest<GHLTag>({ action: 'tags.create', data }),

  update: (id: string, data: Partial<GHLTagCreate>) =>
    ghlRequest<GHLTag>({ action: 'tags.update', id, data }),

  delete: (id: string) =>
    ghlRequest<void>({ action: 'tags.delete', id }),
};

// ============ CUSTOM FIELDS ============
export const customFieldsApi = {
  list: (model?: 'contact' | 'opportunity') =>
    ghlRequest<GHLCustomField[]>({ action: 'customFields.list', params: model ? { model } : undefined }),

  get: (id: string) =>
    ghlRequest<GHLCustomField>({ action: 'customFields.get', id }),

  create: (data: GHLCustomFieldCreate) =>
    ghlRequest<GHLCustomField>({ action: 'customFields.create', data }),

  update: (id: string, data: Partial<GHLCustomFieldCreate>) =>
    ghlRequest<GHLCustomField>({ action: 'customFields.update', id, data }),

  delete: (id: string) =>
    ghlRequest<void>({ action: 'customFields.delete', id }),
};

// ============ CUSTOM VALUES ============
export const customValuesApi = {
  list: () =>
    ghlRequest<GHLCustomValue[]>({ action: 'customValues.list' }),

  get: (id: string) =>
    ghlRequest<GHLCustomValue>({ action: 'customValues.get', id }),

  create: (data: GHLCustomValueCreate) =>
    ghlRequest<GHLCustomValue>({ action: 'customValues.create', data }),

  update: (id: string, data: Partial<GHLCustomValueCreate>) =>
    ghlRequest<GHLCustomValue>({ action: 'customValues.update', id, data }),

  delete: (id: string) =>
    ghlRequest<void>({ action: 'customValues.delete', id }),
};
