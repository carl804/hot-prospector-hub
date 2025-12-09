import { Search, LayoutGrid, List, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CSM } from '@/types/opportunity';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCsm: string;
  onCsmChange: (value: string) => void;
  csmList: CSM[];
  onAddOpportunity: () => void;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  selectedCsm,
  onCsmChange,
  csmList,
  onAddOpportunity,
}: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">HP</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Hot Prospector
            <span className="text-muted-foreground font-normal ml-2">Project Management</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by agency or contact name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <Select value={selectedCsm} onValueChange={onCsmChange}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All CSMs" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All CSMs</SelectItem>
            {csmList.map((csm) => (
              <SelectItem key={csm.id} value={csm.id}>
                {csm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border border-border rounded-lg p-1 bg-background">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-secondary">
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button onClick={onAddOpportunity} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Opportunity
      </Button>
    </header>
  );
}
