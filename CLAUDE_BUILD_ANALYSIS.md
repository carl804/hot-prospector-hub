# Hot Prospector Hub - Build Analysis

**Generated**: 2025-12-17
**Analyzed By**: Claude Code
**Project Type**: React + TypeScript + Vercel Serverless + GHL Integration

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [GHL API Integration Deep Dive](#ghl-api-integration-deep-dive)
4. [File Structure](#file-structure)
5. [Technology Stack](#technology-stack)
6. [Implementation Summary](#implementation-summary)
7. [Implementation Priorities](#implementation-priorities)
8. [Implementation Stories](#implementation-stories)

---

## Project Overview

**Hot Prospector Hub** is a modern CRM task management dashboard that integrates with GoHighLevel (GHL) to provide a unified interface for managing opportunities, contacts, and tasks across multiple clients.

### Core Functionality
- Real-time GHL synchronization for opportunities, contacts, and tasks
- Kanban and list view task management
- Priority-based task organization with persistent storage
- Custom field sync to GHL for task metadata
- Modern glassmorphic UI with dark mode support
- Collapsible columns for improved UX

---

## Architecture Analysis

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │    Hooks     │     │
│  │ - Index      │  │ - Kanban     │  │ - useGHL*    │     │
│  │ - Tasks      │  │ - TaskCard   │  │ - useAuth    │     │
│  │ - Staff      │  │ - Dashboard  │  │ - useCache   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           │                                  │
│                           │ API Calls                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Vercel Serverless                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         /api/ghl/index.ts (Unified Endpoint)         │   │
│  │  - Contacts CRUD        - Opportunities CRUD         │   │
│  │  - Tasks CRUD           - Pipelines Read             │   │
│  │  - Custom Fields        - Tags Management            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ Bearer Token Auth                │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                  GoHighLevel API                              │
│         https://services.leadconnectorhq.com                  │
│  - Contact Management      - Opportunity Pipelines           │
│  - Task System            - Custom Fields                    │
│  - Webhooks               - Location Management              │
└───────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Single Unified API Route** (`/api/ghl/index.ts`)
   - Consolidates all GHL operations into one endpoint
   - Reduces Vercel free tier API route count
   - Action-based routing system

2. **React Query for State Management**
   - Centralized caching with `staleTime` and `gcTime`
   - Automatic background refetching
   - Optimistic updates for better UX

3. **Task Metadata Caching System**
   - localStorage for instant priority updates
   - Debounced sync to GHL custom fields
   - Per-contact JSON storage in GHL

4. **Pagination Strategy**
   - Cursor-based pagination for opportunities (up to 10 pages, 100/page)
   - Infinite loop detection
   - Aggregated results for complete data set

---

## GHL API Integration Deep Dive

### API Architecture

#### **Backend: Unified API Handler** (`/api/ghl/index.ts`)

**Purpose**: Single serverless function to handle all GHL API operations

**Supported Actions**:
```typescript
type GHLAction =
  // Contacts
  | 'contacts.list' | 'contacts.get' | 'contacts.create'
  | 'contacts.update' | 'contacts.delete'

  // Opportunities
  | 'opportunities.list' | 'opportunities.get' | 'opportunities.create'
  | 'opportunities.update' | 'opportunities.delete' | 'opportunities.updateStatus'

  // Pipelines
  | 'pipelines.list' | 'pipelines.get'

  // Tasks
  | 'tasks.list' | 'tasks.get' | 'tasks.create'
  | 'tasks.update' | 'tasks.delete' | 'tasks.complete'

  // Tags
  | 'tags.list' | 'tags.get' | 'tags.create'
  | 'tags.update' | 'tags.delete'

  // Custom Fields
  | 'customFields.list' | 'customFields.get' | 'customFields.create'
  | 'customFields.update' | 'customFields.delete'

  // Custom Values
  | 'customValues.list' | 'customValues.get' | 'customValues.create'
  | 'customValues.update' | 'customValues.delete'

  | 'health'
```

**Request Format**:
```typescript
{
  action: GHLAction,
  params?: Record<string, any>,  // Query params
  data?: Record<string, unknown>, // Request body
  id?: string,                    // Resource ID
  contactId?: string,             // For contact-scoped operations
  taskId?: string                 // For task operations
}
```

**Key Features**:
- CORS enabled for all origins
- Bearer token authentication via `process.env.GHL_API_KEY`
- Automatic location ID injection via `process.env.GHL_LOCATION_ID`
- Version header: `2021-07-28`

**Critical Fix** (Line 258-262):
```typescript
// GHL returns {tasks: [...], traceId: "..."} but frontend expects array
if (action === 'tasks.list' && responseData.tasks) {
  return res.status(200).json(responseData.tasks);
}
```

---

#### **Frontend: GHL Service Layer** (`/src/services/ghl/api.ts`)

**Purpose**: Type-safe API client for all GHL operations

**Architecture**:
```typescript
// Generic request handler
async function ghlRequest<T>(payload: GHLRequestPayload): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/ghl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}
```

**Exported APIs**:
- `contactsApi` - Contact CRUD operations
- `opportunitiesApi` - Opportunity management + status updates
- `pipelinesApi` - Pipeline/stage retrieval
- `tasksApi` - Task management (contact-scoped)
- `tagsApi` - Tag management
- `customFieldsApi` - Custom field schema management
- `customValuesApi` - Custom value management
- `healthApi` - Health check

---

### GHL API Call Mapping

#### **1. Opportunities API**

**Hook**: `useGHLOpportunities` ([src/hooks/useGHLOpportunities.ts:7-73](src/hooks/useGHLOpportunities.ts#L7-L73))

**Pagination Strategy**:
```typescript
// Fetches up to 10 pages with cursor-based pagination
let startAfter: string | number | null = null;
let startAfterId: string | null = null;

while (pageCount < 10) {
  const result = await opportunitiesApi.list({
    ...params,
    limit: 100,
    startAfter,
    startAfterId
  });

  // Aggregate results
  allOpportunities = [...allOpportunities, ...result.opportunities];

  // Update cursor
  startAfter = result.meta?.startAfter;
  startAfterId = result.meta?.startAfterId;
}
```

**Caching Strategy**:
- `staleTime: 10 minutes` - Data considered fresh
- `gcTime: 30 minutes` - Cached data retained

**Mutations**:
- `useCreateGHLOpportunity` - Creates new opportunity
- `useUpdateGHLOpportunity` - Updates opportunity fields
- `useDeleteGHLOpportunity` - Soft/hard delete
- `useUpdateGHLOpportunityStatus` - Status-only update

---

#### **2. Tasks API**

**Hook**: `usePipelineTasks` ([src/hooks/useGHLTasks.ts:8-63](src/hooks/useGHLTasks.ts#L8-L63))

**Multi-Contact Fetch Strategy**:
```typescript
// 1. Get all opportunities in pipeline
const pipelineOpps = opportunities.filter(opp => opp.pipelineId === pipelineId);

// 2. Fetch tasks for each contact in parallel
const taskPromises = pipelineOpps.map(async (opp) => {
  const contactId = opp.contactId || opp.contact?.id;
  const ghlTasks = await tasksApi.listByContact(contactId);

  // Transform to internal format
  return ghlTasks.map(ghlTask => ({
    id: ghlTask.id,
    title: ghlTask.title,
    clientId: opp.id,
    contactId: contactId,
    status: ghlTask.completed ? 'completed' : 'todo',
    // ... more fields
  }));
});

const allTasks = (await Promise.all(taskPromises)).flat();
```

**Caching Strategy**:
- `staleTime: 5 minutes`
- `gcTime: 15 minutes`

**Mutations**:
- `useCreateGHLTask` - Creates task for contact
- `useUpdateGHLTask` - Updates task fields
- `useDeleteGHLTask` - Deletes task
- `useCompleteGHLTask` - Toggles completion status

---

#### **3. Task Metadata Cache System**

**Hook**: `useTaskMetadataCache` ([src/hooks/useTaskMetadataCache.ts:19-160](src/hooks/useTaskMetadataCache.ts#L19-L160))

**Problem Solved**: GHL tasks don't natively support priority field

**Solution**: Store task metadata (priority) in GHL custom field as JSON

**Custom Field**:
- Field ID: `IupahPvXega24Wf5SFtr`
- Field Key: `contact.task_temperature_json`
- Data Type: `LARGE_TEXT`
- Storage Format: `{"taskId": {"priority": "high", "lastUpdated": "ISO8601"}, ...}`

**Three-Layer Architecture**:

1. **Local State** (React state)
   - Immediate UI updates
   - No latency

2. **localStorage Cache**
   - Persists across sessions
   - Instant priority retrieval
   - Updated on every change

3. **GHL Custom Field Sync**
   - Debounced by 2 seconds
   - Per-contact JSON blob
   - Synced on priority change or task completion

**Sync Flow**:
```typescript
// 1. User changes priority
updatePriority(taskId, 'high');  // → localStorage

// 2. Trigger debounced sync
triggerSync(contactId, [taskId1, taskId2, ...]);

// 3. After 2 seconds, sync to GHL
await contactsApi.update({
  id: contactId,
  customFields: [{
    id: CUSTOM_FIELD_ID,
    value: JSON.stringify(taskMetadataCache)
  }]
});
```

**Load Flow**:
```typescript
// On page load for each contact
const contact = await contactsApi.get(contactId);
const customField = contact.customFields.find(f => f.id === CUSTOM_FIELD_ID);
const cached = JSON.parse(customField.value);

// Merge with localStorage (local wins if newer)
```

---

#### **4. Contacts API**

**Hook**: `useGHLContacts` ([src/hooks/useGHLContacts.ts:7-66](src/hooks/useGHLContacts.ts#L7-L66))

**Usage**:
- Contact lookup for tasks
- Custom field sync (task metadata)
- Contact creation in intake flow

**Mutations**:
- `useCreateGHLContact`
- `useUpdateGHLContact` - Used for custom field sync
- `useDeleteGHLContact`

---

#### **5. Pipelines API**

**Hook**: `useGHLPipelines` ([src/hooks/useGHLOpportunities.ts:85-92](src/hooks/useGHLOpportunities.ts#L85-L92))

**Usage**:
- Pipeline/stage dropdown
- Kanban column configuration
- Opportunity filtering

**Caching Strategy**:
- `staleTime: 30 minutes` - Pipelines rarely change
- `gcTime: 60 minutes`

---

### API Call Flow Diagram

```
User Action (e.g., "Change Task Priority")
    │
    ├─→ [1] updatePriority(taskId, 'high')
    │       └─→ localStorage update (instant)
    │
    ├─→ [2] setTasks() - React state update (instant UI)
    │
    └─→ [3] triggerSync(contactId, taskIds)
            └─→ setTimeout(2000ms)
                └─→ contactsApi.update()
                    └─→ POST /api/ghl
                        └─→ { action: 'contacts.update', id, data: { customFields: [...] } }
                            └─→ PUT https://services.leadconnectorhq.com/contacts/{id}
                                └─→ GHL updates custom field
                                    └─→ ✅ Synced
```

---

### Critical GHL API Endpoints Used

| GHL Endpoint | Method | Purpose | Frequency |
|--------------|--------|---------|-----------|
| `/contacts/` | GET | Fetch contact by ID (for custom field load) | On contact first load |
| `/contacts/{id}` | PUT | Update custom fields (task metadata sync) | Debounced (2s after priority change) |
| `/opportunities/search?location_id=...` | GET | List all opportunities with pagination | Every 10 minutes (staleTime) |
| `/opportunities/pipelines?locationId=...` | GET | Get pipeline stages | Every 30 minutes (staleTime) |
| `/contacts/{contactId}/tasks` | GET | List tasks for a contact | Every 5 minutes (staleTime) |
| `/contacts/{contactId}/tasks/{taskId}/completed` | PUT | Toggle task completion | On user click |

---

## File Structure

```
hot-prospector-hub/
├── api/                              # Vercel Serverless Functions
│   ├── activity/
│   │   └── log.ts                    # Activity logging endpoint
│   ├── auth/
│   │   ├── callback.ts               # OAuth callback handler
│   │   ├── google.ts                 # Google OAuth initiation
│   │   ├── logout.ts                 # Logout handler
│   │   ├── me.ts                     # Current user info
│   │   └── verify-ghl-user.ts        # GHL user verification
│   ├── config/
│   │   └── env.ts                    # Environment config
│   ├── ghl/
│   │   ├── index.ts                  # ⭐ UNIFIED GHL API HANDLER
│   │   ├── users.ts                  # GHL users endpoint
│   │   └── webhooks.ts               # GHL webhook receiver
│   └── health/
│       └── index.ts                  # Health check endpoint
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx         # Route protection
│   │   │   └── UserMenu.tsx          # User dropdown menu
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx        # Client card component
│   │   │   ├── ClientDashboard.tsx   # Client dashboard view
│   │   │   ├── ClientTaskPanel.tsx   # Client task sidebar
│   │   │   └── IntakeFormModal.tsx   # Client intake form
│   │   ├── dashboard/
│   │   │   ├── DetailPanel.tsx       # Opportunity detail panel
│   │   │   ├── IntakeFormModal.tsx   # Intake form modal
│   │   │   ├── KanbanBoard.tsx       # Opportunity kanban
│   │   │   ├── KanbanColumn.tsx      # Kanban column component
│   │   │   ├── OpportunityCard.tsx   # Opportunity card
│   │   │   └── TopBar.tsx            # Dashboard top bar
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx         # Main app layout wrapper
│   │   │   └── AppSidebar.tsx        # Sidebar navigation
│   │   ├── tasks/
│   │   │   ├── AddTaskModal.tsx      # Add task modal
│   │   │   ├── TaskCard.tsx          # ⭐ Task card with priority buttons
│   │   │   ├── TaskDashboard.tsx     # Task dashboard
│   │   │   ├── TaskDetail.tsx        # Task detail panel
│   │   │   ├── TaskKanbanBoard.tsx   # ⭐ Collapsible Kanban board
│   │   │   ├── TaskKanbanColumn.tsx  # Kanban column
│   │   │   ├── TaskListView.tsx      # List view of tasks
│   │   │   └── TaskSection.tsx       # Task section component
│   │   ├── ui/                       # Shadcn UI components (40+ components)
│   │   ├── GHLSyncStatus.tsx         # GHL connection status indicator
│   │   ├── NavLink.tsx               # Navigation link component
│   │   └── ThemeToggle.tsx           # Dark mode toggle
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx            # Mobile detection hook
│   │   ├── use-toast.ts              # Toast notification hook
│   │   ├── useActivityLog.ts         # Activity logging hook
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useGHLContacts.ts         # ⭐ GHL Contacts API hook
│   │   ├── useGHLLocation.ts         # GHL Location hook
│   │   ├── useGHLOpportunities.ts    # ⭐ GHL Opportunities API hook
│   │   ├── useGHLTasks.ts            # ⭐ GHL Tasks API hook
│   │   ├── useGHLUsers.ts            # GHL Users hook
│   │   ├── useGHLWebhook.ts          # GHL Webhook hook
│   │   ├── useTaskMetadataCache.ts   # ⭐ Task priority cache system
│   │   └── useTheme.ts               # Theme management hook
│   │
│   ├── pages/
│   │   ├── ActivityLogs.tsx          # Activity logs page
│   │   ├── Index.tsx                 # Dashboard/opportunities page
│   │   ├── Login.tsx                 # Login page
│   │   ├── NotFound.tsx              # 404 page
│   │   ├── Staff.tsx                 # Staff management page
│   │   └── Tasks.tsx                 # ⭐ Task management page
│   │
│   ├── services/
│   │   └── ghl/
│   │       ├── api.ts                # ⭐ GHL API client service
│   │       ├── config.ts             # ⭐ GHL API configuration
│   │       └── index.ts              # GHL service barrel export
│   │
│   ├── types/
│   │   ├── client.ts                 # Client type definitions
│   │   ├── ghl.ts                    # ⭐ GHL API type definitions
│   │   ├── opportunity.ts            # Opportunity type definitions
│   │   └── task.ts                   # Task type definitions
│   │
│   ├── data/
│   │   ├── mockData.ts               # Mock opportunity data
│   │   └── taskData.ts               # Mock task data
│   │
│   ├── lib/
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── App.tsx                       # Root app component
│   ├── main.tsx                      # App entry point
│   └── vite-env.d.ts                 # Vite type declarations
│
├── public/                           # Static assets
├── components.json                   # Shadcn UI config
├── eslint.config.js                  # ESLint configuration
├── package.json                      # Dependencies
├── postcss.config.js                 # PostCSS config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── vercel.json                       # ⭐ Vercel deployment config
└── vite.config.ts                    # Vite config
```

### Key Files Legend
- ⭐ = Critical to GHL integration
- All files in `api/ghl/` are serverless functions
- All files in `src/hooks/useGHL*.ts` are React Query hooks
- UI components use Shadcn + Radix UI

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript 5.8.3
- **UI Library**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: @tanstack/react-query 5.83.0
- **Routing**: react-router-dom 6.30.1
- **Drag & Drop**: @hello-pangea/dnd 18.0.1
- **Forms**: react-hook-form 7.61.1 + zod 3.25.76
- **Date Utilities**: date-fns 3.6.0
- **Icons**: lucide-react 0.462.0
- **Notifications**: sonner 1.7.4
- **Theme**: next-themes 0.3.0

### Backend
- **Runtime**: Vercel Serverless Functions (Node.js)
- **API Framework**: @vercel/node 3.2.29
- **HTTP Client**: Native fetch API
- **Authentication**: Bearer token (GHL API Key)

### Development
- **Linting**: ESLint 9.32.0
- **Type Checking**: TypeScript 5.8.3
- **Code Formatting**: (Not configured, recommend Prettier)

### External APIs
- **GoHighLevel API**: v2021-07-28
  - Base URL: `https://services.leadconnectorhq.com`
  - Auth: Bearer token
  - Rate Limiting: Not explicitly handled

---

## Implementation Summary

### What's Built

#### ✅ Core Features (Complete)
1. **GHL Opportunity Management**
   - Kanban board with drag-and-drop
   - Real-time sync with GHL pipelines
   - Opportunity detail panel
   - Status updates
   - Pagination (up to 1000 opportunities)

2. **GHL Task Management**
   - Task creation/update/completion
   - Kanban and list views
   - Priority system (high/medium/low)
   - Task filtering (client, category, priority, date range)
   - Bulk operations (status update, delete)
   - Collapsible completed column (shows 20, expandable)

3. **Task Priority System**
   - Three-tier priority (high/medium/low)
   - localStorage caching for instant updates
   - GHL custom field sync (debounced 2s)
   - Per-contact JSON storage in GHL
   - Persistent across sessions

4. **Modern UI/UX**
   - Glassmorphic design with backdrop blur
   - Dark mode support
   - Responsive layout
   - Drag-and-drop interactions
   - Toast notifications
   - Loading skeletons

5. **GHL Integration Architecture**
   - Unified API route for all GHL operations
   - Type-safe API client
   - React Query caching strategy
   - Pagination handling
   - Error handling

#### 🟡 Partially Complete
1. **Authentication**
   - Files present (AuthGuard, login page)
   - Google OAuth endpoints configured
   - **Missing**: Full auth flow implementation

2. **Activity Logging**
   - Hook exists (`useActivityLog`)
   - Backend endpoint exists (`/api/activity/log`)
   - **Missing**: UI implementation, database storage

3. **Webhooks**
   - Endpoint exists (`/api/ghl/webhooks`)
   - **Missing**: Event processing, real-time updates

4. **Staff Management**
   - Page exists (`Staff.tsx`)
   - **Missing**: Full implementation

#### ❌ Not Started
1. **Database Layer**
   - No database configured
   - All data from GHL API (no local persistence except localStorage)

2. **Real-time Collaboration**
   - No WebSocket or SSE implementation
   - No Pusher/Ably integration

3. **Testing**
   - No unit tests
   - No integration tests
   - No E2E tests

4. **Documentation**
   - No API documentation
   - No user guides
   - No deployment guides

---

### Technical Debt & Issues

#### 🔴 Critical
1. **No Database**
   - Task metadata stored only in GHL custom fields + localStorage
   - No audit trail
   - No user preferences storage

2. **No Rate Limiting**
   - GHL API calls not throttled
   - Could hit API limits with many users

3. **No Error Boundaries**
   - App could crash on uncaught errors

4. **Missing Environment Variables Validation**
   - No check for required env vars on startup

#### 🟠 Medium Priority
1. **Pagination Limits**
   - Hardcoded to max 10 pages (1000 opportunities)
   - Should be configurable or infinite

2. **Task Fetch Inefficiency**
   - Fetches tasks for ALL contacts in pipeline serially
   - Should batch or parallelize more efficiently

3. **No Optimistic UI for All Operations**
   - Only some mutations use optimistic updates

4. **localStorage Sync Edge Cases**
   - No conflict resolution if multiple tabs open
   - No sync across devices

5. **No GHL Webhook Processing**
   - Webhook endpoint exists but doesn't process events
   - No real-time updates on GHL changes

#### 🟢 Nice to Have
1. **No Code Splitting**
   - All components loaded upfront
   - Should lazy load routes

2. **No PWA Support**
   - Not installable
   - No offline mode

3. **No Analytics**
   - No usage tracking
   - No error monitoring (Sentry, etc.)

4. **No Accessibility Audit**
   - Components from Shadcn are accessible
   - Custom components may need ARIA labels

---

## Implementation Priorities

### Priority Matrix

#### P0 - Critical (Must Have Before Production)
1. **Environment Variable Validation** (2h)
   - Add startup checks for required env vars
   - Fail fast with clear error messages

2. **Error Boundaries** (3h)
   - Add top-level error boundary
   - Add error boundary per major section

3. **Rate Limiting** (4h)
   - Add GHL API rate limiter
   - Implement exponential backoff

4. **Authentication Flow** (8h)
   - Complete Google OAuth integration
   - Add protected routes
   - Session management

5. **Database Setup** (8h)
   - Choose database (PostgreSQL, Supabase, or Vercel Postgres)
   - Schema design for users, settings, audit logs
   - Migration system

#### P1 - High Priority (Week 1-2)
6. **Webhook Event Processing** (6h)
   - Process GHL webhook events
   - Update React Query cache on webhook
   - Add real-time UI updates

7. **Task Fetch Optimization** (4h)
   - Batch contact task fetches
   - Add parallel fetch limit (e.g., 5 at a time)
   - Cache at pipeline level

8. **Pagination Improvements** (3h)
   - Make page limit configurable
   - Add infinite scroll option
   - Show progress indicator

9. **Conflict Resolution for Task Metadata** (5h)
   - Last-write-wins with timestamp
   - Merge strategies for multi-tab edits
   - Sync indicator in UI

10. **Activity Logging UI** (6h)
    - Activity feed component
    - Filter by action type
    - Persist to database

#### P2 - Medium Priority (Week 3-4)
11. **Code Splitting** (4h)
    - Lazy load routes
    - Lazy load heavy components (e.g., Calendar)
    - Measure bundle size improvements

12. **Testing Setup** (8h)
    - Vitest configuration
    - React Testing Library
    - Test critical paths (task creation, GHL sync)

13. **Error Monitoring** (3h)
    - Sentry integration
    - Error tracking
    - Performance monitoring

14. **Analytics** (3h)
    - Google Analytics or Plausible
    - Event tracking (task created, opportunity moved, etc.)

15. **Accessibility Audit** (5h)
    - Keyboard navigation
    - Screen reader testing
    - ARIA labels

#### P3 - Low Priority (Month 2+)
16. **PWA Support** (6h)
    - Service worker
    - Offline mode with IndexedDB
    - Install prompt

17. **Advanced Filtering** (5h)
    - Saved filters
    - Complex filter UI
    - Filter presets

18. **Bulk Import/Export** (8h)
    - CSV import for tasks
    - Export to Excel
    - Template system

19. **Custom Dashboards** (10h)
    - Widget system
    - Drag-and-drop dashboard builder
    - User preferences

20. **Mobile App** (40h+)
    - React Native or Flutter
    - Offline-first architecture
    - Push notifications

---

## Implementation Stories

### Epic 1: Production Readiness

#### Story 1.1: Environment Variable Validation
**As a** developer
**I want** the app to validate environment variables on startup
**So that** I get clear error messages if configuration is missing

**Acceptance Criteria**:
- [ ] Create `/api/config/validate.ts` with validation logic
- [ ] Check for `GHL_API_KEY`, `GHL_LOCATION_ID`, etc.
- [ ] Fail startup with specific error message
- [ ] Log validation results to console
- [ ] Add to Vercel build step

**Technical Notes**:
- Use zod for schema validation
- Create `.env.example` with all required vars
- Document in README.md

**Estimated Effort**: 2 hours

---

#### Story 1.2: Global Error Boundaries
**As a** user
**I want** the app to gracefully handle errors
**So that** the entire app doesn't crash on a single component error

**Acceptance Criteria**:
- [ ] Add top-level ErrorBoundary in App.tsx
- [ ] Add ErrorBoundary around each route
- [ ] Show user-friendly error UI
- [ ] Log errors to console (and later Sentry)
- [ ] Add "Retry" button

**Technical Notes**:
- Use `react-error-boundary` package
- Create custom ErrorFallback component
- Integrate with error monitoring (P2)

**Estimated Effort**: 3 hours

---

#### Story 1.3: GHL API Rate Limiting
**As a** developer
**I want** to rate-limit GHL API calls
**So that** we don't exceed API limits

**Acceptance Criteria**:
- [ ] Research GHL API rate limits
- [ ] Implement rate limiter in `/api/ghl/index.ts`
- [ ] Add exponential backoff for 429 errors
- [ ] Queue requests when approaching limit
- [ ] Add metrics/logging for rate limit hits

**Technical Notes**:
- Use `bottleneck` or `p-limit` library
- Store rate limit state in memory (or Redis for multi-instance)
- Add retry logic with jitter

**Estimated Effort**: 4 hours

---

#### Story 1.4: Complete Authentication Flow
**As a** user
**I want** to log in with Google
**So that** I can access my personalized dashboard

**Acceptance Criteria**:
- [ ] Complete OAuth callback handling
- [ ] Store user session in secure cookie
- [ ] Implement AuthGuard to protect routes
- [ ] Add logout functionality
- [ ] Redirect to login on 401 errors

**Technical Notes**:
- Use `jsonwebtoken` for session tokens
- Store in httpOnly cookie
- Add refresh token mechanism
- Integrate with database (Story 1.5)

**Estimated Effort**: 8 hours

---

#### Story 1.5: Database Setup
**As a** developer
**I want** a database to store user data and settings
**So that** we can persist data beyond GHL API

**Acceptance Criteria**:
- [ ] Choose database (recommend: Vercel Postgres or Supabase)
- [ ] Design schema for users, settings, audit_logs, task_metadata
- [ ] Set up migrations (Drizzle ORM or Prisma)
- [ ] Create database connection utility
- [ ] Add to environment variables

**Schema Draft**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  theme TEXT DEFAULT 'system',
  default_view TEXT DEFAULT 'kanban',
  settings JSONB DEFAULT '{}'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_metadata (
  task_id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  custom_data JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estimated Effort**: 8 hours

---

### Epic 2: Real-time Updates & Performance

#### Story 2.1: GHL Webhook Event Processing
**As a** user
**I want** my dashboard to update automatically when data changes in GHL
**So that** I don't have to manually refresh

**Acceptance Criteria**:
- [ ] Process webhook events in `/api/ghl/webhooks.ts`
- [ ] Invalidate React Query cache on relevant events
- [ ] Add webhook signature verification
- [ ] Log all webhook events to database
- [ ] Show toast notification on background updates

**Webhook Events to Handle**:
- `OpportunityStageUpdate` → Invalidate opportunities query
- `OpportunityStatusUpdate` → Invalidate opportunities query
- `TaskCreate/Update/Complete` → Invalidate tasks query
- `ContactUpdate` → Invalidate contact query

**Technical Notes**:
- Use Server-Sent Events (SSE) or Pusher for real-time updates
- Store webhook events in database for replay
- Add webhook retry logic in GHL dashboard

**Estimated Effort**: 6 hours

---

#### Story 2.2: Optimize Task Fetching
**As a** user
**I want** the task page to load quickly
**So that** I can start working immediately

**Acceptance Criteria**:
- [ ] Batch task fetches (5 contacts at a time)
- [ ] Add loading progress indicator
- [ ] Cache tasks at pipeline level (not per-contact)
- [ ] Reduce React Query staleTime for faster loads
- [ ] Add prefetching on route navigation

**Technical Notes**:
```typescript
// Before: Serial fetches
for (const opp of opportunities) {
  await tasksApi.listByContact(opp.contactId);
}

// After: Batched parallel fetches
const batches = chunk(opportunities, 5);
for (const batch of batches) {
  await Promise.all(batch.map(opp => tasksApi.listByContact(opp.contactId)));
}
```

**Estimated Effort**: 4 hours

---

#### Story 2.3: Configurable Pagination
**As a** power user
**I want** to load all my opportunities (even if >1000)
**So that** I can see my entire pipeline

**Acceptance Criteria**:
- [ ] Add pagination settings to user preferences
- [ ] Make page limit configurable (default 10, max 50)
- [ ] Add "Load More" button option
- [ ] Show pagination progress (e.g., "Loaded 500 of ~1200")
- [ ] Add "Stop Loading" button for long loads

**Technical Notes**:
- Add to user_settings table: `pagination_limit: number`
- Show spinner with cancel button
- Persist setting across sessions

**Estimated Effort**: 3 hours

---

#### Story 2.4: Task Metadata Conflict Resolution
**As a** user with multiple tabs open
**I want** my task priority changes to sync across tabs
**So that** I don't lose updates

**Acceptance Criteria**:
- [ ] Detect localStorage changes from other tabs
- [ ] Use `storage` event listener
- [ ] Merge changes with last-write-wins + timestamp
- [ ] Show conflict indicator in UI
- [ ] Add manual "Sync Now" button

**Technical Notes**:
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'task-metadata-cache') {
      // Merge with current cache
      const remoteCache = JSON.parse(e.newValue);
      mergeCache(remoteCache);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

**Estimated Effort**: 5 hours

---

#### Story 2.5: Activity Logging UI
**As a** manager
**I want** to see an activity feed of all actions
**So that** I can audit team activity

**Acceptance Criteria**:
- [ ] Create Activity Feed component
- [ ] Show user, action, timestamp, details
- [ ] Filter by user, action type, date range
- [ ] Pagination (infinite scroll)
- [ ] Export to CSV

**Actions to Log**:
- Task created/updated/completed/deleted
- Opportunity status changed
- Contact updated
- User logged in/out

**Technical Notes**:
- Store in `audit_logs` table
- Index on `created_at` and `user_id`
- Add to sidebar navigation

**Estimated Effort**: 6 hours

---

### Epic 3: Testing & Quality

#### Story 3.1: Test Setup
**As a** developer
**I want** a test suite for critical features
**So that** we can prevent regressions

**Acceptance Criteria**:
- [ ] Set up Vitest + React Testing Library
- [ ] Add test for task creation flow
- [ ] Add test for GHL API sync
- [ ] Add test for priority update + localStorage
- [ ] Add test for drag-and-drop
- [ ] Configure CI to run tests on PR

**Tests to Write**:
1. Task CRUD operations
2. GHL API mock + response handling
3. localStorage cache behavior
4. React Query cache invalidation
5. Kanban drag-and-drop

**Technical Notes**:
- Mock GHL API with MSW
- Use `@testing-library/user-event` for interactions
- Add coverage thresholds (>70%)

**Estimated Effort**: 8 hours

---

#### Story 3.2: Code Splitting
**As a** user
**I want** the initial page load to be fast
**So that** I can start working quickly

**Acceptance Criteria**:
- [ ] Lazy load all route components
- [ ] Lazy load Calendar component (large)
- [ ] Lazy load modals (AddTaskModal, etc.)
- [ ] Add loading fallbacks (Skeleton)
- [ ] Measure bundle size reduction (target: -30%)

**Technical Notes**:
```typescript
// Before
import Tasks from '@/pages/Tasks';

// After
const Tasks = lazy(() => import('@/pages/Tasks'));
```

- Use Vite's bundle analyzer
- Aim for <200KB initial bundle

**Estimated Effort**: 4 hours

---

#### Story 3.3: Error Monitoring (Sentry)
**As a** developer
**I want** to be notified of production errors
**So that** I can fix issues proactively

**Acceptance Criteria**:
- [ ] Set up Sentry account
- [ ] Add Sentry SDK to frontend
- [ ] Add Sentry SDK to API routes
- [ ] Configure source maps for stack traces
- [ ] Set up alerts for critical errors
- [ ] Add custom error contexts (user, session)

**Technical Notes**:
- Use `@sentry/react` and `@sentry/node`
- Add to `main.tsx` and `/api/ghl/index.ts`
- Filter out PII from error reports
- Add release tracking

**Estimated Effort**: 3 hours

---

### Epic 4: Nice-to-Haves

#### Story 4.1: PWA Support
**As a** mobile user
**I want** to install the app on my home screen
**So that** it feels like a native app

**Acceptance Criteria**:
- [ ] Add service worker with Workbox
- [ ] Add web manifest (`manifest.json`)
- [ ] Add offline page
- [ ] Cache API responses in IndexedDB
- [ ] Add install prompt

**Technical Notes**:
- Use `vite-plugin-pwa`
- Cache read operations only (no offline writes)
- Add app icons (192x192, 512x512)

**Estimated Effort**: 6 hours

---

#### Story 4.2: Advanced Filtering
**As a** user
**I want** to save my filter presets
**So that** I don't have to recreate them each time

**Acceptance Criteria**:
- [ ] Add "Save Filter" button
- [ ] Store filters in user_settings
- [ ] Add "Saved Filters" dropdown
- [ ] Edit/delete saved filters
- [ ] Set default filter

**Technical Notes**:
```typescript
interface SavedFilter {
  id: string;
  name: string;
  filters: {
    category?: string;
    priority?: string;
    clientId?: string;
    dateRange?: DateRange;
  };
}
```

**Estimated Effort**: 5 hours

---

## Next Steps

1. **Immediate Actions** (Today)
   - Set up error boundaries (Story 1.2)
   - Add environment variable validation (Story 1.1)
   - Document deployment process

2. **This Week**
   - Complete authentication (Story 1.4)
   - Set up database (Story 1.5)
   - Add rate limiting (Story 1.3)

3. **This Month**
   - Implement webhook processing (Story 2.1)
   - Optimize task fetching (Story 2.2)
   - Set up testing (Story 3.1)

4. **Ongoing**
   - Monitor error logs
   - Gather user feedback
   - Iterate on UX

---

## Appendix: Environment Variables

Required environment variables:

```bash
# GHL API Configuration
GHL_API_KEY=<your-ghl-api-key>
GHL_LOCATION_ID=<your-ghl-location-id>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/callback

# Database (if using Vercel Postgres)
POSTGRES_URL=<your-postgres-connection-string>

# Session Secret
SESSION_SECRET=<random-secret-key>

# Frontend
VITE_API_BASE_URL=/api

# Optional: Error Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

---

## Appendix: Deployment Checklist

- [ ] Set all environment variables in Vercel dashboard
- [ ] Enable automatic deployments from main branch
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure GHL webhook URL to point to production
- [ ] Test OAuth callback with production URLs
- [ ] Run database migrations in production
- [ ] Set up monitoring (Sentry, Vercel Analytics)
- [ ] Configure CORS for production domain
- [ ] Test in production environment
- [ ] Create rollback plan

---

**End of Document**
