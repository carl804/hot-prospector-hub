import { Clock, AlertCircle, Building2 } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { Task, Priority } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
  onUpdatePriority?: (taskId: string, priority: Priority) => void;
}

export function TaskCard({ task, onToggleComplete, onClick, onUpdatePriority }: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate) && !isCompleted;

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'medium':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'low':
        return 'bg-green-500 text-white hover:bg-green-600';
    }
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdatePriority) return;
    
    const priorities: Priority[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    onUpdatePriority(task.id, nextPriority);
  };

  const getDueDateLabel = () => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isOverdue) {
      const days = Math.abs(differenceInDays(dueDate, new Date()));
      return `${days}d overdue`;
    }
    return format(dueDate, 'MMM d');
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 bg-card rounded-lg border border-border',
        'transition-all duration-200 hover:shadow-card-hover hover:border-primary/20',
        isCompleted && 'opacity-60'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggleComplete(task.id)}
        className="mt-0.5 h-5 w-5 rounded-full"
      />

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClick(task)}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3
            className={cn(
              'font-medium text-foreground text-sm leading-tight',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h3>

          <button
            onClick={cyclePriority}
            className={cn(
              'shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wide',
              'transition-colors duration-200 cursor-pointer',
              getPriorityStyles(task.priority)
            )}
            title="Click to change priority"
          >
            {task.priority}
          </button>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Client */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{task.clientName}</span>
          </div>

          {/* Due date */}
          <div
            className={cn(
              'flex items-center gap-1 text-xs ml-auto',
              isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
            )}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            <span>{getDueDateLabel()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}