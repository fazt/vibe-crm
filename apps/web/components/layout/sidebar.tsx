'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  Settings,
  Shield,
  Tag,
  Target,
  UserCircle,
  Users,
  AlarmClock,
} from 'lucide-react';
import { PERMISSIONS } from '@vibe-crm/shared';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo-mark';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { href: '/clients', label: 'Clients', icon: Users, permission: PERMISSIONS.CLIENTS_READ },
  { href: '/companies', label: 'Companies', icon: Building2, permission: PERMISSIONS.COMPANIES_READ },
  { href: '/contacts', label: 'Contacts', icon: UserCircle, permission: PERMISSIONS.CONTACTS_READ },
  { href: '/opportunities', label: 'Opportunities', icon: Target, permission: PERMISSIONS.OPPORTUNITIES_READ },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, permission: PERMISSIONS.TASKS_READ },
  { href: '/activities', label: 'Activities', icon: Activity, permission: PERMISSIONS.ACTIVITIES_READ },
  { href: '/reminders', label: 'Reminders', icon: AlarmClock, permission: PERMISSIONS.REMINDERS_READ },
];

const settingsItems = [
  { href: '/settings/profile', label: 'Profile', icon: Settings },
  { href: '/settings/workspace', label: 'Workspace', icon: Building2 },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_READ },
  { href: '/settings/tags', label: 'Tags', icon: Tag, permission: PERMISSIONS.TAGS_READ },
  { href: '/settings/pipeline', label: 'Pipeline', icon: GitBranch, permission: PERMISSIONS.PIPELINE_READ },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard, permission: PERMISSIONS.BILLING_MANAGE },
];

const adminItems = [
  { href: '/settings/admin/roles', label: 'Roles', permission: PERMISSIONS.ADMIN_ROLES_READ },
  { href: '/settings/admin/users', label: 'Users', permission: PERMISSIONS.ADMIN_USERS_READ },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { can, canAdmin } = usePermissions();

  const visibleNav = navItems.filter((item) => can(item.permission));

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
              <span className="block text-sm font-semibold tracking-tight text-foreground">Vibe CRM</span>
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
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'border-l-[3px] border-primary/75 bg-primary/10 pl-2 text-foreground'
                  : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                collapsed && 'justify-center border-l-0 px-0 pl-0',
                collapsed && active && 'bg-primary/10',
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
        {settingsItems
          .filter((item) => !item.permission || can(item.permission))
          .map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors',
                  active
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? label : undefined}
              >
                {collapsed ? <Icon className="h-4 w-4" /> : label}
              </Link>
            );
          })}

        {canAdmin && (
          <>
            {!collapsed && (
              <p className="studio-label mb-1.5 mt-2 px-2 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Admin
              </p>
            )}
            {adminItems
              .filter((item) => can(item.permission))
              .map(({ href, label }) => {
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
                    {collapsed ? <Shield className="h-4 w-4" /> : label}
                  </Link>
                );
              })}
          </>
        )}

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
