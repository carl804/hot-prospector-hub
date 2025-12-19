import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, differenceInDays } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import { Opportunity, CSM } from '@/types/opportunity';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
  csm: CSM | undefined;
  onClick: () => void;
}

export function OpportunityCard({ opportunity, csm, onClick }: OpportunityCardProps) {
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

  const getDeadlineBadgeClass = () => {
    if (daysUntilDeadline < 0) return 'bg-destructive/15 text-destructive border-destructive/20';
    if (daysUntilDeadline <= 3) return 'bg-destructive/15 text-destructive border-destructive/20';
    if (daysUntilDeadline <= 7) return 'bg-warning/15 text-warning border-warning/20';
    return 'bg-success/15 text-success border-success/20';
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
        'group bg-card rounded-xl p-4 cursor-pointer border border-border/50',
        'transition-all duration-200 ease-out',
        'hover:shadow-card-hover hover:border-primary/20 hover:-translate-y-0.5',
        isDragging && 'shadow-card-dragging opacity-95 rotate-1 scale-[1.02] z-50'
      )}
    >
      {/* Header with Agency Name */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight truncate flex-1 pr-2">
          {opportunity.agencyName}
        </h3>
      </div>

      {/* Contact Name */}
      <p className="text-xs text-muted-foreground mb-3">
        {opportunity.contactFirstName} {opportunity.contactLastName}
      </p>

      {/* CSM and Deadline Row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        {csm && (
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold text-primary-foreground shadow-sm',
              csm.color
            )}
            title={csm.name}
          >
            {csm.initials}
          </div>
        )}
        <span className={cn(
          'text-[10px] font-semibold px-2.5 py-1 rounded-full border',
          getDeadlineBadgeClass()
        )}>
          {daysUntilDeadline < 0
            ? `${Math.abs(daysUntilDeadline)}d overdue`
            : daysUntilDeadline === 0
              ? 'Today'
              : `${daysUntilDeadline}d left`}
        </span>
      </div>

      {/* Status Indicators */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2.5 text-[11px]">
          {opportunity.assessmentBooked ? (
            <>
              <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-success" />
              </div>
              <span className="text-muted-foreground">
                Assessment: {format(new Date(opportunity.assessmentDate!), 'MMM d')}
              </span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                <Circle className="w-3 h-3 text-muted-foreground/50" />
              </div>
              <span className="text-muted-foreground/50">Assessment</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px]">
          {opportunity.onboardingBooked ? (
            <>
              <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-success" />
              </div>
              <span className="text-muted-foreground">
                Onboarding: {format(new Date(opportunity.onboardingDate!), 'MMM d')}
              </span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                <Circle className="w-3 h-3 text-muted-foreground/50" />
              </div>
              <span className="text-muted-foreground/50">Onboarding</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px]">
          <div
            className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center',
              opportunity.ghlAccessReady ? 'bg-success/15' : 'bg-destructive/15'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                opportunity.ghlAccessReady ? 'bg-success' : 'bg-destructive'
              )}
            />
          </div>
          <span className={cn(
            'text-muted-foreground',
            !opportunity.ghlAccessReady && 'text-muted-foreground/50'
          )}>
            GHL Access
          </span>
        </div>
      </div>

      {/* Task Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className="text-[10px] font-semibold text-foreground">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              taskProgress === 100 ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${taskProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
