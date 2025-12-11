import { useQuery } from '@tanstack/react-query';

export interface GHLUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  extension?: string;
  role: string;
  permissions?: Record<string, any>;
}

interface GHLUsersResponse {
  users: GHLUser[];
}

async function fetchGHLUsers(): Promise<GHLUser[]> {
  const response = await fetch('/api/ghl/users');
  
  if (!response.ok) {
    throw new Error('Failed to fetch GHL users');
  }
  
  const data: GHLUsersResponse = await response.json();
  return data.users || [];
}

export function useGHLUsers() {
  return useQuery({
    queryKey: ['ghl', 'users'],
    queryFn: fetchGHLUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
