import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Opportunity, Stage, STAGES } from '@/types/opportunity';
import { CSM_LIST, MOCK_OPPORTUNITIES } from '@/data/mockData';
import { TopBar } from './TopBar';
import { KanbanColumn } from './KanbanColumn';
import { OpportunityCard } from './OpportunityCard';
import { DetailPanel } from './DetailPanel';
import { IntakeFormModal } from './IntakeFormModal';

export function KanbanBoard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCsm, setSelectedCsm] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      opp.agencyName.toLowerCase().includes(searchLower) ||
      `${opp.contactFirstName} ${opp.contactLastName}`.toLowerCase().includes(searchLower);
    const matchesCsm = selectedCsm === 'all' || opp.assignedCsmId === selectedCsm;
    return matchesSearch && matchesCsm;
  });

  const getOpportunitiesByStage = (stage: Stage) =>
    filteredOpportunities.filter((opp) => opp.stage === stage);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeOpp = opportunities.find((o) => o.id === active.id);
    if (!activeOpp) return;

    // Check if dropping over a column
    const overStage = STAGES.find((s) => s.id === over.id);
    if (overStage && activeOpp.stage !== overStage.id) {
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === active.id ? { ...opp, stage: overStage.id } : opp
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeOpp = opportunities.find((o) => o.id === active.id);
    if (!activeOpp) return;

    // Check if dropping over a column
    const overStage = STAGES.find((s) => s.id === over.id);
    if (overStage) {
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === active.id ? { ...opp, stage: overStage.id } : opp
        )
      );
    }
  };

  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const handleUpdateOpportunity = (updated: Opportunity) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === updated.id ? updated : opp))
    );
    setSelectedOpportunity(updated);
  };

  const handleAddOpportunity = () => {
    // For now, just show a placeholder - would open a form in a real app
    console.log('Add opportunity clicked');
  };

  const activeOpportunity = activeId
    ? opportunities.find((o) => o.id === activeId)
    : null;

  return (
    <div className="h-screen flex flex-col bg-kanban-bg">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCsm={selectedCsm}
        onCsmChange={setSelectedCsm}
        csmList={CSM_LIST}
        onAddOpportunity={handleAddOpportunity}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto kanban-scrollbar">
          <div className="flex gap-4 p-6 min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                opportunities={getOpportunitiesByStage(stage.id)}
                csmList={CSM_LIST}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeOpportunity && (
            <div className="rotate-3 scale-105">
              <OpportunityCard
                opportunity={activeOpportunity}
                csm={CSM_LIST.find((c) => c.id === activeOpportunity.assignedCsmId)}
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedOpportunity && !showIntakeForm && (
        <DetailPanel
          opportunity={selectedOpportunity}
          csmList={CSM_LIST}
          onClose={() => setSelectedOpportunity(null)}
          onUpdate={handleUpdateOpportunity}
          onViewIntakeForm={() => setShowIntakeForm(true)}
        />
      )}

      {showIntakeForm && selectedOpportunity && (
        <IntakeFormModal
          opportunity={selectedOpportunity}
          onClose={() => setShowIntakeForm(false)}
        />
      )}
    </div>
  );
}
