import { Task } from '@/types/task';

export type PipelineStage = 
  | 'welcome'
  | 'intake_form_submitted'
  | 'draft_build'
  | 'assessment_booked'
  | 'setup_in_progress'
  | 'setup_complete'
  | 'no_show';

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'intake_form_submitted', label: 'Intake Form Submitted' },
  { id: 'draft_build', label: 'Draft Build' },
  { id: 'assessment_booked', label: 'Assessment Booked' },
  { id: 'setup_in_progress', label: 'Setup In Progress' },
  { id: 'setup_complete', label: 'Setup Complete' },
  { id: 'no_show', label: 'No Show' },
];

export interface CSM {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  startDate: string;
  status: 'active' | 'completed' | 'on_hold';
  pipelineStage: PipelineStage;
  assignedCsmId: string;
  assessmentBooked: boolean;
  assessmentDate?: string;
  onboardingBooked: boolean;
  onboardingDate?: string;
  draftBuildNotified: boolean;
  setupCompleteNotified: boolean;
  intakeForm: IntakeFormData;
}

export interface IntakeFormData {
  submittedAt: string;
  
  // Agency Profile
  agencyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

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

export const CSM_LIST: CSM[] = [
  { id: 'csm-1', name: 'Sarah Johnson', email: 'sarah@hotprospector.com', initials: 'SJ', color: 'bg-blue-500' },
  { id: 'csm-2', name: 'Mike Chen', email: 'mike@hotprospector.com', initials: 'MC', color: 'bg-emerald-500' },
  { id: 'csm-3', name: 'Emily Rodriguez', email: 'emily@hotprospector.com', initials: 'ER', color: 'bg-purple-500' },
];

const createIntakeForm = (name: string, firstName: string, lastName: string, email: string, phone: string): IntakeFormData => ({
  submittedAt: new Date().toISOString(),
  agencyName: name,
  firstName,
  lastName,
  email,
  phone,
  totalActiveSubAccounts: Math.floor(Math.random() * 50) + 10,
  topSubAccountsToLaunch: 'Acme Dental, Summit Realty, Peak Fitness',
  avgNewLeadsPerMonth: Math.floor(Math.random() * 500) + 100,
  primaryNiches: 'Dental, Real Estate, Fitness, Home Services',
  ghlAgencyAccessReady: Math.random() > 0.3,
  adminAccessGiven: Math.random() > 0.4,
  subAccountsToConnect: '5 sub-accounts ready for initial setup',
  existingSnapshotName: 'Hot Prospector Standard v2.1',
  pipelinesInUse: 'New Leads, Qualified, Appointment Set, Closed Won',
  calendarsUsed: 'Google Calendar, Calendly integration',
  acceptingPaymentSmsLinks: true,
  journeyFromOptInToClose: 'Lead opts in via landing page → Receives immediate SMS → Agent calls within 5 min → Discovery call scheduled → Proposal sent → Follow-up sequence → Close',
  leadReadinessTags: 'hot_lead, warm_lead, cold_lead, ready_to_buy',
  trackingTags: 'source_facebook, source_google, source_referral',
  dncTagName: 'do_not_contact',
  tagsToNeverDial: 'dnc, unsubscribed, competitor',
  leadSourcesUsed: 'Facebook Ads, Google Ads, Referral Program, Website Forms',
  includeAgedLeads: true,
  agedLeadsDateRange: 'Last 90 days',
  agedLeadsCount: 250,
  twilioAccountCreated: Math.random() > 0.3,
  developerAccessGiven: Math.random() > 0.4,
  primaryBusinessProfileComplete: Math.random() > 0.5,
  messagingPath: Math.random() > 0.5 ? 'LeadConnector' : 'HotProspector',
  a2pRegistration: Math.random() > 0.4,
  purchaseMatchingAreaCodeNumbers: true,
  outboundNumberCountPerLocation: 3,
  cnamCallerIdText: name,
  knownSpamIssues: 'None reported',
  numberOfAgentsNow: Math.floor(Math.random() * 5) + 2,
  numberOfAgentsTarget: Math.floor(Math.random() * 10) + 5,
  workingHoursWindow: '9:00 AM - 6:00 PM EST',
  callCadenceSop: 'Call → SMS → Email → Wait 24h → Repeat x3',
  attemptsPerLeadLifetime: 12,
  attemptsPerLeadPerDay: 3,
  minHoursBetweenAttempts: 4,
  doubleDial: true,
  leaveVoicemail: true,
  salesScriptSource: 'Provided via Google Docs',
  uploadedFiles: ['sales_script_v2.pdf', 'call_flow_diagram.png'],
  rebuttalLibraryLocation: 'Notion workspace - Rebuttals folder',
  smsTemplatesToImport: '15 templates ready in spreadsheet',
  emailTemplatesToImport: '8 email sequences prepared',
  customStatusesToTrack: 'Callback Scheduled, Left Voicemail, Not Interested, Wrong Number',
  inboundCallRouting: 'Round robin to available agents',
  afterHoursPlan: 'Voicemail with callback next business day',
  metricsNeedingImprovement: 'Contact rate, Speed to lead, Conversion rate',
  conversationIntelligenceSetup: Math.random() > 0.5,
  aiSummariesInNotes: true,
  speedToLeadWebhooks: true,
  slackNotifications: true,
  zapierMakeFlows: 'Lead notification to Slack, Daily summary to email',
  otherCrmIntegrations: 'HubSpot sync for enterprise clients',
});

export const CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'ABC Marketing Agency',
    contactName: 'John Smith',
    contactEmail: 'john@abcmarketing.com',
    contactPhone: '(555) 123-4567',
    startDate: '2024-12-01',
    status: 'active',
    pipelineStage: 'draft_build',
    assignedCsmId: 'csm-1',
    assessmentBooked: true,
    assessmentDate: '2024-12-05T14:00:00',
    onboardingBooked: false,
    draftBuildNotified: false,
    setupCompleteNotified: false,
    intakeForm: createIntakeForm('ABC Marketing Agency', 'John', 'Smith', 'john@abcmarketing.com', '(555) 123-4567'),
  },
  {
    id: 'client-2',
    name: 'Digital Growth Partners',
    contactName: 'Amanda Chen',
    contactEmail: 'amanda@digitalgrowth.io',
    contactPhone: '(555) 234-5678',
    startDate: '2024-12-03',
    status: 'active',
    pipelineStage: 'setup_in_progress',
    assignedCsmId: 'csm-2',
    assessmentBooked: true,
    assessmentDate: '2024-12-07T10:00:00',
    onboardingBooked: true,
    onboardingDate: '2024-12-12T15:00:00',
    draftBuildNotified: true,
    setupCompleteNotified: false,
    intakeForm: createIntakeForm('Digital Growth Partners', 'Amanda', 'Chen', 'amanda@digitalgrowth.io', '(555) 234-5678'),
  },
  {
    id: 'client-3',
    name: 'Peak Performance Media',
    contactName: 'Michael Torres',
    contactEmail: 'mtorres@peakperformance.com',
    contactPhone: '(555) 345-6789',
    startDate: '2024-11-28',
    status: 'active',
    pipelineStage: 'welcome',
    assignedCsmId: 'csm-3',
    assessmentBooked: false,
    onboardingBooked: false,
    draftBuildNotified: false,
    setupCompleteNotified: false,
    intakeForm: createIntakeForm('Peak Performance Media', 'Michael', 'Torres', 'mtorres@peakperformance.com', '(555) 345-6789'),
  },
  {
    id: 'client-4',
    name: 'Summit Lead Generation',
    contactName: 'Jessica Williams',
    contactEmail: 'jessica@summitleads.co',
    contactPhone: '(555) 456-7890',
    startDate: '2024-11-25',
    status: 'active',
    pipelineStage: 'assessment_booked',
    assignedCsmId: 'csm-1',
    assessmentBooked: true,
    assessmentDate: '2024-12-02T09:00:00',
    onboardingBooked: true,
    onboardingDate: '2024-12-10T11:00:00',
    draftBuildNotified: true,
    setupCompleteNotified: false,
    intakeForm: createIntakeForm('Summit Lead Generation', 'Jessica', 'Williams', 'jessica@summitleads.co', '(555) 456-7890'),
  },
  {
    id: 'client-5',
    name: 'Velocity Sales Pros',
    contactName: 'David Martinez',
    contactEmail: 'david@velocitysales.net',
    contactPhone: '(555) 567-8901',
    startDate: '2024-12-05',
    status: 'active',
    pipelineStage: 'intake_form_submitted',
    assignedCsmId: 'csm-2',
    assessmentBooked: false,
    onboardingBooked: false,
    draftBuildNotified: false,
    setupCompleteNotified: false,
    intakeForm: createIntakeForm('Velocity Sales Pros', 'David', 'Martinez', 'david@velocitysales.net', '(555) 567-8901'),
  },
  {
    id: 'client-6',
    name: 'Apex Digital Solutions',
    contactName: 'Sarah Thompson',
    contactEmail: 'sthompson@apexdigital.com',
    contactPhone: '(555) 678-9012',
    startDate: '2024-11-15',
    status: 'completed',
    pipelineStage: 'setup_complete',
    assignedCsmId: 'csm-3',
    assessmentBooked: true,
    assessmentDate: '2024-11-18T14:00:00',
    onboardingBooked: true,
    onboardingDate: '2024-11-25T10:00:00',
    draftBuildNotified: true,
    setupCompleteNotified: true,
    intakeForm: createIntakeForm('Apex Digital Solutions', 'Sarah', 'Thompson', 'sthompson@apexdigital.com', '(555) 678-9012'),
  },
];
