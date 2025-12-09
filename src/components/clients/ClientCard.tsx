import { Building2, CheckCircle2, Clock, AlertTriangle, ChevronRight, Calendar, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { Client, CSM_LIST, PIPELINE_STAGES } from '@/types/client';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';

interface ClientCardProps {
  client: Client;
  tasks: Task[];
  onClick: () => void;
}

export function ClientCard({ client, tasks, onClick }: ClientCardProps) {
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
        'group bg-card rounded-xl border border-border p-5 cursor-pointer',
        'transition-all duration-200 hover:shadow-card-hover hover:border-primary/20',
        isComplete && 'opacity-70'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isComplete ? 'bg-success/10' : 'bg-primary/10'
          )}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Building2 className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {client.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.contactName}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* CSM Badge */}
      {csm && (
        <div className="flex items-center gap-2 mb-3">
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-primary-foreground', csm.color)}>
            {csm.initials}
          </div>
          <span className="text-xs text-muted-foreground">{csm.name}</span>
        </div>
      )}

      {/* Pipeline Stage & Booking Status Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Pipeline Stage */}
        {stage && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-badge-blue-bg text-badge-blue-text">
            <GitBranch className="w-3 h-3" />
            {stage.label}
          </span>
        )}

        {/* Booking Status */}
        <div className={cn(
          'flex items-center gap-1 text-[10px] px-2 py-1 rounded-full',
          client.assessmentBooked ? 'bg-badge-green-bg text-badge-green-text' : 'bg-secondary text-muted-foreground/60'
        )}>
          {client.assessmentBooked ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span>Assessment</span>
        </div>
        <div className={cn(
          'flex items-center gap-1 text-[10px] px-2 py-1 rounded-full',
          client.onboardingBooked ? 'bg-badge-green-bg text-badge-green-text' : 'bg-secondary text-muted-foreground/60'
        )}>
          {client.onboardingBooked ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span>Onboarding</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{completedTasks}/{totalTasks} tasks</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isComplete ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {overdueTasks > 0 && (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{overdueTasks} overdue</span>
          </div>
        )}
        {dueTodayTasks > 0 && (
          <div className="flex items-center gap-1.5 text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{dueTodayTasks} due today</span>
          </div>
        )}
        {overdueTasks === 0 && dueTodayTasks === 0 && !isComplete && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{totalTasks - completedTasks} remaining</span>
          </div>
        )}
        {isComplete && (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Setup Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
