'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser, useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { CommandPalette } from '@/components/layout/command-palette';
import { Surface } from '@/components/ui/surface';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchWorkspaces = useWorkspaceStore((s) => s.fetchWorkspaces);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const workspaceHydrated = useWorkspaceStore((s) => s.isHydrated);
  const [workspacesReady, setWorkspacesReady] = useState(false);

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.replace('/login');
    }
  }, [isHydrated, accessToken, router]);

  useEffect(() => {
    if (!isHydrated || !accessToken || !workspaceHydrated) return;

    setWorkspacesReady(false);
    fetchWorkspaces()
      .then(() => fetchCurrentUser())
      .catch(() => undefined)
      .finally(() => setWorkspacesReady(true));
  }, [isHydrated, accessToken, workspaceHydrated, fetchWorkspaces]);

  useEffect(() => {
    if (!isHydrated || !accessToken || !workspaceHydrated || !currentWorkspaceId) return;
    fetchCurrentUser().catch(() => undefined);
  }, [currentWorkspaceId, workspaceHydrated, isHydrated, accessToken]);

  const isAppReady =
    isHydrated && workspaceHydrated && workspacesReady && !!currentWorkspaceId;

  if (!isAppReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Surface className="flex h-16 w-16 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-950/40 border-t-amber-400" />
        </Surface>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
