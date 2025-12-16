import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Clock, AlertTriangle } from 'lucide-react';
import { Client, CSM_LIST } from '@/types/client';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientCard } from './ClientCard';
import { ClientTaskPanel } from './ClientTaskPanel';
import { IntakeFormModal } from './IntakeFormModal';
import { cn } from '@/lib/utils';
import { isToday, isPast, startOfDay } from 'date-fns';
import { useGHLOpportunities } from '@/hooks/useGHLOpportunities';
import { useAllGHLTasks } from '@/hooks/useGHLTasks';

type StatusFilter = 'all' | 'active' | 'completed';

export function ClientDashboard() {
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useGHLOpportunities({ limit: 100 });
  const { data: tasksData = [], isLoading: isLoadingTasks } = useAllGHLTasks();
  const isLoading = isLoadingOpportunities || isLoadingTasks;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [csmFilter, setCsmFilter] = useState('all');

