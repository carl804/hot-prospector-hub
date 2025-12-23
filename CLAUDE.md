# Hot Prospector Hub - Claude Code Context

## Project Overview

Hot Prospector Hub is a CSM (Customer Success Manager) Dashboard built with React, TypeScript, and Tailwind CSS. It integrates with GoHighLevel (GHL) API for managing client pipelines, opportunities, tasks, and notes.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State**: TanStack Query (React Query)
- **API**: Vercel Serverless Functions + GHL API v2
- **Styling**: Dark mode first, Hot Prospector branding (Blue #068FF8, Gold #F1D600)

## Key Features

- Kanban board for pipeline/opportunity management
- Client cards with booking status pills (Assessment, Onboarding, Kickoff)
- Notes modal with 2-column layout
- CSM notification system triggering GHL workflows
- Task progress tracking
- Activity logging

## Project Structure

```
/api                    # Vercel serverless functions
  /ghl/index.ts        # GHL API proxy handler
/src
  /components
    /clients           # ClientCard, ClientDashboard
    /notes             # NotesModal (2-column layout)
    /layout            # AppSidebar, Header
    /ui                # shadcn/ui components
  /hooks               # Custom hooks (useGHLNotes, useGHLOpportunities, etc.)
  /services/ghl        # GHL API service layer
  /types               # TypeScript interfaces
```

## GHL Integration

### API Actions
- `opportunities.list` - Fetch pipeline opportunities
- `contacts.get` - Get contact details with custom fields
- `contacts.addTag` - Add tags to trigger workflows
- `contacts.updateCustomField` - Update contact custom fields
- `tasks.list` - Get tasks for contacts
- `notes.list/create/update/delete` - CRUD operations for notes
- `customFields.list` - Get available custom fields

### Custom Fields Used
- `contact.assessment_call_booked` / `contact.assessment_call_booked_date`
- `contact.onboarding_call_booked` / `contact.onboarding_call_booked_date`
- `contact.kickoff_call_booked` / `contact.kickoff_call_booked_date`
- `contact.draft_build_notified`
- `contact.setup_complete_notified`

### Workflow Tags
- `build-draft-notified` - Triggers Draft Build Complete workflow
- `build-complete-notified` - Triggers Setup Complete workflow

## Environment Variables

```
GHL_API_KEY=           # GoHighLevel API key
GHL_LOCATION_ID=       # GHL location/sub-account ID
GHL_PIPELINE_ID=       # Pipeline ID to filter opportunities
```

## Development Commands

```bash
npm run dev          # Start frontend (port 8080)
npm run dev:api      # Start API server (port 3001)
npm run build        # Production build
```

## Code Conventions

- Use `cn()` utility for conditional classNames
- React Query for server state management
- Tailwind with CSS variables for theming
- Component-based architecture with hooks for business logic
