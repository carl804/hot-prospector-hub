import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task, TaskStatus, Priority } from '@/types/task';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onReorderTasks: (taskIds: string[], status: TaskStatus) => void;
  selectedTaskIds: Set<string>;
  onToggleSelectTask: (taskId: string) => void;
  onUpdatePriority?: (taskId: string, priority: Priority) => void;
}

const COLUMNS: { 
  id: TaskStatus; 
  title: string; 
  color: string;
  gradient: string;
  iconBg: string;
  collapsible?: boolean;
}[] = [
  { 
    id: 'todo', 
    title: 'To Do', 
    color: 'border-t-slate-400 dark:border-t-slate-500',
    gradient: 'from-slate-50 to-transparent dark:from-slate-900/50 dark:to-transparent',
    iconBg: 'bg-slate-100 dark:bg-slate-800'
  },
  { 
    id: 'in_progress', 
    title: 'In Progress', 
    color: 'border-t-blue-400 dark:border-t-blue-500',
    gradient: 'from-blue-50 to-transparent dark:from-blue-900/30 dark:to-transparent',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50'
  },
  { 
    id: 'completed', 
    title: 'Completed', 
    color: 'border-t-emerald-400 dark:border-t-emerald-500',
    gradient: 'from-emerald-50 to-transparent dark:from-emerald-900/30 dark:to-transparent',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    collapsible: true
  },
];

const COMPLETED_TASK_LIMIT = 20;

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onUpdateTaskStatus,
  onReorderTasks,
  selectedTaskIds,
  onToggleSelectTask,
  onUpdatePriority,
}: TaskKanbanBoardProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set(['completed']));
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const columnTasks = tasksByStatus[source.droppableId as TaskStatus] || [];
      const reorderedIds = Array.from(columnTasks.map((t) => t.id));
      const [movedId] = reorderedIds.splice(source.index, 1);
      reorderedIds.splice(destination.index, 0, movedId);
      onReorderTasks(reorderedIds, source.droppableId as TaskStatus);
    } else {
      onUpdateTaskStatus(draggableId, destination.droppableId as TaskStatus);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTaskStatus(taskId, task.status === 'completed' ? 'todo' : 'completed');
  };

  const toggleColumnCollapse = (columnId: TaskStatus) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
        setShowAllCompleted(false); // Reset show all when collapsing
      }
      return newSet;
    });
  };

  const getVisibleTasks = (columnId: TaskStatus, columnTasks: Task[]) => {
    if (columnId === 'completed' && !showAllCompleted) {
      return columnTasks.slice(0, COMPLETED_TASK_LIMIT);
    }
    return columnTasks;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 h-full overflow-x-auto p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          const isCollapsed = collapsedColumns.has(column.id);
          const visibleTasks = getVisibleTasks(column.id, columnTasks);
          const hasMoreTasks = column.id === 'completed' && columnTasks.length > COMPLETED_TASK_LIMIT && !showAllCompleted;

          return (
            <div 
              key={column.id} 
              className={cn(
                'flex-shrink-0 transition-all duration-300',
                isCollapsed ? 'w-[80px]' : 'w-[380px]'
              )}
            >
              <div 
                className={cn(
                  'rounded-2xl border-t-4 h-full flex flex-col overflow-hidden',
                  'backdrop-blur-xl bg-white/40 dark:bg-gray-900/40',
                  'border border-gray-200/50 dark:border-gray-700/50',
                  'shadow-xl',
                  column.color
                )}
              >
                {/* Column Header */}
                <div className={cn(
                  'p-5 bg-gradient-to-b border-b border-gray-200/50 dark:border-gray-700/50',
                  column.gradient
                )}>
                  <div className="flex items-center justify-between">
                    {column.collapsible ? (
                      <button
                        onClick={() => toggleColumnCollapse(column.id)}
                        className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                        {!isCollapsed && (
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-50">
                            {column.title}
                          </h3>
                        )}
                      </button>
                    ) : (
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-50">
                        {column.title}
                      </h3>
                    )}
                    
                    <span 
                      className={cn(
                        'text-sm font-bold px-3 py-1.5 rounded-full',
                        column.iconBg,
                        'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Collapsed Preview */}
                  {isCollapsed && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium rotate-90 whitespace-nowrap origin-center transform translate-y-4">
                        {column.title}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column Content */}
                {!isCollapsed && (
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'flex-1 p-4 space-y-3 overflow-y-auto',
                          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                          'scrollbar-track-transparent',
                          snapshot.isDraggingOver && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        {visibleTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'transition-transform duration-200',
                                  snapshot.isDragging && 'rotate-3 scale-105 shadow-2xl'
                                )}
                              >
                                <div className="relative">
                                  {selectedTaskIds.size > 0 && (
                                    <div className="absolute -left-2 top-4 z-10">
                                      <Checkbox
                                        checked={selectedTaskIds.has(task.id)}
                                        onCheckedChange={() => onToggleSelectTask(task.id)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  )}
                                  <TaskCard
                                    task={task}
                                    onToggleComplete={handleToggleComplete}
                                    onClick={onTaskClick}
                                    onUpdatePriority={onUpdatePriority}
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Show All Button */}
                        {hasMoreTasks && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllCompleted(true)}
                            className="w-full mt-2"
                          >
                            Show all ({columnTasks.length - COMPLETED_TASK_LIMIT} more)
                          </Button>
                        )}

                        {columnTasks.length === 0 && (
                          <div className="text-center py-12">
                            <div className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                              No tasks yet
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}