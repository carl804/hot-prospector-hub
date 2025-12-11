import { useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { isToday, isTomorrow, isPast, startOfDay, isThisWeek, format } from 'date-fns';
import { AlertTriangle, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
}

interface TaskGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  className?: string;
}

export function TaskListView({ tasks, onTaskClick, onToggleTask }: TaskListViewProps) {
  const groupedTasks = useMemo(() => {
    const groups: TaskGroup[] = [];

    const overdue = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });

    const today = tasks.filter(
      (t) => t.status !== 'completed' && isToday(new Date(t.dueDate))
    );

    const tomorrow = tasks.filter(
      (t) => t.status !== 'completed' && isTomorrow(new Date(t.dueDate))
    );

    const thisWeek = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return (
        isThisWeek(dueDate) &&
        !isToday(dueDate) &&
        !isTomorrow(dueDate) &&
        !isPast(startOfDay(dueDate))
      );
    });

    const later = tasks.filter((t) => {
      if (t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return !isThisWeek(dueDate) && !isPast(startOfDay(dueDate));
    });

    const completed = tasks
      .filter((t) => t.status === 'completed')
      .slice(0, 10);

    if (overdue.length > 0) {
      groups.push({
        id: 'overdue',
        title: 'Overdue',
        icon: <AlertTriangle className="w-4 h-4" />,
        tasks: overdue,
        className: 'text-destructive',
      });
    }

    if (today.length > 0) {
      groups.push({
        id: 'today',
        title: 'Due Today',
        icon: <Clock className="w-4 h-4" />,
        tasks: today,
        className: 'text-primary',
      });
    }

    if (tomorrow.length > 0) {
      groups.push({
        id: 'tomorrow',
        title: 'Tomorrow',
        icon: <Calendar className="w-4 h-4" />,
        tasks: tomorrow,
      });
    }

    if (thisWeek.length > 0) {
      groups.push({
        id: 'thisWeek',
        title: 'This Week',
        icon: <Calendar className="w-4 h-4" />,
        tasks: thisWeek,
      });
    }

    if (later.length > 0) {
      groups.push({
        id: 'later',
        title: 'Later',
        icon: <Calendar className="w-4 h-4" />,
        tasks: later,
        className: 'text-muted-foreground',
      });
    }

    if (completed.length > 0) {
      groups.push({
        id: 'completed',
        title: 'Recently Completed',
        icon: <CheckCircle2 className="w-4 h-4" />,
        tasks: completed,
        className: 'text-success',
      });
    }

    return groups;
  }, [tasks]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {groupedTasks.map((group) => (
        <div key={group.id}>
          <div className={cn('flex items-center gap-2 mb-3', group.className || 'text-foreground')}>
            {group.icon}
            <h3 className="font-medium">{group.title}</h3>
            <span className="text-sm opacity-60">({group.tasks.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => onToggleTask(task.id)}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </div>
      ))}

      {groupedTasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">No tasks found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
