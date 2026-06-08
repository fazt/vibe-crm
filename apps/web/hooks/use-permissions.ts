'use client';

import {
  PERMISSION_SCOPE,
  PERMISSIONS,
  PlatformRoleSlug,
  type PermissionKey,
} from '@vibe-crm/shared';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const hasWorkspace = useWorkspaceStore((s) => !!s.currentWorkspaceId);

  const platformPermissions =
    user?.platformPermissions ?? user?.permissions ?? [];
  const workspacePermissions = user?.workspacePermissions ?? [];

  const isSuperAdmin = user?.isSuperAdmin ?? user?.role?.slug === PlatformRoleSlug.SUPERADMIN;
  const isSubscriber = user?.isSubscriber ?? user?.role?.slug === PlatformRoleSlug.SUBSCRIBER;

  const can = (permission: string) => {
    if (isSuperAdmin) return true;

    const scope = PERMISSION_SCOPE[permission as PermissionKey];
    if (scope === 'PLATFORM') {
      return platformPermissions.includes(permission);
    }
    if (scope === 'WORKSPACE') {
      return hasWorkspace && workspacePermissions.includes(permission);
    }
    return false;
  };

  return {
    user,
    permissions: [...platformPermissions, ...workspacePermissions],
    platformPermissions,
    workspacePermissions,
    workspaceRole: user?.workspaceRole,
    isSuperAdmin,
    isSubscriber,
    isFreeUser: user?.role?.slug === PlatformRoleSlug.USER && !isSubscriber,
    can,
    canManageBilling: can(PERMISSIONS.BILLING_MANAGE),
    canAdmin: can(PERMISSIONS.ADMIN_ROLES_READ),
    plan: user?.plan,
    planLimits: user?.planLimits,
    usage: user?.usage,
  };
}
