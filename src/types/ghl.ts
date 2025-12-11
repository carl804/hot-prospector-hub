// GoHighLevel API Types

// Contacts
export interface GHLContact {
  id: string;
  locationId: string;
  contactName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  tags: string[];
  customFields: GHLCustomFieldValue[];
  dateAdded: string;
  dateUpdated: string;
  assignedTo?: string;
  source?: string;
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address1?: string;
  website?: string;
  timezone?: string;
}

export interface GHLContactCreate {
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  tags?: string[];
  customFields?: { id: string; value: string }[];
  assignedTo?: string;
  source?: string;
}

export interface GHLContactUpdate extends Partial<GHLContactCreate> {
  id: string;
}

// Opportunities
export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  source?: string;
  contactId: string;
  contact?: GHLContact;
  assignedTo?: string;
  customFields?: GHLCustomFieldValue[];
  dateAdded: string;
  dateUpdated: string;
  lastStatusChangeAt?: string;
}

export interface GHLOpportunityCreate {
  pipelineId: string;
  pipelineStageId: string;
  contactId: string;
  name: string;
  status?: 'open' | 'won' | 'lost' | 'abandoned';
  monetaryValue?: number;
  assignedTo?: string;
  customFields?: { id: string; value: string }[];
}

export interface GHLOpportunityUpdate extends Partial<GHLOpportunityCreate> {
  id: string;
}

// Pipeline
export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
  locationId: string;
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  position: number;
}

// Tasks
export interface GHLTask {
  id: string;
  contactId: string;
  title: string;
  body?: string;
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLTaskCreate {
  contactId: string;
  title: string;
  body?: string;
  dueDate: string;
  completed?: boolean;
  assignedTo?: string;
}

export interface GHLTaskUpdate extends Partial<GHLTaskCreate> {
  id: string;
  contactId: string;
}

// Location Tags
export interface GHLTag {
  id: string;
  name: string;
  locationId: string;
}

export interface GHLTagCreate {
  name: string;
  locationId: string;
}

// Custom Fields
export interface GHLCustomField {
  id: string;
  name: string;
  fieldKey: string;
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMERICAL' | 'PHONE' | 'MONETORY' | 'CHECKBOX' | 'SINGLE_OPTIONS' | 'MULTIPLE_OPTIONS' | 'DATE' | 'FILE_UPLOAD' | 'SIGNATURE';
  position: number;
  placeholder?: string;
  options?: string[];
  isRequired?: boolean;
  locationId: string;
  model: 'contact' | 'opportunity';
}

export interface GHLCustomFieldCreate {
  name: string;
  dataType: GHLCustomField['dataType'];
  placeholder?: string;
  options?: string[];
  isRequired?: boolean;
  locationId: string;
  model: 'contact' | 'opportunity';
}

export interface GHLCustomFieldValue {
  id: string;
  fieldKey: string;
  value: string | string[] | number | boolean;
}

// Custom Values
export interface GHLCustomValue {
  id: string;
  name: string;
  value: string;
  locationId: string;
}

export interface GHLCustomValueCreate {
  name: string;
  value: string;
  locationId: string;
}

// Webhook Events
export type GHLWebhookEvent = 
  | 'ContactCreate'
  | 'ContactUpdate'
  | 'ContactDelete'
  | 'ContactDndUpdate'
  | 'ContactTagUpdate'
  | 'OpportunityCreate'
  | 'OpportunityUpdate'
  | 'OpportunityDelete'
  | 'OpportunityStageUpdate'
  | 'OpportunityStatusUpdate'
  | 'TaskCreate'
  | 'TaskComplete'
  | 'TaskUpdate'
  | 'TaskDelete';

export interface GHLWebhookPayload<T = unknown> {
  type: GHLWebhookEvent;
  locationId: string;
  timestamp: string;
  data: T;
}

// API Response types
export interface GHLPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export interface GHLApiError {
  statusCode: number;
  message: string;
  error?: string;
}
