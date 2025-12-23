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
} from '@/hooks/useGHLNotes';
import type { GHLNote } from '@/types/ghl';

interface NotesModalProps {
  contactId: string;
  clientName: string;
  onClose: () => void;
  completedTasks?: number;
  totalTasks?: number;
  draftBuildNotified?: boolean;
  setupCompleteNotified?: boolean;
  assessmentBooked?: boolean;
  assessmentDate?: string;
  onboardingBooked?: boolean;
  onboardingDate?: string;
  kickoffBooked?: boolean;
  kickoffDate?: string;
}

export function NotesModal({
  contactId,
  clientName,
  onClose,
  completedTasks = 0,
  totalTasks = 0,
  draftBuildNotified = false,
  setupCompleteNotified = false,
  assessmentBooked = false,
  assessmentDate,
  onboardingBooked = false,
  onboardingDate,
  kickoffBooked = false,
  kickoffDate,
}: NotesModalProps) {
  const { data: notes = [], isLoading } = useGHLNotes(contactId);

  // Calculate progress percentage
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine notification state
  const allCallsBooked = assessmentBooked && onboardingBooked && kickoffBooked;
  const isSetupComplete = progressPercent === 100 && allCallsBooked;
  const showSetupCompleteNotification = isSetupComplete && !setupCompleteNotified;

  const createNoteMutation = useCreateGHLNote();
  const updateNoteMutation = useUpdateGHLNote();
  const deleteNoteMutation = useDeleteGHLNote();
  const notifyCSMMutation = useNotifyCSM();

  const [newNoteBody, setNewNoteBody] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [deleteConfirmNoteId, setDeleteConfirmNoteId] = useState<string | null>(null);
  const [showNotifyPanel, setShowNotifyPanel] = useState(false);
  const [notificationType, setNotificationType] = useState<'draft' | 'complete' | null>(null);

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

  const handleNotifyCSM = async (type: 'draft' | 'complete') => {
    await notifyCSMMutation.mutateAsync({
      contactId,
      recipients: [],
      noteIds: Array.from(selectedNoteIds),
      clientName,
      notificationType: type,
    });

    // Reset selections after successful notification
    setSelectedNoteIds(new Set());
    setShowNotifyPanel(false);
    setNotificationType(null);
  };

  const selectAllNotes = () => {
    if (selectedNoteIds.size === sortedNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(sortedNotes.map((n) => n.id)));
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - 2 Column Layout */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-[85vh] flex flex-col border border-border/50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 shrink-0 bg-gradient-to-b from-secondary/30 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">{clientName}</h2>
              <p className="text-xs text-muted-foreground">Contact Notes</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl hover:bg-secondary h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 2 Column Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Actions */}
          <div className="w-80 shrink-0 border-r border-border/50 flex flex-col bg-secondary/10">
            {/* Progress Bar */}
            {totalTasks > 0 && (
              <div className="p-4 border-b border-border/40">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground font-medium uppercase tracking-wide">Progress</span>
                  <span className="font-semibold text-foreground tabular-nums">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      progressPercent === 100
                        ? 'bg-gradient-to-r from-success to-success/80'
                        : 'bg-gradient-to-r from-primary to-primary/80'
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">{completedTasks} of {totalTasks} tasks</p>
              </div>
            )}

            {/* Add Note */}
            <div className="p-4 border-b border-border/40">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add Note</p>
              <Textarea
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Write a note..."
                className="bg-background border-border/50 min-h-[100px] resize-none rounded-lg text-sm focus:border-primary/50 transition-colors"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteBody.trim() || createNoteMutation.isPending}
                className="w-full mt-3 gap-2 rounded-lg"
                size="sm"
              >
                {createNoteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Note
              </Button>
            </div>

            {/* Notify CSM */}
            <div className="p-4 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Notify CSM</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNotifyCSM('draft')}
                  disabled={notifyCSMMutation.isPending}
                  className={cn(
                    "w-full justify-start gap-2 h-10 rounded-lg",
                    showSetupCompleteNotification && "border-secondary-accent/50"
                  )}
                >
                  {notifyCSMMutation.isPending && notificationType === 'draft' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>📝</span>
                  )}
                  Draft Build Complete
                </Button>
                <Button
                  variant={showSetupCompleteNotification ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNotifyCSM('complete')}
                  disabled={notifyCSMMutation.isPending}
                  className={cn(
                    "w-full justify-start gap-2 h-10 rounded-lg",
                    showSetupCompleteNotification && "bg-gradient-to-r from-secondary-accent to-secondary-accent/80 hover:from-secondary-accent/90 hover:to-secondary-accent/70 text-black font-semibold shadow-glow-gold"
                  )}
                >
                  {notifyCSMMutation.isPending && notificationType === 'complete' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>🎉</span>
                  )}
                  Setup Complete
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Triggers GHL workflow notification
              </p>
            </div>
          </div>

          {/* Right Column - Notes History */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Notes Header */}
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-background shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Notes History</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {sortedNotes.length}
                </span>
              </div>
              {sortedNotes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllNotes}
                  className="gap-1.5 text-xs rounded-lg h-7 px-2"
                >
                  {selectedNoteIds.size === sortedNotes.length ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  {selectedNoteIds.size === sortedNotes.length ? 'Deselect' : 'Select All'}
                </Button>
              )}
            </div>

            {/* Notes List */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              <div className="p-4 space-y-3">
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
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Add a note to get started
                    </p>
                  </div>
                ) : (
                  sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        'rounded-lg border border-border/60 p-4 transition-all',
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
                            className="bg-background min-h-[100px] resize-none text-sm"
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
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedNoteIds.has(note.id)}
                            onCheckedChange={() => toggleNoteSelection(note.id)}
                            className="mt-0.5"
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
                                  className="h-7 w-7 rounded-md hover:bg-secondary"
                                  onClick={() => handleStartEdit(note)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirmNoteId(note.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div
                              className="text-sm text-foreground whitespace-pre-wrap break-words"
                              dangerouslySetInnerHTML={{ __html: note.body }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
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
