export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientId: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  createdAt: string;
  completedAt?: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'ghl', name: 'GHL Setup', color: 'bg-blue-500' },
  { id: 'twilio', name: 'Twilio & A2P', color: 'bg-purple-500' },
  { id: 'config', name: 'Configuration', color: 'bg-amber-500' },
  { id: 'content', name: 'Content Import', color: 'bg-emerald-500' },
  { id: 'testing', name: 'Testing', color: 'bg-rose-500' },
  { id: 'training', name: 'Training', color: 'bg-cyan-500' },
];
