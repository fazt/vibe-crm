'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspaceContext } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { registerWorkspaceIdGetter } from '@/lib/workspace-id';

interface WorkspaceState {
  workspaces: WorkspaceContext[];
  currentWorkspaceId: string | null;
  isHydrated: boolean;
  setWorkspaces: (workspaces: WorkspaceContext[]) => void;
  setCurrentWorkspace: (id: string) => void;
  fetchWorkspaces: () => Promise<WorkspaceContext[]>;
  setHydrated: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      isHydrated: false,
      setWorkspaces: (workspaces) => {
        const current = get().currentWorkspaceId;
        const nextId =
          current && workspaces.some((w) => w.id === current)
            ? current
            : workspaces[0]?.id ?? null;
        set({ workspaces, currentWorkspaceId: nextId });
      },
      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),
      fetchWorkspaces: async () => {
        const workspaces = await apiClient.get<WorkspaceContext[]>('/workspaces');
        get().setWorkspaces(workspaces);
        return workspaces;
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'vibe-workspace',
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

registerWorkspaceIdGetter(() => useWorkspaceStore.getState().currentWorkspaceId);

export function useCurrentWorkspace() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return workspaces.find((w) => w.id === currentWorkspaceId) ?? null;
}
