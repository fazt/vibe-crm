'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { Surface, SurfaceHeader } from '@/components/ui/surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateRoleDialog } from '@/components/admin/create-role-dialog';
import { EditRolePermissionsDialog } from '@/components/admin/edit-role-permissions-dialog';

interface RoleRow {
  id: string;
  slug: string;
  name: string;
  scope: string;
  isSystem: boolean;
  userCount: number;
  permissions: { key: string; name: string }[];
}

export default function AdminRolesPage() {
  const { canAdmin } = usePermissions();
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleRow | null>(null);

  const load = () => {
    apiClient.get<RoleRow[]>('/admin/roles').then(setRoles).catch(() => setRoles([]));
  };

  useEffect(() => {
    if (!canAdmin) {
      router.replace('/dashboard');
      return;
    }
    load();
  }, [canAdmin, router]);

  const handleDelete = async (role: RoleRow) => {
    if (role.isSystem) return;
    if (!confirm(`Delete role "${role.name}"?`)) return;
    await apiClient.delete(`/admin/roles/${role.id}`);
    load();
  };

  if (!canAdmin) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Roles"
        description="System and custom platform roles with permissions"
        label="Admin"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create role
          </Button>
        }
      />

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">All roles</h2>
        </SurfaceHeader>
        <div className="divide-y studio-divider">
          {roles.map((role) => (
            <div key={role.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="space-y-2 text-left"
                onClick={() => setEditRole(role)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {role.scope.toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {role.slug}
                  </Badge>
                  {role.isSystem && (
                    <Badge className="bg-muted text-[10px] text-muted-foreground">system</Badge>
                  )}
                  {role.scope === 'PLATFORM' && role.userCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">{role.userCount} users</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {role.permissions.length} permissions
                  {!role.isSystem ? ' (click to edit)' : ' (read-only)'}
                </p>
              </button>
              {!role.isSystem && role.scope === 'PLATFORM' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => void handleDelete(role)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Surface>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <EditRolePermissionsDialog
        role={editRole}
        open={Boolean(editRole)}
        onOpenChange={(open) => !open && setEditRole(null)}
        onSaved={load}
      />
    </div>
  );
}
