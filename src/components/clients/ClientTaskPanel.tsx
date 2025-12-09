import { useState, useMemo } from 'react';
import { X, Plus, Mail, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, isToday, isPast, isTomorrow, startOfDay, isThisWeek } from 'date-fns';
import { Client } from '@/types/client';
import { Task, TASK_CATEGORIES, Priority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ClientTaskPanelProps {
  client: Client;
  tasks: Task[];
  onClose: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
}

export function ClientTaskPanel({
  client,
  tasks,
  onClose,
  onToggleTask,
  onAddTask,
  onUpdateTask,
}: ClientTaskPanelProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('ghl');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Group tasks
  const groupedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach((task) => {
      if (task.status === 'completed') {
        completed.push(task);
        return;
      }

      const dueDate = startOfDay(new Date(task.dueDate));
      const now = startOfDay(new Date());

      if (isPast(dueDate) && !isToday(dueDate)) {
        overdue.push(task);
      } else if (isToday(dueDate)) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    const sortByPriority = (a: Task, b: Task) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    };

    return {
      overdue: overdue.sort(sortByPriority),
      today: today.sort(sortByPriority),
      upcoming: upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      completed: completed.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()),
    };
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle.trim(),
      clientId: client.id,
      clientName: client.name,
      dueDate: new Date(newTaskDueDate).toISOString(),
      priority: newTaskPriority,
      status: 'todo',
      category: newTaskCategory,
    });

    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-badge-red-bg text-badge-red-text';
      case 'medium': return 'bg-badge-yellow-bg text-badge-yellow-text';
      case 'low': return 'bg-badge-gray-bg text-badge-gray-text';
    }
  };

  const renderTask = (task: Task) => {
    const category = TASK_CATEGORIES.find((c) => c.id === task.category);
    const isCompleted = task.status === 'completed';
    const dueDate = new Date(task.dueDate);
    const isOverdue = isPast(dueDate) && !isToday(dueDate) && !isCompleted;

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border border-border bg-background',
          'transition-all duration-200 hover:border-primary/20',
          isCompleted && 'opacity-60'
        )}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleTask(task.id)}
          className="mt-0.5 h-5 w-5 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={cn(
              'text-sm font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </span>
            <span className={cn(
              'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded uppercase',
              getPriorityStyles(task.priority)
            )}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {category && (
              <div className="flex items-center gap-1">
                <div className={cn('w-2 h-2 rounded-full', category.color)} />
                <span>{category.name}</span>
              </div>
            )}
            <div className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-destructive'
            )}>
              {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              <span>
                {isToday(dueDate) ? 'Today' : 
                 isTomorrow(dueDate) ? 'Tomorrow' : 
                 format(dueDate, 'MMM d')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[520px] bg-card border-l border-border shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>{client.contactName}</span>
                <span>·</span>
                <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-1 hover:text-primary">
                  <Mail className="w-3 h-3" />
                  {client.contactEmail}
                </a>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Setup Progress</span>
              <span className="text-sm font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress === 100 ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{completedTasks} of {tasks.length} tasks complete</span>
              {progress === 100 && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 kanban-scrollbar">
          {/* Overdue */}
          {groupedTasks.overdue.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue ({groupedTasks.overdue.length})
              </h3>
              <div className="space-y-2">
                {groupedTasks.overdue.map(renderTask)}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedTasks.today.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Due Today ({groupedTasks.today.length})
              </h3>
              <div className="space-y-2">
                {groupedTasks.today.map(renderTask)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {groupedTasks.upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Upcoming ({groupedTasks.upcoming.length})
              </h3>
              <div className="space-y-2">
                {groupedTasks.upcoming.map(renderTask)}
              </div>
            </div>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Completed ({groupedTasks.completed.length})
              </h3>
              <div className="space-y-2">
                {groupedTasks.completed.map(renderTask)}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No tasks yet</p>
              <p className="text-sm">Add tasks to track this client's setup</p>
            </div>
          )}
        </div>

        {/* Add Task */}
        <div className="p-5 border-t border-border">
          {showAddTask ? (
            <div className="space-y-3">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                className="bg-background"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                  <SelectTrigger className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                  <SelectTrigger className="bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {TASK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="bg-background text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddTask(false)} className="flex-1">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddTask} className="flex-1" disabled={!newTaskTitle.trim()}>
                  Add Task
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowAddTask(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
