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

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'border-t-slate-500' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'completed', title: 'Completed', color: 'border-t-green-500' },
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
      <div className="flex gap-6 h-full overflow-x-auto p-6">
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          return (
            <div key={column.id} className="flex-1 min-w-[320px] max-w-[400px]">
              <div className={cn('rounded-lg border-t-4 bg-card/50 h-full flex flex-col', column.color)}>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-4 space-y-3 overflow-y-auto',
                        snapshot.isDraggingOver && 'bg-secondary/30'
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
                                'transition-shadow',
                                snapshot.isDragging && 'shadow-lg rotate-2'
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
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No tasks
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