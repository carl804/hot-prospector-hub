import { useState } from 'react';
import { X, Phone, Calendar, ExternalLink, FileText, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Opportunity, CSM, Stage, STAGES } from '@/types/opportunity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DetailPanelProps {
  opportunity: Opportunity;
  csmList: CSM[];
  onClose: () => void;
  onUpdate: (updated: Opportunity) => void;
  onViewIntakeForm: () => void;
}

export function DetailPanel({
  opportunity,
  csmList,
  onClose,
  onUpdate,
  onViewIntakeForm,
}: DetailPanelProps) {
  const [notes, setNotes] = useState(opportunity.notes);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleNoteSave = () => {
    onUpdate({ ...opportunity, notes });
  };

  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = opportunity.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdate({ ...opportunity, tasks: updatedTasks });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
    };
    onUpdate({ ...opportunity, tasks: [...opportunity.tasks, newTask] });
    setNewTaskTitle('');
  };

  const completedTasks = opportunity.tasks.filter((t) => t.completed).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-card border-l border-border shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              {opportunity.agencyName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {opportunity.contactFirstName} {opportunity.contactLastName}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 kanban-scrollbar">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <p className="text-sm text-foreground mt-1">{opportunity.contactEmail}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phone
              </label>
              <p className="text-sm text-foreground mt-1">{opportunity.contactPhone}</p>
            </div>
          </div>

          {/* CSM & Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                Assigned CSM
              </label>
              <Select
                value={opportunity.assignedCsmId}
                onValueChange={(value) => onUpdate({ ...opportunity, assignedCsmId: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {csmList.map((csm) => (
                    <SelectItem key={csm.id} value={csm.id}>
                      {csm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                Stage
              </label>
              <Select
                value={opportunity.stage}
                onValueChange={(value) => onUpdate({ ...opportunity, stage: value as Stage })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Deadline
            </label>
            <Input
              type="date"
              value={opportunity.deadline.split('T')[0]}
              onChange={(e) =>
                onUpdate({ ...opportunity, deadline: new Date(e.target.value).toISOString() })
              }
              className="bg-background"
            />
          </div>

          {/* Call Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Call Status</h3>

            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Assessment Call</span>
              </div>
              {opportunity.assessmentBooked ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Booked: {format(new Date(opportunity.assessmentDate!), 'MMM d, yyyy h:mm a')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs opacity-50"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Fathom Recording
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not Booked</p>
              )}
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Onboarding Call</span>
              </div>
              {opportunity.onboardingBooked ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Booked: {format(new Date(opportunity.onboardingDate!), 'MMM d, yyyy h:mm a')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs opacity-50"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Fathom Recording
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not Booked</p>
              )}
            </div>
          </div>

          {/* Intake Form Button */}
          <Button onClick={onViewIntakeForm} className="w-full gap-2">
            <FileText className="w-4 h-4" />
            View Full Intake Form
          </Button>

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client..."
              className="min-h-[100px] bg-background"
            />
            <Button onClick={handleNoteSave} variant="secondary" size="sm">
              Save Note
            </Button>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Tasks ({completedTasks}/{opportunity.tasks.length} complete)
            </h3>

            <div className="space-y-2">
              {opportunity.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleTaskToggle(task.id)}
                    id={task.id}
                  />
                  <label
                    htmlFor={task.id}
                    className={cn(
                      'text-sm cursor-pointer flex-1',
                      task.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="bg-background"
              />
              <Button onClick={handleAddTask} size="icon" variant="secondary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
