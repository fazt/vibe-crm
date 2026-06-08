'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { Surface, SurfaceHeader } from '@/components/ui/surface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; slug: string; name: string };
  subscription?: { plan: string; status: string } | null;
}

interface RoleOption {
  id: string;
  slug: string;
  name: string;
  scope: string;
}

export default function AdminUsersPage() {
  const { canAdmin } = usePermissions();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    const [u, r] = await Promise.all([
      apiClient.get<AdminUser[]>('/admin/users'),
      apiClient.get<RoleOption[]>('/admin/roles'),
    ]);
    setUsers(u);
    setRoles(r.filter((role) => role.scope === 'PLATFORM'));
  };

  useEffect(() => {
    if (!canAdmin) {
      router.replace('/dashboard');
      return;
    }
    void load();
  }, [canAdmin, router]);

  const assignRole = async (userId: string, roleId: string) => {
    await apiClient.patch(`/admin/users/${userId}/role`, { roleId });
    await load();
  };

  if (!canAdmin) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Users"
        description="Create users and assign platform roles"
        label="Admin"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create user
          </Button>
        }
      />

      <Surface padding="none">
        <SurfaceHeader>
          <h2 className="text-sm font-medium">Platform users</h2>
        </SurfaceHeader>
        <ul className="divide-y studio-divider">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {u.firstName} {u.lastName}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">{u.email}</p>
                <div className="mt-1 flex gap-2">
                  {u.subscription && (
                    <Badge variant="outline" className="text-[10px]">
                      {u.subscription.plan} · {u.subscription.status}
                    </Badge>
                  )}
                </div>
              </div>
              <Select value={u.role.id} onValueChange={(roleId) => void assignRole(u.id, roleId)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </Surface>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onCreated={load}
      />
    </div>
  );
}
