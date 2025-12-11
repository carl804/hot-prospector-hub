import { useState, useEffect } from 'react';
import { X, CalendarIcon } from 'lucide-react';
import { Task, TASK_CATEGORIES, Priority } from '@/types/task';
import { CLIENTS as ALL_CLIENTS } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CLIENTS = ALL_CLIENTS.map((c) => ({ id: c.id, name: c.name }));

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  preselectedClientId?: string;
}

export function AddTaskModal({ onClose, onAdd, preselectedClientId }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState(preselectedClientId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('ghl');

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    }
  }, [preselectedClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId || !dueDate) return;

    const client = CLIENTS.find((c) => c.id === clientId);
    if (!client) return;

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      clientId,
      clientName: client.name,
      dueDate: dueDate.toISOString(),
      priority,
      status: 'todo',
      category,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Add New Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Task Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Setup GHL Agency Access"
              className="bg-background"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Client *
            </label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {CLIENTS.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-background',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
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

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details..."
              className="bg-background min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!title.trim() || !clientId || !dueDate}>
              Add Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
