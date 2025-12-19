import { Building2, CheckCircle2, Clock, AlertTriangle, ChevronRight, Calendar, Layers } from 'lucide-react';
import { Client, CSM_LIST, PIPELINE_STAGES } from '@/types/client';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';
import { NotesIndicator } from '@/components/notes/NotesIndicator';

interface ClientCardProps {
  client: Client & { contactId?: string | null };
  tasks: Task[];
  onClick: () => void;
  onNotesClick: (e: React.MouseEvent) => void;
}

export function ClientCard({ client, tasks, onClick, onNotesClick }: ClientCardProps) {
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const dueDate = startOfDay(new Date(t.dueDate));
    return isPast(dueDate) && !isToday(dueDate);
  }).length;

  const dueTodayTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    return isToday(new Date(t.dueDate));
  }).length;

  const isComplete = client.status === 'completed' || progress === 100;
  const csm = CSM_LIST.find((c) => c.id === client.assignedCsmId);
  const stage = PIPELINE_STAGES.find((s) => s.id === client.pipelineStage);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-2xl border border-border/40 p-5',
        'cursor-pointer transition-all duration-200 ease-out',
        'hover:border-border/80 hover:-translate-y-0.5',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.02),0_1px_2px_-1px_rgb(0_0_0/0.02)]',
        'hover:shadow-[0_8px_16px_-4px_rgb(0_0_0/0.08),0_4px_8px_-4px_rgb(0_0_0/0.04)]',
        'dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.2)]',
        'dark:hover:shadow-[0_8px_24px_-4px_rgb(0_0_0/0.4)]',
        isComplete && 'opacity-70'
      )}
    >
      {/* Top Row: Icon + Name + Actions */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* Client Icon */}
        <div className={cn(
          'relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
          'transition-all duration-200',
          isComplete
            ? 'bg-success/10'
            : 'bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/15 group-hover:to-primary/10'
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Building2 className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Name & Contact */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[15px] leading-tight truncate tracking-tight">
            {client.name}
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {client.contactName}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 -mr-1">
          {client.contactId && (
            <NotesIndicator
              contactId={client.contactId}
              onClick={onNotesClick}
            />
          )}
          <div className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* CSM Badge */}
      {csm && (
        <div className="flex items-center gap-2 mb-4">
          <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white',
            'shadow-sm',
            csm.color
          )}>
            {csm.initials}
          </div>
          <span className="text-[13px] text-muted-foreground">{csm.name}</span>
        </div>
      )}

      {/* Tags Row - Cleaner, more minimal */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {/* Pipeline Stage */}
        {stage && (
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg',
            'bg-primary/8 text-primary'
          )}>
            <Layers className="w-3 h-3 opacity-70" />
            {stage.label}
          </span>
        )}

        {/* Booking Status - Minimal pills */}
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors',
          client.assessmentBooked
            ? 'bg-success/10 text-success'
            : 'bg-muted/80 text-muted-foreground'
        )}>
          {client.assessmentBooked && <CheckCircle2 className="w-3 h-3" />}
          {!client.assessmentBooked && <Calendar className="w-3 h-3 opacity-50" />}
          Assessment
        </span>
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors',
          client.onboardingBooked
            ? 'bg-success/10 text-success'
            : 'bg-muted/80 text-muted-foreground'
        )}>
          {client.onboardingBooked && <CheckCircle2 className="w-3 h-3" />}
          {!client.onboardingBooked && <Calendar className="w-3 h-3 opacity-50" />}
          Onboarding
        </span>
        <span className={cn(
          'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors',
          client.kickoffBooked
            ? 'bg-success/10 text-success'
            : 'bg-muted/80 text-muted-foreground'
        )}>
          {client.kickoffBooked && <CheckCircle2 className="w-3 h-3" />}
          {!client.kickoffBooked && <Calendar className="w-3 h-3 opacity-50" />}
          Kickoff
        </span>
      </div>

      {/* Progress Section - Refined */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-muted-foreground tracking-wide uppercase">Progress</span>
          <span className="text-[13px] font-semibold text-foreground tabular-nums">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        <div className="h-1.5 bg-secondary/80 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              isComplete
                ? 'bg-gradient-to-r from-success to-success/80'
                : 'bg-gradient-to-r from-primary to-primary/80'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Row - Cleaner badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {overdueTasks > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[11px] font-semibold text-destructive">{overdueTasks} overdue</span>
          </div>
        )}
        {dueTodayTasks > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10">
            <Clock className="w-3.5 h-3.5 text-warning" />
            <span className="text-[11px] font-semibold text-warning">{dueTodayTasks} today</span>
          </div>
        )}
        {overdueTasks === 0 && dueTodayTasks === 0 && !isComplete && totalTasks > completedTasks && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[11px] font-medium">{totalTasks - completedTasks} remaining</span>
          </div>
        )}
        {isComplete && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-[11px] font-semibold text-success">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
