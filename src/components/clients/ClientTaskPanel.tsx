import { useState, useMemo } from 'react';
import { X, Plus, Mail, Phone, Calendar, CheckCircle2, Clock, AlertTriangle, FileText, Bell, Send } from 'lucide-react';
import { format, isToday, isPast, isTomorrow, startOfDay } from 'date-fns';
import { Client, CSM_LIST } from '@/types/client';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ClientTaskPanelProps {
  client: Client;
  tasks: Task[];
  onClose: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onViewIntakeForm: () => void;
  onNotifyCSM: (type: 'draft' | 'complete') => void;
  onUpdateClient: (client: Client) => void;
}

export function ClientTaskPanel({
  client,
  tasks,
  onClose,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onViewIntakeForm,
  onNotifyCSM,
  onUpdateClient,
}: ClientTaskPanelProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('ghl');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const csm = CSM_LIST.find((c) => c.id === client.assignedCsmId);

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

  const handleNotify = (type: 'draft' | 'complete') => {
    onNotifyCSM(type);
    toast({
      title: type === 'draft' ? 'Draft Build Notification Sent' : 'Setup Complete Notification Sent',
      description: `${csm?.name} has been notified via email.`,
    });
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
      <div className="fixed right-0 top-0 h-full w-[540px] bg-card border-l border-border shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{client.contactName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-1.5 hover:text-primary">
              <Mail className="w-3.5 h-3.5" />
              {client.contactEmail}
            </a>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {client.contactPhone}
            </span>
          </div>

          {/* CSM Assignment */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Assigned CSM:</span>
              {csm && (
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-primary-foreground', csm.color)}>
                    {csm.initials}
                  </div>
                  <span className="text-sm font-medium">{csm.name}</span>
                </div>
              )}
            </div>
            <Select
              value={client.assignedCsmId}
              onValueChange={(value) => onUpdateClient({ ...client, assignedCsmId: value })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                <SelectValue placeholder="Change CSM" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {CSM_LIST.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Booking Status */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={cn(
              'p-3 rounded-lg border',
              client.assessmentBooked ? 'bg-success/5 border-success/20' : 'bg-secondary/50 border-border'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={cn('w-4 h-4', client.assessmentBooked ? 'text-success' : 'text-muted-foreground')} />
                <span className="text-xs font-medium">Assessment</span>
              </div>
              {client.assessmentBooked && client.assessmentDate ? (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(client.assessmentDate), 'MMM d, yyyy h:mm a')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60">Not Booked</p>
              )}
            </div>
            <div className={cn(
              'p-3 rounded-lg border',
              client.onboardingBooked ? 'bg-success/5 border-success/20' : 'bg-secondary/50 border-border'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className={cn('w-4 h-4', client.onboardingBooked ? 'text-success' : 'text-muted-foreground')} />
                <span className="text-xs font-medium">Onboarding</span>
              </div>
              {client.onboardingBooked && client.onboardingDate ? (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(client.onboardingDate), 'MMM d, yyyy h:mm a')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60">Not Booked</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={onViewIntakeForm} className="flex-1 gap-2">
              <FileText className="w-4 h-4" />
              View Intake Form
            </Button>
          </div>

          {/* Notify CSM Buttons */}
          <div className="flex gap-2">
            <Button
              variant={client.draftBuildNotified ? 'secondary' : 'default'}
              size="sm"
              onClick={() => handleNotify('draft')}
              disabled={client.draftBuildNotified}
              className="flex-1 gap-2"
            >
              {client.draftBuildNotified ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Draft Notified
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Notify: Draft Ready
                </>
              )}
            </Button>
            <Button
              variant={client.setupCompleteNotified ? 'secondary' : 'default'}
              size="sm"
              onClick={() => handleNotify('complete')}
              disabled={client.setupCompleteNotified}
              className="flex-1 gap-2"
            >
              {client.setupCompleteNotified ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Setup Notified
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Notify: Setup Complete
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          <div className="bg-secondary/50 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Task Progress</span>
              <span className="text-xs font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-success' : 'bg-primary')}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{completedTasks} of {tasks.length} tasks complete</p>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 kanban-scrollbar">
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
