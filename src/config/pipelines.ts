// GHL Pipeline Configuration
// Centralized pipeline IDs and stage mappings

export const PIPELINES = {
  // Account Setup Pipeline (original)
  ACCOUNT_SETUP: {
    id: 'QNloaHE61P6yedF6jEzk',
    name: '002. Account Setup',
  },
  // Onboarding Pipeline (new)
  ONBOARDING: {
    id: '2AiC2wKqLWqxT2AHeaRI',
    name: '001. Onboarding',
    stages: {
      WELCOME: 'c87ad679-0d67-409b-83c5-304789a64c05',
      SETUP_COMPLETE: 'bbfa11fb-9617-4799-abf4-f94b8314ad04',
      ONBOARDING_BOOKED: '1e142419-3901-43a7-a6e0-eac8dc8f2107',
      SALES_KICKOFF_BOOKED: '422b9bc5-368d-431f-acfc-e4e893e93f8a',
      FEEDBACK_SENT: 'c958d204-f107-4bee-9717-350f5a2a10ef',
      FEEDBACK_RECEIVED: '06e892a3-6995-4e28-a2fd-3ff3374f23b7',
      JUMP_TO_HYPERCARE: '08f3c470-b68b-4ae3-8d7b-02c85003a141',
      NO_SHOW: '36969f5b-00d6-4818-aa1c-19e7325d7f28',
    },
  },
} as const;

// All pipeline IDs for filtering
export const ALL_PIPELINE_IDS = [
  PIPELINES.ACCOUNT_SETUP.id,
  PIPELINES.ONBOARDING.id,
] as const;

// Helper to check if an opportunity is in a tracked pipeline
export function isTrackedPipeline(pipelineId: string): boolean {
  return ALL_PIPELINE_IDS.includes(pipelineId as typeof ALL_PIPELINE_IDS[number]);
}

// Get pipeline name by ID
export function getPipelineName(pipelineId: string): string {
  if (pipelineId === PIPELINES.ACCOUNT_SETUP.id) return PIPELINES.ACCOUNT_SETUP.name;
  if (pipelineId === PIPELINES.ONBOARDING.id) return PIPELINES.ONBOARDING.name;
  return 'Unknown Pipeline';
}
