'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export interface WorkspaceMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function useWorkspaceMembers() {
  const [members, setMembers] = useState<WorkspaceMemberUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ user: WorkspaceMemberUser }[]>('/workspaces/members')
      .then((data) => setMembers(data.map((m) => m.user)))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return { members, loading };
}
