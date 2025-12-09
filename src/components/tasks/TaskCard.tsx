import { Check, Clock, AlertCircle, Building2 } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { Task, TASK_CATEGORIES, Priority } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onClick }: TaskCardProps) {
  const category = TASK_CATEGORIES.find((c) => c.id === task.category);
  const isCompleted = task.status === 'completed';
  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate) && !isCompleted;

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-badge-red-bg text-badge-red-text';
      case 'medium':
        return 'bg-badge-yellow-bg text-badge-yellow-text';
      case 'low':
        return 'bg-badge-gray-bg text-badge-gray-text';
    }
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

          <span
            className={cn(
              'shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide',
              getPriorityStyles(task.priority)
            )}
          >
            {task.priority}
          </span>
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

          {/* Category */}
          {category && (
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', category.color)} />
              <span className="text-xs text-muted-foreground">{category.name}</span>
            </div>
          )}

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
