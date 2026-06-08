'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { fetchCurrentUser } from '@/stores/auth-store';
import { useWorkspaceStore, useCurrentWorkspace } from '@/stores/workspace-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const current = useCurrentWorkspace();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  if (!current) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start rounded-lg studio-inset text-xs"
        disabled
      >
        No workspace
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'w-full justify-between rounded-lg studio-inset text-xs font-normal hover:bg-muted/70',
            collapsed && 'h-8 w-8 px-0',
          )}
        >
          {collapsed ? (
            <span className="text-[10px] font-bold text-amber-200">{current.name[0]}</span>
          ) : (
            <>
              <span className="truncate">{current.name}</span>
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 border studio-divider bg-stone-900/95">
        <DropdownMenuLabel className="studio-label">Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator className="studio-divider" />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => {
              setCurrentWorkspace(ws.id);
              void fetchCurrentUser();
            }}
            className="text-xs"
          >
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.id === current.id && <Check className="h-3.5 w-3.5 text-amber-400" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="studio-divider" />
        <DropdownMenuItem asChild className="text-xs">
          <a href="/settings/workspace">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Manage workspaces
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
