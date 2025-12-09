import { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, Filter, Search } from 'lucide-react';
import { isToday, isTomorrow, isPast, isThisWeek, startOfDay } from 'date-fns';
import { Task, TASK_CATEGORIES } from '@/types/task';
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
import { TaskSection } from './TaskSection';
import { TaskDetail } from './TaskDetail';
import { AddTaskModal } from './AddTaskModal';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'active' | 'completed';

export function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && task.status !== 'completed') ||
        (statusFilter === 'completed' && task.status === 'completed');

      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tasks, searchQuery, statusFilter, categoryFilter]);

  // Group tasks by time period
  const groupedTasks = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const thisWeek: Task[] = [];
    const later: Task[] = [];
    const completed: Task[] = [];

    filteredTasks.forEach((task) => {
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
      } else if (isTomorrow(dueDate)) {
        tomorrow.push(task);
      } else if (isThisWeek(dueDate)) {
        thisWeek.push(task);
      } else {
        later.push(task);
      }
    });

    // Sort by priority within each group
    const sortByPriority = (a: Task, b: Task) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    };

    return {
      overdue: overdue.sort(sortByPriority),
      today: today.sort(sortByPriority),
      tomorrow: tomorrow.sort(sortByPriority),
      thisWeek: thisWeek.sort(sortByPriority),
      later: later.sort(sortByPriority),
      completed: completed.slice(0, 5), // Show only recent completed
    };
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'completed');
    return {
      total: activeTasks.length,
      overdue: groupedTasks.overdue.length,
      dueToday: groupedTasks.today.length,
      completedToday: tasks.filter(
        (t) => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
      ).length,
    };
  }, [tasks, groupedTasks]);

  const handleToggleComplete = (taskId: string) => {
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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">My Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {stats.dueToday} due today · {stats.overdue > 0 && (
                  <span className="text-destructive">{stats.overdue} overdue</span>
                )}
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Active</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
            </div>
            <div className={cn(
              'rounded-lg p-3',
              stats.overdue > 0 ? 'bg-destructive/10' : 'bg-secondary/50'
            )}>
              <div className={cn(
                'flex items-center gap-2 mb-1',
                stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Overdue</span>
              </div>
              <p className={cn(
                'text-2xl font-semibold',
                stats.overdue > 0 ? 'text-destructive' : 'text-foreground'
              )}>{stats.overdue}</p>
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
                <span className="text-xs font-medium">Done Today</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{stats.completedToday}</p>
            </div>
          </div>

          {/* Filters */}
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

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[130px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', cat.color)} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Overdue */}
        {groupedTasks.overdue.length > 0 && (
          <TaskSection
            title="Overdue"
            tasks={groupedTasks.overdue}
            variant="overdue"
            onToggleComplete={handleToggleComplete}
            onTaskClick={setSelectedTask}
          />
        )}

        {/* Today */}
        <TaskSection
          title="Today"
          tasks={groupedTasks.today}
          emptyMessage="No tasks due today - nice work!"
          onToggleComplete={handleToggleComplete}
          onTaskClick={setSelectedTask}
        />

        {/* Tomorrow */}
        {groupedTasks.tomorrow.length > 0 && (
          <TaskSection
            title="Tomorrow"
            tasks={groupedTasks.tomorrow}
            onToggleComplete={handleToggleComplete}
            onTaskClick={setSelectedTask}
          />
        )}

        {/* This Week */}
        {groupedTasks.thisWeek.length > 0 && (
          <TaskSection
            title="This Week"
            tasks={groupedTasks.thisWeek}
            onToggleComplete={handleToggleComplete}
            onTaskClick={setSelectedTask}
          />
        )}

        {/* Later */}
        {groupedTasks.later.length > 0 && (
          <TaskSection
            title="Later"
            tasks={groupedTasks.later}
            onToggleComplete={handleToggleComplete}
            onTaskClick={setSelectedTask}
          />
        )}

        {/* Recently Completed */}
        {statusFilter !== 'active' && groupedTasks.completed.length > 0 && (
          <TaskSection
            title="Recently Completed"
            tasks={groupedTasks.completed}
            variant="completed"
            onToggleComplete={handleToggleComplete}
            onTaskClick={setSelectedTask}
          />
        )}
      </main>

      {/* Task Detail Panel */}
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
