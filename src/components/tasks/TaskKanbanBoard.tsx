import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskCard } from './TaskCard';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-muted-foreground' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'completed', title: 'Completed', color: 'bg-success' },
];

export function TaskKanbanBoard({ tasks, onTaskClick, onUpdateTaskStatus }: TaskKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.id] = tasks.filter((t) => t.status === column.id);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const column = COLUMNS.find((c) => c.id === overId);
    if (column) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== column.id) {
        onUpdateTaskStatus(taskId, column.id);
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overTask.status) {
        onUpdateTaskStatus(taskId, overTask.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full overflow-x-auto kanban-scrollbar">
        {COLUMNS.map((column) => (
          <TaskKanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="opacity-90 rotate-3">
            <TaskCard task={activeTask} onToggleComplete={() => {}} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
