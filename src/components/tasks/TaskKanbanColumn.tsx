import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface TaskKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function SortableTaskCard({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(isDragging && 'opacity-50')}
    >
      <TaskCard task={task} onToggleComplete={() => {}} onClick={() => onTaskClick(task)} />
    </div>
  );
}

export function TaskKanbanColumn({ id, title, color, tasks, onTaskClick }: TaskKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-3 h-3 rounded-full', color)} />
        <h3 className="font-medium text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground ml-auto">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-3 space-y-3 overflow-y-auto kanban-scrollbar transition-colors',
          'bg-[hsl(var(--kanban-column-bg))]',
          isOver && 'bg-primary/10 ring-2 ring-primary/20'
        )}
      >
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
