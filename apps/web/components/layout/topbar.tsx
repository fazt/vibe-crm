'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Search, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { apiClient } from '@/lib/api';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<Notification>>('/notifications', { read: 'false', limit: 1 })
      .then((res) => setUnreadCount(res.meta.total))
      .catch(() => setUnreadCount(0));
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-11 items-center justify-between border-b studio-divider bg-background/80 px-4 backdrop-blur-sm">
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-72 justify-start rounded-full studio-inset text-xs text-muted-foreground hover:bg-muted/80"
        onClick={() => setCommandOpen(true)}
      >
        <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        Search pipeline...
        <kbd className="pointer-events-none ml-auto hidden rounded-md border studio-divider bg-muted/60 px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <div className="flex items-center gap-1">
        <ThemeToggle className="h-8 w-8" />
        <Button variant="ghost" size="icon" className="relative h-8 w-8" asChild>
          <Link href="/settings/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold tabular-nums text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full px-2">
              <Avatar className="h-6 w-6 ring-1 ring-border">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-muted text-[10px] text-foreground">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="studio-divider" />
            <DropdownMenuItem asChild className="text-xs">
              <Link href="/settings/profile">
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-xs">
              <Link href="/settings/workspace">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Workspace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="studio-divider" />
            <DropdownMenuItem onClick={handleLogout} className="text-xs text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
