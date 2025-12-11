// GHL API Configuration for Vercel deployment

// Base URL for your Vercel API routes
// In development, this points to localhost
// In production, this will be your Vercel deployment URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// GHL API endpoints (these will be proxied through Vercel)
export const GHL_ENDPOINTS = {
  // Contacts
  contacts: {
    list: '/ghl/contacts',
    get: (id: string) => `/ghl/contacts/${id}`,
    create: '/ghl/contacts',
    update: (id: string) => `/ghl/contacts/${id}`,
    delete: (id: string) => `/ghl/contacts/${id}`,
    tasks: (contactId: string) => `/ghl/contacts/${contactId}/tasks`,
  },
  
  // Opportunities
  opportunities: {
    list: '/ghl/opportunities',
    get: (id: string) => `/ghl/opportunities/${id}`,
    create: '/ghl/opportunities',
    update: (id: string) => `/ghl/opportunities/${id}`,
    delete: (id: string) => `/ghl/opportunities/${id}`,
    updateStatus: (id: string) => `/ghl/opportunities/${id}/status`,
  },
  
  // Pipelines
  pipelines: {
    list: '/ghl/pipelines',
    get: (id: string) => `/ghl/pipelines/${id}`,
  },
  
  // Tasks
  tasks: {
    list: '/ghl/tasks',
    get: (contactId: string, taskId: string) => `/ghl/contacts/${contactId}/tasks/${taskId}`,
    create: (contactId: string) => `/ghl/contacts/${contactId}/tasks`,
    update: (contactId: string, taskId: string) => `/ghl/contacts/${contactId}/tasks/${taskId}`,
    delete: (contactId: string, taskId: string) => `/ghl/contacts/${contactId}/tasks/${taskId}`,
    complete: (contactId: string, taskId: string) => `/ghl/contacts/${contactId}/tasks/${taskId}/complete`,
  },
  
  // Location Tags
  tags: {
    list: '/ghl/locations/tags',
    get: (id: string) => `/ghl/locations/tags/${id}`,
    create: '/ghl/locations/tags',
    update: (id: string) => `/ghl/locations/tags/${id}`,
    delete: (id: string) => `/ghl/locations/tags/${id}`,
  },
  
  // Custom Fields
  customFields: {
    list: '/ghl/locations/custom-fields',
    get: (id: string) => `/ghl/locations/custom-fields/${id}`,
    create: '/ghl/locations/custom-fields',
    update: (id: string) => `/ghl/locations/custom-fields/${id}`,
    delete: (id: string) => `/ghl/locations/custom-fields/${id}`,
  },
  
  // Custom Values
  customValues: {
    list: '/ghl/locations/custom-values',
    get: (id: string) => `/ghl/locations/custom-values/${id}`,
    create: '/ghl/locations/custom-values',
    update: (id: string) => `/ghl/locations/custom-values/${id}`,
    delete: (id: string) => `/ghl/locations/custom-values/${id}`,
  },
  
  // Webhooks
  webhooks: {
    handler: '/ghl/webhooks',
  },
} as const;

// Query keys for React Query
export const GHL_QUERY_KEYS = {
  contacts: ['ghl', 'contacts'] as const,
  contact: (id: string) => ['ghl', 'contacts', id] as const,
  contactTasks: (contactId: string) => ['ghl', 'contacts', contactId, 'tasks'] as const,
  opportunities: ['ghl', 'opportunities'] as const,
  opportunity: (id: string) => ['ghl', 'opportunities', id] as const,
  pipelines: ['ghl', 'pipelines'] as const,
  pipeline: (id: string) => ['ghl', 'pipelines', id] as const,
  tasks: ['ghl', 'tasks'] as const,
  task: (contactId: string, taskId: string) => ['ghl', 'tasks', contactId, taskId] as const,
  tags: ['ghl', 'tags'] as const,
  customFields: ['ghl', 'custom-fields'] as const,
  customValues: ['ghl', 'custom-values'] as const,
} as const;
