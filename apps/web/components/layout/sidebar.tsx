'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Target,
  UserCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo-mark';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: UserCircle },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/activities', label: 'Activities', icon: Activity },
];

const settingsItems = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/workspace', label: 'Workspace' },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r studio-divider bg-background transition-all duration-200',
        collapsed ? 'w-[52px]' : 'w-60',
      )}
    >
      <div className={cn('flex h-12 items-center border-b studio-divider px-3', collapsed && 'justify-center')}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <span className="block text-sm font-semibold tracking-tight text-amber-50/95">Vibe CRM</span>
              <span className="block text-[10px] text-muted-foreground">Studio desk</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <LogoMark />
          </Link>
        )}
      </div>

      <div className={cn('border-b studio-divider p-2', collapsed && 'px-1.5')}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'border-l-[3px] border-amber-500/75 bg-amber-500/10 pl-2 text-amber-50/95'
                  : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-amber-950/25 hover:text-foreground',
                collapsed && 'justify-center border-l-0 px-0 pl-0',
                collapsed && active && 'bg-amber-500/10',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate text-xs font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t studio-divider p-2">
        {!collapsed && <p className="studio-label mb-1.5 px-2">Settings</p>}
        {settingsItems.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors',
                active
                  ? 'bg-amber-500/10 text-amber-50/90'
                  : 'text-muted-foreground hover:bg-amber-950/25 hover:text-foreground',
                collapsed && 'justify-center',
              )}
              title={collapsed ? label : undefined}
            >
              {collapsed ? <Settings className="h-4 w-4" /> : label}
            </Link>
          );
        })}
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 h-7 w-full"
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
