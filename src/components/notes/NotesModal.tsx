import { useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Send,
  MessageSquare,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  useGHLNotes,
  useCreateGHLNote,
  useUpdateGHLNote,
  useDeleteGHLNote,
  useNotifyCSM,
  type CSMRecipient,
} from '@/hooks/useGHLNotes';
import type { GHLNote } from '@/types/ghl';

interface NotesModalProps {
  contactId: string;
  clientName: string;
  onClose: () => void;
  completedTasks?: number;
  totalTasks?: number;
}

export function NotesModal({ contactId, clientName, onClose, completedTasks = 0, totalTasks = 0 }: NotesModalProps) {
  const { data: notes = [], isLoading } = useGHLNotes(contactId);

  // Calculate progress percentage
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const createNoteMutation = useCreateGHLNote();
  const updateNoteMutation = useUpdateGHLNote();
  const deleteNoteMutation = useDeleteGHLNote();
  const notifyCSMMutation = useNotifyCSM();

  const [newNoteBody, setNewNoteBody] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [selectedCSMs, setSelectedCSMs] = useState<Set<CSMRecipient>>(new Set());
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
  const [showNotifyPanel, setShowNotifyPanel] = useState(false);

  // Sort notes by date (most recent first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  );

  const handleAddNote = async () => {
    if (!newNoteBody.trim()) return;

    await createNoteMutation.mutateAsync({
      contactId,
      data: { body: newNoteBody.trim() },
    });

    setNewNoteBody('');
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteBody.trim()) return;

    await updateNoteMutation.mutateAsync({
      contactId,
      noteId,
      data: { body: editingNoteBody.trim() },
    });

    setEditingNoteId(null);
    setEditingNoteBody('');
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNoteMutation.mutateAsync({ contactId, noteId });
    setDeleteConfirmNoteId(null);
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(noteId);
      return newSet;
    });
  };

  const handleStartEdit = (note: GHLNote) => {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteBody('');
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const toggleCSMSelection = (csm: CSMRecipient) => {
    setSelectedCSMs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(csm)) {
        newSet.delete(csm);
      } else {
        newSet.add(csm);
      }
      return newSet;
    });
  };

  const handleNotifyCSM = async () => {
    if (selectedNoteIds.size === 0 || selectedCSMs.size === 0) return;

    await notifyCSMMutation.mutateAsync({
      contactId,
      recipients: Array.from(selectedCSMs),
      noteIds: Array.from(selectedNoteIds),
      clientName,
    });

    // Reset selections after successful notification
    setSelectedNoteIds(new Set());
    setSelectedCSMs(new Set());
    setShowNotifyPanel(false);
  };

  const selectAllNotes = () => {
    if (selectedNoteIds.size === sortedNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(sortedNotes.map((n) => n.id)));
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-xl shadow-2xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                <p className="text-xs text-muted-foreground">{clientName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Task Progress Bar */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Task Progress</span>
                  <span className="font-medium text-foreground">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      progressPercent === 100 ? 'bg-success' : 'bg-primary'
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedTasks}/{totalTasks} tasks
              </span>
            </div>
          )}
        </div>

        {/* Add New Note Section */}
        <div className="px-5 py-4 border-b border-border bg-secondary/30 shrink-0">
          <Textarea
            value={newNoteBody}
            onChange={(e) => setNewNoteBody(e.target.value)}
            placeholder="Add a new note..."
            className="bg-background min-h-[80px] resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleAddNote}
              disabled={!newNoteBody.trim() || createNoteMutation.isPending}
              className="gap-2"
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Note
            </Button>
          </div>
        </div>

        {/* Actions Bar */}
        {sortedNotes.length > 0 && (
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-background shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllNotes}
                className="gap-2 text-xs"
              >
                {selectedNoteIds.size === sortedNotes.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedNoteIds.size === sortedNotes.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedNoteIds.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {selectedNoteIds.size} selected
                </span>
              )}
            </div>

            <Button
              variant={showNotifyPanel ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNotifyPanel(!showNotifyPanel)}
              disabled={selectedNoteIds.size === 0}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Notify CSM
            </Button>
          </div>
        )}

        {/* Notify CSM Panel */}
        {showNotifyPanel && selectedNoteIds.size > 0 && (
          <div className="px-5 py-4 border-b border-border bg-primary/5 shrink-0">
            <p className="text-sm font-medium text-foreground mb-3">
              Select CSM(s) to notify:
            </p>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedCSMs.has('chloe')}
                  onCheckedChange={() => toggleCSMSelection('chloe')}
                />
                <span className="text-sm">Chloe</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedCSMs.has('jonathan')}
                  onCheckedChange={() => toggleCSMSelection('jonathan')}
                />
                <span className="text-sm">Jonathan</span>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedNoteIds.size} note{selectedNoteIds.size > 1 ? 's' : ''} will be sent via Slack
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNotifyPanel(false);
                    setSelectedCSMs(new Set());
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleNotifyCSM}
                  disabled={selectedCSMs.size === 0 || notifyCSMMutation.isPending}
                  className="gap-2"
                >
                  {notifyCSMMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Notification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </>
            ) : sortedNotes.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No notes yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add a note above to get started
                </p>
              </div>
            ) : (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'rounded-lg border border-border p-4 transition-all',
                    selectedNoteIds.has(note.id) && 'border-primary bg-primary/5',
                    editingNoteId === note.id && 'border-primary'
                  )}
                >
                  {editingNoteId === note.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <Textarea
                        value={editingNoteBody}
                        onChange={(e) => setEditingNoteBody(e.target.value)}
                        className="bg-background min-h-[100px] resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editingNoteBody.trim() || updateNoteMutation.isPending}
                        >
                          {updateNoteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedNoteIds.has(note.id)}
                          onCheckedChange={() => toggleNoteSelection(note.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.dateAdded), 'MMM d, yyyy h:mm a')}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleStartEdit(note)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmNoteId(note.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {note.body}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmNoteId}
        onOpenChange={(open) => !open && setDeleteConfirmNoteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmNoteId && handleDeleteNote(deleteConfirmNoteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Use React Portal to render at document body level to avoid z-index issues
  return createPortal(modalContent, document.body);
}
