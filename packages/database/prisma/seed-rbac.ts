import { PrismaClient, RoleScope } from '@prisma/client';
import {
  ALL_PERMISSION_KEYS,
  ADMIN_ROLE_PERMISSIONS,
  MEMBER_ROLE_PERMISSIONS,
  OWNER_PERMISSIONS,
  PERMISSIONS,
  PlatformRoleSlug,
  SUBSCRIBER_EXTRA_PERMISSIONS,
  USER_PLATFORM_PERMISSIONS,
  WorkspaceRoleSlug,
} from '@vibe-crm/shared';

const ROLE_IDS = {
  USER: '00000000-0000-4000-8000-000000000001',
  SUBSCRIBER: '00000000-0000-4000-8000-000000000002',
  SUPERADMIN: '00000000-0000-4000-8000-000000000003',
  OWNER: '00000000-0000-4000-8000-000000000010',
  ADMIN: '00000000-0000-4000-8000-000000000011',
  MEMBER: '00000000-0000-4000-8000-000000000012',
} as const;

const PERMISSION_LABELS: Record<string, { name: string; scope: RoleScope }> = {
  [PERMISSIONS.APP_ACCESS]: { name: 'Access application', scope: RoleScope.PLATFORM },
  [PERMISSIONS.PROFILE_READ]: { name: 'Read profile', scope: RoleScope.PLATFORM },
  [PERMISSIONS.PROFILE_UPDATE]: { name: 'Update profile', scope: RoleScope.PLATFORM },
  [PERMISSIONS.BILLING_MANAGE]: { name: 'Manage billing', scope: RoleScope.PLATFORM },
  [PERMISSIONS.DASHBOARD_READ]: { name: 'View dashboard', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.SEARCH_USE]: { name: 'Use search', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CLIENTS_READ]: { name: 'Read clients', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CLIENTS_CREATE]: { name: 'Create clients', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CLIENTS_UPDATE]: { name: 'Update clients', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CLIENTS_DELETE]: { name: 'Delete clients', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.COMPANIES_READ]: { name: 'Read companies', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.COMPANIES_CREATE]: { name: 'Create companies', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.COMPANIES_UPDATE]: { name: 'Update companies', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.COMPANIES_DELETE]: { name: 'Delete companies', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CONTACTS_READ]: { name: 'Read contacts', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CONTACTS_CREATE]: { name: 'Create contacts', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CONTACTS_UPDATE]: { name: 'Update contacts', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.CONTACTS_DELETE]: { name: 'Delete contacts', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.OPPORTUNITIES_READ]: { name: 'Read opportunities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.OPPORTUNITIES_CREATE]: { name: 'Create opportunities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.OPPORTUNITIES_UPDATE]: { name: 'Update opportunities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.OPPORTUNITIES_DELETE]: { name: 'Delete opportunities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.OPPORTUNITIES_MOVE]: { name: 'Move opportunities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.PIPELINE_READ]: { name: 'Read pipeline', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.PIPELINE_MANAGE]: { name: 'Manage pipeline', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TASKS_READ]: { name: 'Read tasks', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TASKS_CREATE]: { name: 'Create tasks', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TASKS_UPDATE]: { name: 'Update tasks', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TASKS_DELETE]: { name: 'Delete tasks', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTES_READ]: { name: 'Read notes', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTES_CREATE]: { name: 'Create notes', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTES_UPDATE]: { name: 'Update notes', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTES_DELETE]: { name: 'Delete notes', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.ACTIVITIES_READ]: { name: 'Read activities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.ACTIVITIES_CREATE]: { name: 'Create activities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.ACTIVITIES_UPDATE]: { name: 'Update activities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.ACTIVITIES_DELETE]: { name: 'Delete activities', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.REMINDERS_READ]: { name: 'Read reminders', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.REMINDERS_CREATE]: { name: 'Create reminders', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.REMINDERS_UPDATE]: { name: 'Update reminders', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.REMINDERS_DELETE]: { name: 'Delete reminders', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.DOCUMENTS_READ]: { name: 'Read documents', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.DOCUMENTS_UPLOAD]: { name: 'Upload documents', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.DOCUMENTS_DELETE]: { name: 'Delete documents', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TAGS_READ]: { name: 'Read tags', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TAGS_CREATE]: { name: 'Create tags', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TAGS_UPDATE]: { name: 'Update tags', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TAGS_DELETE]: { name: 'Delete tags', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.TAGS_ASSIGN]: { name: 'Assign tags', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTIFICATIONS_READ]: { name: 'Read notifications', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.NOTIFICATIONS_UPDATE]: { name: 'Update notifications', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACES_CREATE]: { name: 'Create workspaces', scope: RoleScope.PLATFORM },
  [PERMISSIONS.WORKSPACE_READ]: { name: 'Read workspace', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_UPDATE]: { name: 'Update workspace', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_DELETE]: { name: 'Delete workspace', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_MEMBERS_READ]: { name: 'Read members', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_MEMBERS_INVITE]: { name: 'Invite members', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_MEMBERS_UPDATE]: { name: 'Update member roles', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.WORKSPACE_MEMBERS_REMOVE]: { name: 'Remove members', scope: RoleScope.WORKSPACE },
  [PERMISSIONS.ADMIN_ROLES_READ]: { name: 'Read roles', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_ROLES_CREATE]: { name: 'Create roles', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_ROLES_UPDATE]: { name: 'Update roles', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_ROLES_DELETE]: { name: 'Delete roles', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_USERS_READ]: { name: 'Read users', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_USERS_CREATE]: { name: 'Create users', scope: RoleScope.PLATFORM },
  [PERMISSIONS.ADMIN_USERS_UPDATE]: { name: 'Update users', scope: RoleScope.PLATFORM },
};

