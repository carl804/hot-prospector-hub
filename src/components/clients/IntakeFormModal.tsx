import { X } from 'lucide-react';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface IntakeFormModalProps {
  client: Client;
  onClose: () => void;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm text-foreground">{value}</span>
    </div>
  );
}

function StatusBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
        value
          ? 'bg-badge-green-bg text-badge-green-text'
          : 'bg-badge-red-bg text-badge-red-text'
      )}
    >
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export function IntakeFormModal({ client, onClose }: IntakeFormModalProps) {
  const form = client.intakeForm;

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <h2 className="text-xl font-semibold text-foreground">
            Agency Intake Form - {client.name}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 kanban-scrollbar">
          <Accordion type="multiple" defaultValue={['agency-profile']} className="space-y-2">
            {/* 1. Agency Profile */}
            <AccordionItem value="agency-profile" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Agency Profile
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Agency Name" value={form.agencyName} />
                <FieldRow label="First Name" value={form.firstName} />
                <FieldRow label="Last Name" value={form.lastName} />
                <FieldRow label="Email" value={form.email} />
                <FieldRow label="Phone" value={form.phone} />
                <FieldRow label="Date/Time Submitted" value={new Date(form.submittedAt).toLocaleString()} />
              </AccordionContent>
            </AccordionItem>

            {/* 2. Client Portfolio Snapshot */}
            <AccordionItem value="portfolio" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Client Portfolio Snapshot
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Total Active Sub-Accounts" value={form.totalActiveSubAccounts} />
                <FieldRow label="Top Sub-Accounts to Launch" value={form.topSubAccountsToLaunch} />
                <FieldRow label="Avg New Leads/Month" value={form.avgNewLeadsPerMonth} />
                <FieldRow label="Primary Niches" value={form.primaryNiches} />
              </AccordionContent>
            </AccordionItem>

            {/* 3. GHL Architecture */}
            <AccordionItem value="ghl" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                GHL Architecture
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="GHL Agency Access Ready?" value={<StatusBadge value={form.ghlAgencyAccessReady} />} />
                <FieldRow label="Admin Access Given?" value={<StatusBadge value={form.adminAccessGiven} />} />
              </AccordionContent>
            </AccordionItem>

            {/* 4. Platform Details */}
            <AccordionItem value="platform" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Platform Details
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Sub-Accounts to Connect" value={form.subAccountsToConnect} />
                <FieldRow label="Existing Snapshot Name" value={form.existingSnapshotName} />
                <FieldRow label="Pipelines in Use" value={form.pipelinesInUse} />
                <FieldRow label="Calendars Used" value={form.calendarsUsed} />
                <FieldRow label="Accepting Payment/SMS Links?" value={<StatusBadge value={form.acceptingPaymentSmsLinks} />} />
              </AccordionContent>
            </AccordionItem>

            {/* 5. Prospect's Journey */}
            <AccordionItem value="journey" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Prospect's Journey
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{form.journeyFromOptInToClose}</p>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Tag Conventions */}
            <AccordionItem value="tags" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Tag Conventions
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Lead Readiness Tags" value={form.leadReadinessTags} />
                <FieldRow label="Tracking Tags" value={form.trackingTags} />
                <FieldRow label="DNC Tag Name" value={form.dncTagName} />
                <FieldRow label="Tags to Never Dial" value={form.tagsToNeverDial} />
              </AccordionContent>
            </AccordionItem>

            {/* 7. Lead Sources & Routing */}
            <AccordionItem value="lead-sources" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Lead Sources & Routing
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Lead Sources Used" value={form.leadSourcesUsed} />
                <FieldRow label="Include Aged Leads?" value={<StatusBadge value={form.includeAgedLeads} />} />
                <FieldRow label="Aged Leads Date Range" value={form.agedLeadsDateRange} />
                <FieldRow label="Aged Leads Count" value={form.agedLeadsCount} />
              </AccordionContent>
            </AccordionItem>

            {/* 8. Twilio & Numbers Setup */}
            <AccordionItem value="twilio" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Twilio & Numbers Setup
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Twilio Account Created?" value={<StatusBadge value={form.twilioAccountCreated} />} />
                <FieldRow label="Developer Access Given?" value={<StatusBadge value={form.developerAccessGiven} />} />
                <FieldRow label="Primary Business Profile Complete?" value={<StatusBadge value={form.primaryBusinessProfileComplete} />} />
                <FieldRow label="Messaging Path" value={form.messagingPath} />
                <FieldRow label="A2P Registration?" value={<StatusBadge value={form.a2pRegistration} />} />
              </AccordionContent>
            </AccordionItem>

            {/* 9. Local Presence Settings */}
            <AccordionItem value="local-presence" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Local Presence Settings
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Purchase Matching Area Code Numbers?" value={<StatusBadge value={form.purchaseMatchingAreaCodeNumbers} />} />
                <FieldRow label="Outbound Number Count/Location" value={form.outboundNumberCountPerLocation} />
                <FieldRow label="CNAM Caller ID Text" value={form.cnamCallerIdText} />
                <FieldRow label="Known Spam Issues" value={form.knownSpamIssues} />
              </AccordionContent>
            </AccordionItem>

            {/* 10. Call Center Operations */}
            <AccordionItem value="call-center" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Call Center Operations
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Number of Agents" value={`${form.numberOfAgentsNow} now / ${form.numberOfAgentsTarget} target (90 days)`} />
                <FieldRow label="Working Hours Window" value={form.workingHoursWindow} />
                <FieldRow label="Call Cadence SOP" value={form.callCadenceSop} />
                <FieldRow label="Attempts Per Lead" value={`${form.attemptsPerLeadLifetime} lifetime / ${form.attemptsPerLeadPerDay} per day`} />
                <FieldRow label="Min Hours Between Attempts" value={form.minHoursBetweenAttempts} />
                <FieldRow label="Double-Dial?" value={<StatusBadge value={form.doubleDial} />} />
                <FieldRow label="Leave Voicemail?" value={<StatusBadge value={form.leaveVoicemail} />} />
              </AccordionContent>
            </AccordionItem>

            {/* 11. Messaging & Content */}
            <AccordionItem value="messaging" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Messaging & Content
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Sales Script Source" value={form.salesScriptSource} />
                <FieldRow label="Uploaded Files" value={form.uploadedFiles.length > 0 ? form.uploadedFiles.join(', ') : 'None'} />
                <FieldRow label="Rebuttal Library Location" value={form.rebuttalLibraryLocation} />
                <FieldRow label="SMS Templates to Import" value={form.smsTemplatesToImport} />
                <FieldRow label="Email Templates to Import" value={form.emailTemplatesToImport} />
              </AccordionContent>
            </AccordionItem>

            {/* 12. Dispositions & Routing */}
            <AccordionItem value="dispositions" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Dispositions & Routing
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Custom Statuses to Track" value={form.customStatusesToTrack} />
                <FieldRow label="Inbound Call Routing" value={form.inboundCallRouting} />
                <FieldRow label="After Hours Plan" value={form.afterHoursPlan} />
              </AccordionContent>
            </AccordionItem>

            {/* 13. Reporting & Integrations */}
            <AccordionItem value="reporting" className="border border-border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                Reporting & Integrations
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <FieldRow label="Metrics Needing Improvement" value={form.metricsNeedingImprovement} />
                <FieldRow label="Conversation Intelligence Setup?" value={<StatusBadge value={form.conversationIntelligenceSetup} />} />
                <FieldRow label="AI Summaries in Notes?" value={<StatusBadge value={form.aiSummariesInNotes} />} />
                <FieldRow label="Speed to Lead Webhooks?" value={<StatusBadge value={form.speedToLeadWebhooks} />} />
                <FieldRow label="Slack Notifications?" value={<StatusBadge value={form.slackNotifications} />} />
                <FieldRow label="Zapier/Make Flows" value={form.zapierMakeFlows} />
                <FieldRow label="Other CRM Integrations" value={form.otherCrmIntegrations} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
