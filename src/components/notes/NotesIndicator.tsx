import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useGHLNotes } from '@/hooks/useGHLNotes';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NotesIndicatorProps {
  contactId: string | undefined;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export function NotesIndicator({ contactId, onClick, className }: NotesIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { data: notes = [], isLoading } = useGHLNotes(contactId);

  const noteCount = notes.length;
  const hasNotes = noteCount > 0;

  // Get the most recent note for the preview
  const mostRecentNote = hasNotes
    ? [...notes].sort(
        (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      )[0]
    : null;

  // Truncate note body for preview
  const previewText = mostRecentNote?.body
    ? mostRecentNote.body.length > 100
      ? mostRecentNote.body.substring(0, 100) + '...'
      : mostRecentNote.body
    : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'relative flex items-center gap-1.5 px-2 py-1 rounded-md transition-all',
              'hover:bg-primary/10 active:scale-95',
              hasNotes ? 'text-primary' : 'text-muted-foreground hover:text-primary',
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <MessageSquare
                  className={cn(
                    'w-3.5 h-3.5 transition-transform',
                    isHovered && 'scale-110'
                  )}
                />
                {hasNotes && (
                  <span className="text-[10px] font-medium">{noteCount}</span>
                )}
              </>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[250px] p-3"
          sideOffset={5}
        >
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading notes...</p>
          ) : hasNotes ? (
            <div>
              <p className="text-xs font-medium mb-1">
                {noteCount} note{noteCount > 1 ? 's' : ''}
              </p>
              {previewText && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {previewText}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Click to view all notes
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">No notes yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Click to add a note
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
