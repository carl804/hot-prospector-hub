import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  CalendarIcon,
  X,
  Flag,
  Trash2,
} from 'lucide-react';
import { Task, TaskStatus, TASK_CATEGORIES, Priority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TaskKanbanBoard } from '@/components/tasks/TaskKanbanBoard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay, isWithinInterval, format, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { usePipelineTasks, useCompleteGHLTask, useUpdateGHLTask } from '@/hooks/useGHLTasks';

type ViewMode = 'kanban' | 'list';

const TARGET_PIPELINE_ID = "QNloaHE61P6yedF6jEzk"; // 002. Account Setup

export default function Tasks() {
  // ⭐ FETCH REAL TASKS FROM GHL
  const { data: tasksData = [], isLoading, refetch } = usePipelineTasks(TARGET_PIPELINE_ID);
  const [tasks, setTasks] = useState<Task[]>([]);

  // ⭐ GHL MUTATION HOOKS
  const completeTaskMutation = useCompleteGHLTask();
  const updateTaskMutation = useUpdateGHLTask();

  // Update tasks when data loads
  useEffect(() => {
    if (tasksData.length > 0) {
      setTasks(tasksData);
    }
  }, [tasksData]);

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>();

  // Get unique clients from tasks
  const clients = useMemo(() => {
    const clientMap = new Map<string, { id: string; name: string }>();
    tasks.forEach((task) => {
      if (!clientMap.has(task.clientId)) {
        clientMap.set(task.clientId, { id: task.clientId, name: task.clientName });
      }
    });
    return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      const matchesClient = clientFilter === 'all' || task.clientId === clientFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      let matchesDateRange = true;
      if (dateRange?.from && task.dueDate) {
        const taskDate = new Date(task.dueDate);
        if (dateRange.to) {
          matchesDateRange = isWithinInterval(taskDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else {
          matchesDateRange = taskDate >= startOfDay(dateRange.from);
        }
      }

      return matchesSearch && matchesCategory && matchesClient && matchesPriority && matchesDateRange;
    });
  }, [tasks, searchQuery, categoryFilter, clientFilter, priorityFilter, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const overdueTasks = activeTasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });
    const dueTodayTasks = activeTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return {
      total: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
    };
  }, [tasks]);

  // ⭐ SYNC TO GHL: Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.contactId) {
      toast.error('Cannot update task: missing contact information');
      return;
    }

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const isCompleted = newStatus === 'completed';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed: isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    // Sync to GHL
    completeTaskMutation.mutate(
      {
        contactId: task.contactId,
        taskId: task.id,
        completed: isCompleted,
      },
      {
        onError: () => {
          // Revert on error
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? task : t
            )
          );
          toast.error('Failed to update task');
        },
      }
    );
  };

  // ⭐ SYNC TO GHL: Update task status
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.contactId) {
      toast.error('Cannot update task: missing contact information');
      return;
    }

    const isCompleted = newStatus === 'completed';
    const previousTask = { ...task };

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed: isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    // Sync to GHL
    completeTaskMutation.mutate(
      {
        contactId: task.contactId,
        taskId: task.id,
        completed: isCompleted,
      },
      {
        onError: () => {
          // Revert on error
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? previousTask : t
            )
          );
          toast.error('Failed to update task status');
        },
      }
    );
  };

  const handleReorderTasks = (reorderedTaskIds: string[], status: TaskStatus) => {
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.status !== status);
      const reorderedTasks = reorderedTaskIds
        .map((id) => prev.find((t) => t.id === id))
        .filter(Boolean) as Task[];
      return [...otherTasks, ...reorderedTasks];
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(null);
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setShowAddModal(false);
    setPreselectedClientId(undefined);
    toast.success('Task added successfully');
  };

  const handleToggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id)
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
    toast.success(`${selectedTaskIds.size} tasks updated to ${newStatus.replace('_', ' ')}`);
    setSelectedTaskIds(new Set());
  };

  const handleBulkUpdateCategory = (newCategory: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        selectedTaskIds.has(task.id) ? { ...task, category: newCategory } : task
      )
    );
    const categoryName = TASK_CATEGORIES.find((c) => c.id === newCategory)?.name || newCategory;
    toast.success(`${selectedTaskIds.size} tasks updated to ${categoryName}`);
    setSelectedTaskIds(new Set());
  };

  const handleBulkDelete = () => {
    setTasks((prev) => prev.filter((task) => !selectedTaskIds.has(task.id)));
    toast.success(`${selectedTaskIds.size} tasks deleted`);
    setSelectedTaskIds(new Set());
  };

  // ⭐ PRIORITY UPDATE (Local only - GHL doesn't support priority field)
  const handleUpdatePriority = (taskId: string, priority: Priority) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, priority } : task
      )
    );
    // Note: Priority is stored locally only since GHL doesn't have a priority field
  };

  const handleAddTaskForClient = (clientId: string) => {
    setPreselectedClientId(clientId);
    setShowAddModal(true);
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background p-8">
        <div className="mb-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="border-b border-border bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Task Management</h1>
            <p className="text-sm text-muted-foreground">Manage all tasks across clients</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Open Tasks</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div
            className={cn(
              'rounded-lg p-3',
              stats.overdue > 0 ? 'bg-destructive/10' : 'bg-secondary/50'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-2 mb-1',
                stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Overdue</span>
            </div>
            <p
              className={cn(
                'text-2xl font-semibold',
                stats.overdue > 0 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {stats.overdue}
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Due Today</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{stats.dueToday}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-success mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{stats.completed}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All Clients" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Categories</SelectItem>
              {TASK_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal bg-background',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  <span>Due Date Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
              {dateRange && (
                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={clearDateFilter} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Date Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-none gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {selectedTaskIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTaskIds.size === filteredTasks.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-foreground">
                {selectedTaskIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Select onValueChange={handleBulkUpdateStatus}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Set Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={handleBulkUpdateCategory}>
                <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Set Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {TASK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTaskIds(new Set())}
              className="ml-auto h-8"
            >
              Clear Selection
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <TaskKanbanBoard
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onReorderTasks={handleReorderTasks}
            selectedTaskIds={selectedTaskIds}
            onToggleSelectTask={handleToggleSelectTask}
            onUpdatePriority={handleUpdatePriority}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onToggleTask={handleToggleTask}
            selectedTaskIds={selectedTaskIds}
            onToggleSelectTask={handleToggleSelectTask}
            onAddTaskForClient={handleAddTaskForClient}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => {
            setShowAddModal(false);
            setPreselectedClientId(undefined);
          }}
          onAdd={handleAddTask}
          preselectedClientId={preselectedClientId}
        />
      )}
    </div>
  );
}