export async function seedRbac(prisma: PrismaClient) {
  for (const key of ALL_PERMISSION_KEYS) {
    const meta = PERMISSION_LABELS[key];
    await prisma.permission.upsert({
      where: { key },
      update: { name: meta.name, scope: meta.scope },
      create: { key, name: meta.name, scope: meta.scope },
    });
  }

  const roles = [
    { id: ROLE_IDS.USER, slug: PlatformRoleSlug.USER, name: 'User', scope: RoleScope.PLATFORM, description: 'Free tier with limits' },
    { id: ROLE_IDS.SUBSCRIBER, slug: PlatformRoleSlug.SUBSCRIBER, name: 'Subscriber', scope: RoleScope.PLATFORM, description: 'Paid subscriber' },
    { id: ROLE_IDS.SUPERADMIN, slug: PlatformRoleSlug.SUPERADMIN, name: 'Super Admin', scope: RoleScope.PLATFORM, description: 'Platform administrator' },
    { id: ROLE_IDS.OWNER, slug: WorkspaceRoleSlug.OWNER, name: 'Owner', scope: RoleScope.WORKSPACE, description: 'Workspace owner' },
    { id: ROLE_IDS.ADMIN, slug: WorkspaceRoleSlug.ADMIN, name: 'Admin', scope: RoleScope.WORKSPACE, description: 'Workspace admin' },
    { id: ROLE_IDS.MEMBER, slug: WorkspaceRoleSlug.MEMBER, name: 'Member', scope: RoleScope.WORKSPACE, description: 'Workspace member' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { scope_slug: { scope: role.scope, slug: role.slug } },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { ...role, isSystem: true },
    });
  }

  const permissions = await prisma.permission.findMany();
  const permByKey = Object.fromEntries(permissions.map((p) => [p.key, p.id]));

  async function assignPermissions(roleId: string, keys: string[]) {
    for (const key of keys) {
      const permissionId = permByKey[key];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  await assignPermissions(ROLE_IDS.USER, USER_PLATFORM_PERMISSIONS);
  await assignPermissions(ROLE_IDS.SUBSCRIBER, [
    ...USER_PLATFORM_PERMISSIONS,
    ...SUBSCRIBER_EXTRA_PERMISSIONS,
  ]);
  await assignPermissions(ROLE_IDS.SUPERADMIN, ALL_PERMISSION_KEYS);
  await assignPermissions(ROLE_IDS.OWNER, OWNER_PERMISSIONS);
  await assignPermissions(ROLE_IDS.ADMIN, ADMIN_ROLE_PERMISSIONS);
  await assignPermissions(ROLE_IDS.MEMBER, MEMBER_ROLE_PERMISSIONS);

  return ROLE_IDS;
}

export async function getRoleIdBySlug(prisma: PrismaClient, scope: RoleScope, slug: string) {
  const role = await prisma.role.findUnique({
    where: { scope_slug: { scope, slug } },
  });
  if (!role) throw new Error(`Role not found: ${scope}/${slug}`);
  return role.id;
}
