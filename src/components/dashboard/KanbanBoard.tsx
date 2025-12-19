import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, Priority } from '@/types/task';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Checkbox } from '@/components/ui/checkbox';
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

const COLUMNS: { id: TaskStatus; title: string; color: string; dotColor: string }[] = [
  { id: 'todo', title: 'To Do', color: 'from-slate-500/20 to-slate-500/5', dotColor: 'bg-slate-500' },
  { id: 'in_progress', title: 'In Progress', color: 'from-primary/20 to-primary/5', dotColor: 'bg-primary' },
  { id: 'completed', title: 'Completed', color: 'from-success/20 to-success/5', dotColor: 'bg-success' },
];

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onUpdateTaskStatus,
  onReorderTasks,
  selectedTaskIds,
  onToggleSelectTask,
  onUpdatePriority,
}: TaskKanbanBoardProps) {
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

    // Same column reorder
    if (source.droppableId === destination.droppableId) {
      const columnTasks = tasksByStatus[source.droppableId as TaskStatus] || [];
      const reorderedIds = Array.from(columnTasks.map((t) => t.id));
      const [movedId] = reorderedIds.splice(source.index, 1);
      reorderedIds.splice(destination.index, 0, movedId);
      onReorderTasks(reorderedIds, source.droppableId as TaskStatus);
    } else {
      // Move to different column
      onUpdateTaskStatus(draggableId, destination.droppableId as TaskStatus);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    onUpdateTaskStatus(taskId, task.status === 'completed' ? 'todo' : 'completed');
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-5 h-full overflow-x-auto p-6 pb-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          return (
            <div key={column.id} className="flex-1 min-w-[300px] max-w-[380px]">
              {/* Modern Column Design */}
              <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 h-full flex flex-col shadow-soft overflow-hidden">
                {/* Column Header with gradient */}
                <div className={cn(
                  'p-4 bg-gradient-to-b border-b border-border/40',
                  column.color
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', column.dotColor)} />
                      <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full border border-border/50">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-3 space-y-2.5 overflow-y-auto modern-scrollbar transition-colors duration-200',
                        snapshot.isDraggingOver && 'bg-primary/5'
                      )}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'transition-all duration-200',
                                snapshot.isDragging && 'shadow-card-dragging rotate-1 scale-[1.02] z-50'
                              )}
                            >
                              <div className="relative">
                                {selectedTaskIds.size > 0 && (
                                  <div className="absolute -left-1 top-3 z-10">
                                    <Checkbox
                                      checked={selectedTaskIds.has(task.id)}
                                      onCheckedChange={() => onToggleSelectTask(task.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-background border-border"
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
                      {columnTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground/70">No tasks</p>
                          <p className="text-xs text-muted-foreground/50 mt-1">Drag tasks here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
