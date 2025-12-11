import { useState, useMemo } from 'react';
import { Search, LayoutGrid, List, Plus, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus, TASK_CATEGORIES } from '@/types/task';
import { MOCK_TASKS } from '@/data/taskData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskKanbanBoard } from '@/components/tasks/TaskKanbanBoard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';

type ViewMode = 'kanban' | 'list';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchQuery, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    const overdueTasks = activeTasks.filter((t) => {
      const dueDate = startOfDay(new Date(t.dueDate));
      return isPast(dueDate) && !isToday(dueDate);
    });
    const dueTodayTasks = activeTasks.filter((t) => isToday(new Date(t.dueDate)));
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return {
      total: activeTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      completed: completedTasks.length,
    };
  }, [tasks]);

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'todo' : 'completed',
              completedAt: task.status === 'completed' ? undefined : new Date().toISOString(),
            }
          : task
      )
    );
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
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
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
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

        {/* Stats */}
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

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

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

          <div className="flex items-center border border-border rounded-lg overflow-hidden">
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
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <TaskKanbanBoard
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onTaskClick={setSelectedTask}
            onToggleTask={handleToggleTask}
          />
        )}
      </div>

      {/* Task Detail */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />
      )}
    </div>
  );
}
