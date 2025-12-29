import { useMemo } from 'react';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { useContactCustomFields } from '@/hooks/useContactCustomFields';
import { ALL_PIPELINE_IDS, getPipelineName } from '@/config/pipelines';

// GHL Custom Field Keys for booking dates
const GHL_FIELD_KEYS = {
  assessmentBooked: 'contact.assessment_call_booked',
  assessmentDate: 'contact.assessment_call_booked_date',
  onboardingBooked: 'contact.onboarding_call_booked',
  onboardingDate: 'contact.onboarding_call_booked_date',
  kickoffBooked: 'contact.kickoff_call_booked',
  kickoffDate: 'contact.kickoff_call_booked_date',
};

export type AppointmentType = 'assessment' | 'onboarding' | 'kickoff';

export interface CalendarAppointment {
  id: string;
  contactId: string;
  opportunityId: string;
  clientName: string;
  contactEmail: string;
  appointmentType: AppointmentType;
  date: Date;
  dateString: string;
  booked: boolean;
  pipelineId: string;
  pipelineName: string;
}

// Helper to check if a value is truthy for "booked" status
function isFieldTrue(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1';
  }
  return false;
}

// Parse date string from GHL (handles various formats)
function parseGHLDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  // Try parsing as ISO string or other common formats
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;

  return date;
}

export function useCalendarAppointments() {
  const { data: opportunitiesData, isLoading: isLoadingOpps } = useGHLOpportunities({ limit: 100 });

  // Extract contact IDs from opportunities in ALL tracked pipelines
  const { basicData, contactIds } = useMemo(() => {
    const allOpps = ((opportunitiesData as any)?.opportunities || []);
    // Filter to include opportunities from both Account Setup AND Onboarding pipelines
    const filtered = allOpps.filter((opp: any) =>
      ALL_PIPELINE_IDS.includes(opp.pipelineId)
    );

    const ids: string[] = [];
    const seenContactIds = new Set<string>(); // Avoid duplicates if contact is in multiple pipelines

    const data = filtered.map((opp: any) => {
      const contact = opp.contact;
      const contactId = contact?.id || opp.contactId || null;
      if (contactId && !seenContactIds.has(contactId)) {
        seenContactIds.add(contactId);
        ids.push(contactId);
      }

      return {
        opportunityId: opp.id,
        contactId,
        clientName: opp.name,
        contactEmail: contact?.email || '',
        pipelineId: opp.pipelineId,
      };
    });

    return { basicData: data, contactIds: ids };
  }, [opportunitiesData]);

  // Fetch custom fields for all contacts
  const { customFieldsMap, isLoading: isLoadingCustomFields } = useContactCustomFields(contactIds);

  // Build appointments array from custom fields
  const appointments = useMemo(() => {
    const result: CalendarAppointment[] = [];

    basicData.forEach((client) => {
      if (!client.contactId) return;

      const customFields = customFieldsMap.get(client.contactId);
      if (!customFields) return;

      // Helper to get value from custom fields
      const getValue = (fieldKey: string) => {
        const field = customFields.find((f: any) => {
          const fKey = f.fieldKey || f.key || '';
          return fKey === fieldKey || fKey.toLowerCase() === fieldKey.toLowerCase();
        });
        return field?.value ?? null;
      };

      // Check each appointment type
      const appointmentTypes: { type: AppointmentType; bookedKey: string; dateKey: string }[] = [
        { type: 'assessment', bookedKey: GHL_FIELD_KEYS.assessmentBooked, dateKey: GHL_FIELD_KEYS.assessmentDate },
        { type: 'onboarding', bookedKey: GHL_FIELD_KEYS.onboardingBooked, dateKey: GHL_FIELD_KEYS.onboardingDate },
        { type: 'kickoff', bookedKey: GHL_FIELD_KEYS.kickoffBooked, dateKey: GHL_FIELD_KEYS.kickoffDate },
      ];

      appointmentTypes.forEach(({ type, bookedKey, dateKey }) => {
        const booked = isFieldTrue(getValue(bookedKey));
        const dateValue = getValue(dateKey);
        const date = parseGHLDate(dateValue);

        // Only include if there's a date (booked or not)
        if (date) {
          result.push({
            id: `${client.contactId}-${type}`,
            contactId: client.contactId,
            opportunityId: client.opportunityId,
            clientName: client.clientName,
            contactEmail: client.contactEmail,
            appointmentType: type,
            date,
            dateString: dateValue,
            booked,
            pipelineId: client.pipelineId,
            pipelineName: getPipelineName(client.pipelineId),
          });
        }
      });
    });

    // Sort by date
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  }, [basicData, customFieldsMap]);

  // Group appointments by date (for calendar view)
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();

    appointments.forEach((apt) => {
      const dateKey = apt.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const existing = map.get(dateKey) || [];
      existing.push(apt);
      map.set(dateKey, existing);
    });

    return map;
  }, [appointments]);

  return {
    appointments,
    appointmentsByDate,
    isLoading: isLoadingOpps || isLoadingCustomFields,
    totalCount: appointments.length,
  };
}
