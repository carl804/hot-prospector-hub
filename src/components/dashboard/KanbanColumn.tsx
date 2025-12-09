import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Opportunity, CSM, Stage } from '@/types/opportunity';
import { OpportunityCard } from './OpportunityCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: { id: Stage; label: string };
  opportunities: Opportunity[];
  csmList: CSM[];
  onCardClick: (opportunity: Opportunity) => void;
}

export function KanbanColumn({
  stage,
  opportunities,
  csmList,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium text-sm text-foreground">{stage.label}</h2>
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{formatValue(totalValue)}</p>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[calc(100vh-200px)] rounded-lg p-2 transition-colors duration-200',
          'bg-kanban-column border border-transparent',
          isOver && 'bg-primary/5 border-primary/20'
        )}
      >
        <SortableContext
          items={opportunities.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                csm={csmList.find((c) => c.id === opportunity.assignedCsmId)}
                onClick={() => onCardClick(opportunity)}
              />
            ))}
          </div>
        </SortableContext>

        {opportunities.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Drop cards here</p>
          </div>
        )}
      </div>
    </div>
  );
}
