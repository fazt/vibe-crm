'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@vibe-crm/shared';
import { apiClient, syncAuthCookie } from '@/lib/api';
import { useWorkspaceStore } from '@/stores/workspace-store';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setAuth: (data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setAuth: ({ user, accessToken, refreshToken }) => {
        syncAuthCookie(accessToken);
        set({ user, accessToken, refreshToken });
      },
      setTokens: (accessToken, refreshToken) => {
        syncAuthCookie(accessToken);
        set({ accessToken, refreshToken });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        syncAuthCookie(null);
        set({ user: null, accessToken: null, refreshToken: null });
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'vibe-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) syncAuthCookie(state.accessToken);
        state?.setHydrated();
      },
    },
  ),
);

export async function fetchCurrentUser(options?: { skipWorkspace?: boolean }) {
  const hasWorkspace = !!useWorkspaceStore.getState().currentWorkspaceId;
  const skipWorkspace = options?.skipWorkspace ?? !hasWorkspace;

  const user = await apiClient.get<AuthUser>('/users/me', undefined, { skipWorkspace });
  useAuthStore.getState().setUser(user);
  return user;
}

if (typeof window !== 'undefined') {
  window.addEventListener('vibe:tokens-refreshed', (event) => {
    const { accessToken, refreshToken } = (event as CustomEvent<{
      accessToken: string;
      refreshToken: string;
    }>).detail;
    useAuthStore.getState().setTokens(accessToken, refreshToken);
  });
}
