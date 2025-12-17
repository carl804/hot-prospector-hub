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
        return 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white';
      case 'medium':
        return 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white';
      case 'low':
        return 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white';
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
        'group relative flex flex-col gap-3 p-4 rounded-xl',
        'backdrop-blur-xl bg-white/80 dark:bg-gray-900/60',
        'border border-gray-200/50 dark:border-gray-700/50',
        'shadow-sm hover:shadow-lg',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:-translate-y-0.5',
        'hover:border-primary/30 dark:hover:border-primary/40',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Header with Checkbox and Priority */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-0.5 h-5 w-5 rounded-full shrink-0"
        />

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onClick(task)}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3
              className={cn(
                'font-semibold text-gray-900 dark:text-gray-50 text-base leading-snug',
                isCompleted && 'line-through text-gray-400 dark:text-gray-500'
              )}
            >
              {task.title}
            </h3>

            <button
              onClick={cyclePriority}
              className={cn(
                'shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider',
                'transition-all duration-200 cursor-pointer',
                'shadow-sm hover:shadow-md',
                'transform hover:scale-105',
                getPriorityStyles(task.priority)
              )}
              title="Click to change priority"
            >
              {task.priority}
            </button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer with Client and Due Date */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            {/* Client */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {task.clientName}
              </span>
            </div>

            {/* Due date */}
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium shrink-0',
                isOverdue
                  ? 'text-red-600 dark:text-red-400'
                  : isToday(dueDate)
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {isOverdue ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="font-semibold">{getDueDateLabel()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}