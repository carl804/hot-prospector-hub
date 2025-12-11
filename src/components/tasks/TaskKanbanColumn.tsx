import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskIds?: Set<string>;
  onToggleSelectTask?: (taskId: string) => void;
}

function SortableTaskCard({
  task,
  onTaskClick,
  isSelected,
  onToggleSelect,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  isSelected: boolean;
  onToggleSelect?: () => void;
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
      className={cn('relative group', isDragging && 'opacity-50')}
    >
      {onToggleSelect && (
        <div
          className={cn(
            'absolute -left-1 top-3 z-10 transition-opacity',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          <Checkbox checked={isSelected} className="bg-background" />
        </div>
      )}
      <div
        {...listeners}
        {...attributes}
        className={cn(isSelected && 'ring-2 ring-primary rounded-xl')}
      >
        <TaskCard task={task} onToggleComplete={() => {}} onClick={() => onTaskClick(task)} />
      </div>
    </div>
  );
}

export function TaskKanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  selectedTaskIds = new Set(),
  onToggleSelectTask,
}: TaskKanbanColumnProps) {
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
          <SortableTaskCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            isSelected={selectedTaskIds.has(task.id)}
            onToggleSelect={onToggleSelectTask ? () => onToggleSelectTask(task.id) : undefined}
          />
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
