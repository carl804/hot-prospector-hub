import { useState } from 'react';
import { Building2, CheckCircle2, Clock, AlertTriangle, ChevronRight, Calendar, GitBranch } from 'lucide-react';
import { Client, CSM_LIST, PIPELINE_STAGES } from '@/types/client';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';
import { NotesIndicator } from '@/components/notes/NotesIndicator';
import { NotesModal } from '@/components/notes/NotesModal';

interface ClientCardProps {
  client: Client;
  tasks: Task[];
  onClick: () => void;
  contactId?: string;
}

export function ClientCard({ client, tasks, onClick, contactId }: ClientCardProps) {
  const [showNotesModal, setShowNotesModal] = useState(false);

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

  const handleNotesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotesModal(true);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-card rounded-xl border border-border/50 p-5 cursor-pointer',
        'transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 hover:-translate-y-0.5',
        isComplete && 'opacity-70'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shadow-sm',
            isComplete
              ? 'bg-gradient-to-br from-success/20 to-success/10'
              : 'bg-gradient-to-br from-primary/20 to-primary/10'
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
        <div className="flex items-center gap-1">
          {contactId && (
            <NotesIndicator
              contactId={contactId}
              onClick={handleNotesClick}
            />
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* CSM Badge */}
      {csm && (
        <div className="flex items-center gap-2.5 mb-4">
          <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold text-primary-foreground shadow-sm',
            csm.color
          )}>
            {csm.initials}
          </div>
          <span className="text-xs text-muted-foreground">{csm.name}</span>
        </div>
      )}

      {/* Pipeline Stage & Booking Status Row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Pipeline Stage */}
        {stage && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <GitBranch className="w-3 h-3" />
            {stage.label}
          </span>
        )}

        {/* Booking Status */}
        <div className={cn(
          'flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border',
          client.assessmentBooked
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-muted text-muted-foreground/60 border-border'
        )}>
          {client.assessmentBooked ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span>Assessment</span>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border',
          client.onboardingBooked
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-muted text-muted-foreground/60 border-border'
        )}>
          {client.onboardingBooked ? <CheckCircle2 className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          <span>Onboarding</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold text-foreground">{completedTasks}/{totalTasks} tasks</span>
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
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive">{overdueTasks} overdue</span>
          </div>
        )}
        {dueTodayTasks > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{dueTodayTasks} due today</span>
          </div>
        )}
        {overdueTasks === 0 && dueTodayTasks === 0 && !isComplete && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{totalTasks - completedTasks} remaining</span>
          </div>
        )}
        {isComplete && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-success/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-semibold text-success">Setup Complete</span>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && contactId && (
        <NotesModal
          contactId={contactId}
          clientName={client.name}
          onClose={() => setShowNotesModal(false)}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
        />
      )}
    </div>
  );
}
