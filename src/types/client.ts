import { Task } from '@/types/task';

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  startDate: string;
  status: 'active' | 'completed' | 'on_hold';
}

export const CLIENTS: Client[] = [
  { id: 'client-1', name: 'ABC Marketing Agency', contactName: 'John Smith', contactEmail: 'john@abcmarketing.com', startDate: '2024-12-01', status: 'active' },
  { id: 'client-2', name: 'Digital Growth Partners', contactName: 'Amanda Chen', contactEmail: 'amanda@digitalgrowth.io', startDate: '2024-12-03', status: 'active' },
  { id: 'client-3', name: 'Peak Performance Media', contactName: 'Michael Torres', contactEmail: 'mtorres@peakperformance.com', startDate: '2024-11-28', status: 'active' },
  { id: 'client-4', name: 'Summit Lead Generation', contactName: 'Jessica Williams', contactEmail: 'jessica@summitleads.co', startDate: '2024-11-25', status: 'active' },
  { id: 'client-5', name: 'Velocity Sales Pros', contactName: 'David Martinez', contactEmail: 'david@velocitysales.net', startDate: '2024-12-05', status: 'active' },
  { id: 'client-6', name: 'Apex Digital Solutions', contactName: 'Sarah Thompson', contactEmail: 'sthompson@apexdigital.com', startDate: '2024-11-15', status: 'completed' },
];
