export type Stage =
  | 'welcome'
  | 'intake_submitted'
  | 'draft_build'
  | 'assessment_booked'
  | 'setup_in_progress'
  | 'setup_complete'
  | 'no_show';

export interface CSM {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface IntakeFormData {
  // Agency Profile
  agencyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  submittedAt: string;

  // Client Portfolio Snapshot
  totalActiveSubAccounts: number;
  topSubAccountsToLaunch: string;
  avgNewLeadsPerMonth: number;
  primaryNiches: string;

  // GHL Architecture
  ghlAgencyAccessReady: boolean;
  adminAccessGiven: boolean;

  // Platform Details
  subAccountsToConnect: string;
  existingSnapshotName: string;
  pipelinesInUse: string;
  calendarsUsed: string;
  acceptingPaymentSmsLinks: boolean;

  // Prospect's Journey
  journeyFromOptInToClose: string;

  // Tag Conventions
  leadReadinessTags: string;
  trackingTags: string;
  dncTagName: string;
  tagsToNeverDial: string;

  // Lead Sources & Routing
  leadSourcesUsed: string;
  includeAgedLeads: boolean;
  agedLeadsDateRange: string;
  agedLeadsCount: number;

  // Twilio & Numbers Setup
  twilioAccountCreated: boolean;
  developerAccessGiven: boolean;
  primaryBusinessProfileComplete: boolean;
  messagingPath: 'LeadConnector' | 'HotProspector';
  a2pRegistration: boolean;

  // Local Presence Settings
  purchaseMatchingAreaCodeNumbers: boolean;
  outboundNumberCountPerLocation: number;
  cnamCallerIdText: string;
  knownSpamIssues: string;

  // Call Center Operations
  numberOfAgentsNow: number;
  numberOfAgentsTarget: number;
  workingHoursWindow: string;
  callCadenceSop: string;
  attemptsPerLeadLifetime: number;
  attemptsPerLeadPerDay: number;
  minHoursBetweenAttempts: number;
  doubleDial: boolean;
  leaveVoicemail: boolean;

  // Messaging & Content
  salesScriptSource: string;
  uploadedFiles: string[];
  rebuttalLibraryLocation: string;
  smsTemplatesToImport: string;
  emailTemplatesToImport: string;

  // Dispositions & Routing
  customStatusesToTrack: string;
  inboundCallRouting: string;
  afterHoursPlan: string;

  // Reporting & Integrations
  metricsNeedingImprovement: string;
  conversationIntelligenceSetup: boolean;
  aiSummariesInNotes: boolean;
  speedToLeadWebhooks: boolean;
  slackNotifications: boolean;
  zapierMakeFlows: string;
  otherCrmIntegrations: string;
}

export interface Opportunity {
  id: string;
  agencyName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  assignedCsmId: string;
  stage: Stage;
  deadline: string;
  value: number;
  assessmentBooked: boolean;
  assessmentDate?: string;
  onboardingBooked: boolean;
  onboardingDate?: string;
  ghlAccessReady: boolean;
  tasks: Task[];
  notes: string;
  intakeForm: IntakeFormData;
  createdAt: string;
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'intake_submitted', label: 'Intake Form Submitted' },
  { id: 'draft_build', label: 'Draft Build' },
  { id: 'assessment_booked', label: 'Assessment Booked' },
  { id: 'setup_in_progress', label: 'Setup in Progress' },
  { id: 'setup_complete', label: 'Setup Complete' },
  { id: 'no_show', label: 'No Show' },
];
