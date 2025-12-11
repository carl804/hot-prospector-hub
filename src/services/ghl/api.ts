// GHL API Service - calls your Vercel API routes
import { API_BASE_URL, GHL_ENDPOINTS } from './config';
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
  GHLTag,
  GHLTagCreate,
  GHLCustomField,
  GHLCustomFieldCreate,
  GHLCustomValue,
  GHLCustomValueCreate,
  GHLPipeline,
  GHLPaginatedResponse,
} from '@/types/ghl';

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ CONTACTS ============
export const contactsApi = {
  list: (params?: { limit?: number; skip?: number; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.query) searchParams.set('query', params.query);
    const query = searchParams.toString();
    return apiRequest<GHLPaginatedResponse<GHLContact>>(
      `${GHL_ENDPOINTS.contacts.list}${query ? `?${query}` : ''}`
    );
  },

  get: (id: string) => 
    apiRequest<GHLContact>(GHL_ENDPOINTS.contacts.get(id)),

  create: (data: GHLContactCreate) =>
    apiRequest<GHLContact>(GHL_ENDPOINTS.contacts.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: GHLContactUpdate) =>
    apiRequest<GHLContact>(GHL_ENDPOINTS.contacts.update(data.id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(GHL_ENDPOINTS.contacts.delete(id), {
      method: 'DELETE',
    }),
};

// ============ OPPORTUNITIES ============
export const opportunitiesApi = {
  list: (params?: { pipelineId?: string; stageId?: string; status?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.pipelineId) searchParams.set('pipelineId', params.pipelineId);
    if (params?.stageId) searchParams.set('stageId', params.stageId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return apiRequest<GHLPaginatedResponse<GHLOpportunity>>(
      `${GHL_ENDPOINTS.opportunities.list}${query ? `?${query}` : ''}`
    );
  },

  get: (id: string) =>
    apiRequest<GHLOpportunity>(GHL_ENDPOINTS.opportunities.get(id)),

  create: (data: GHLOpportunityCreate) =>
    apiRequest<GHLOpportunity>(GHL_ENDPOINTS.opportunities.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (data: GHLOpportunityUpdate) =>
    apiRequest<GHLOpportunity>(GHL_ENDPOINTS.opportunities.update(data.id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(GHL_ENDPOINTS.opportunities.delete(id), {
      method: 'DELETE',
    }),

  updateStatus: (id: string, status: GHLOpportunity['status']) =>
    apiRequest<GHLOpportunity>(GHL_ENDPOINTS.opportunities.updateStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ============ PIPELINES ============
export const pipelinesApi = {
  list: () =>
    apiRequest<GHLPipeline[]>(GHL_ENDPOINTS.pipelines.list),

  get: (id: string) =>
    apiRequest<GHLPipeline>(GHL_ENDPOINTS.pipelines.get(id)),
};

// ============ TASKS ============
export const tasksApi = {
  listByContact: (contactId: string) =>
    apiRequest<GHLTask[]>(GHL_ENDPOINTS.contacts.tasks(contactId)),

  get: (contactId: string, taskId: string) =>
    apiRequest<GHLTask>(GHL_ENDPOINTS.tasks.get(contactId, taskId)),

  create: (contactId: string, data: Omit<GHLTaskCreate, 'contactId'>) =>
    apiRequest<GHLTask>(GHL_ENDPOINTS.tasks.create(contactId), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (contactId: string, taskId: string, data: Partial<GHLTaskUpdate>) =>
    apiRequest<GHLTask>(GHL_ENDPOINTS.tasks.update(contactId, taskId), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (contactId: string, taskId: string) =>
    apiRequest<void>(GHL_ENDPOINTS.tasks.delete(contactId, taskId), {
      method: 'DELETE',
    }),

  complete: (contactId: string, taskId: string, completed: boolean) =>
    apiRequest<GHLTask>(GHL_ENDPOINTS.tasks.complete(contactId, taskId), {
      method: 'PUT',
      body: JSON.stringify({ completed }),
    }),
};

// ============ TAGS ============
export const tagsApi = {
  list: () =>
    apiRequest<GHLTag[]>(GHL_ENDPOINTS.tags.list),

  get: (id: string) =>
    apiRequest<GHLTag>(GHL_ENDPOINTS.tags.get(id)),

  create: (data: GHLTagCreate) =>
    apiRequest<GHLTag>(GHL_ENDPOINTS.tags.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<GHLTagCreate>) =>
    apiRequest<GHLTag>(GHL_ENDPOINTS.tags.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(GHL_ENDPOINTS.tags.delete(id), {
      method: 'DELETE',
    }),
};

// ============ CUSTOM FIELDS ============
export const customFieldsApi = {
  list: (model?: 'contact' | 'opportunity') => {
    const query = model ? `?model=${model}` : '';
    return apiRequest<GHLCustomField[]>(`${GHL_ENDPOINTS.customFields.list}${query}`);
  },

  get: (id: string) =>
    apiRequest<GHLCustomField>(GHL_ENDPOINTS.customFields.get(id)),

  create: (data: GHLCustomFieldCreate) =>
    apiRequest<GHLCustomField>(GHL_ENDPOINTS.customFields.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<GHLCustomFieldCreate>) =>
    apiRequest<GHLCustomField>(GHL_ENDPOINTS.customFields.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(GHL_ENDPOINTS.customFields.delete(id), {
      method: 'DELETE',
    }),
};

// ============ CUSTOM VALUES ============
export const customValuesApi = {
  list: () =>
    apiRequest<GHLCustomValue[]>(GHL_ENDPOINTS.customValues.list),

  get: (id: string) =>
    apiRequest<GHLCustomValue>(GHL_ENDPOINTS.customValues.get(id)),

  create: (data: GHLCustomValueCreate) =>
    apiRequest<GHLCustomValue>(GHL_ENDPOINTS.customValues.create, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<GHLCustomValueCreate>) =>
    apiRequest<GHLCustomValue>(GHL_ENDPOINTS.customValues.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(GHL_ENDPOINTS.customValues.delete(id), {
      method: 'DELETE',
    }),
};
