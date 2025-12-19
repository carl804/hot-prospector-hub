import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, differenceInDays } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import { Opportunity, CSM } from '@/types/opportunity';
import { cn } from '@/lib/utils';
import { NotesIndicator } from '@/components/notes/NotesIndicator';
import { NotesModal } from '@/components/notes/NotesModal';

interface OpportunityCardProps {
  opportunity: Opportunity;
  csm: CSM | undefined;
  onClick: () => void;
  contactId?: string;
}

export function OpportunityCard({ opportunity, csm, onClick, contactId }: OpportunityCardProps) {
  const [showNotesModal, setShowNotesModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const daysUntilDeadline = differenceInDays(new Date(opportunity.deadline), new Date());

  const handleNotesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotesModal(true);
  };
  
  const getDeadlineBadgeClass = () => {
    if (daysUntilDeadline < 0) return 'bg-badge-red-bg text-badge-red-text';
    if (daysUntilDeadline <= 3) return 'bg-badge-red-bg text-badge-red-text';
    if (daysUntilDeadline <= 7) return 'bg-badge-yellow-bg text-badge-yellow-text';
    return 'bg-badge-green-bg text-badge-green-text';
  };

  const completedTasks = opportunity.tasks.filter((t) => t.completed).length;
  const totalTasks = opportunity.tasks.length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg p-4 cursor-pointer border border-border',
        'transition-all duration-200 ease-out',
        'hover:shadow-card-hover hover:border-primary/20',
        isDragging && 'shadow-card-dragging opacity-90 rotate-2 scale-105 z-50'
      )}
    >
      {/* Header with Agency Name and Notes */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-foreground text-sm truncate flex-1">
          {opportunity.agencyName}
        </h3>
        {contactId && (
          <NotesIndicator
            contactId={contactId}
            onClick={handleNotesClick}
            className="ml-2 -mr-1 -mt-0.5"
          />
        )}
      </div>

      {/* Contact Name */}
      <p className="text-xs text-muted-foreground mb-3">
        {opportunity.contactFirstName} {opportunity.contactLastName}
      </p>

      {/* CSM and Deadline Row */}
      <div className="flex items-center justify-between mb-3">
        {csm && (
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-primary-foreground',
              csm.color
            )}
            title={csm.name}
          >
            {csm.initials}
          </div>
        )}
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', getDeadlineBadgeClass())}>
          {daysUntilDeadline < 0
            ? `${Math.abs(daysUntilDeadline)}d overdue`
            : daysUntilDeadline === 0
            ? 'Today'
            : `${daysUntilDeadline}d left`}
        </span>
      </div>

      {/* Status Indicators */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-[11px]">
          {opportunity.assessmentBooked ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span className="text-muted-foreground">
                Assessment: {format(new Date(opportunity.assessmentDate!), 'MMM d')}
              </span>
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-muted-foreground/60">Assessment</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {opportunity.onboardingBooked ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-success" />
              <span className="text-muted-foreground">
                Onboarding: {format(new Date(opportunity.onboardingDate!), 'MMM d')}
              </span>
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-muted-foreground/60">Onboarding</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              opportunity.ghlAccessReady ? 'bg-success' : 'bg-destructive'
            )}
          />
          <span className="text-muted-foreground">GHL Access</span>
        </div>
      </div>

      {/* Task Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${taskProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {completedTasks}/{totalTasks}
        </span>
      </div>

      {/* Notes Modal */}
      {showNotesModal && contactId && (
        <NotesModal
          contactId={contactId}
          clientName={opportunity.agencyName}
          onClose={() => setShowNotesModal(false)}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
        />
      )}
    </div>
  );
}
