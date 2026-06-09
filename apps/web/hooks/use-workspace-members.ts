'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useWorkspaceStore } from '@/stores/workspace-store';

export interface WorkspaceMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function useWorkspaceMembers() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [members, setMembers] = useState<WorkspaceMemberUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspaceId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient
      .get<{ user: WorkspaceMemberUser }[]>('/workspaces/members')
      .then((data) => setMembers(data.map((m) => m.user)))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [currentWorkspaceId]);

  return { members, loading };
}
