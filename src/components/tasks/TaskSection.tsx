import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  emptyMessage?: string;
  variant?: 'default' | 'overdue' | 'completed';
  onToggleComplete: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskSection({
  title,
  tasks,
  emptyMessage = 'No tasks',
  variant = 'default',
  onToggleComplete,
  onTaskClick,
}: TaskSectionProps) {
  const getHeaderStyles = () => {
    switch (variant) {
      case 'overdue':
        return 'text-destructive';
      case 'completed':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={cn('text-sm font-semibold', getHeaderStyles())}>
          {title}
        </h2>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onClick={onTaskClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
