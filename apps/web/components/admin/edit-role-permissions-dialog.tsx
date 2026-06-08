'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiRequestError } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Permission {
  id: string;
  key: string;
  name: string;
  scope: string;
}

interface RoleRow {
  id: string;
  slug: string;
  name: string;
  isSystem: boolean;
  permissions: { key: string; name: string }[];
}

interface EditRolePermissionsDialogProps {
  role: RoleRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditRolePermissionsDialog({
  role,
  open,
  onOpenChange,
  onSaved,
}: EditRolePermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    apiClient.get<Permission[]>('/admin/permissions').then(setPermissions).catch(() => setPermissions([]));
  }, [open]);

  useEffect(() => {
    if (role) {
      setSelected(new Set(role.permissions.map((p) => p.key)));
    }
  }, [role]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.patch(`/admin/roles/${role.id}/permissions`, {
        permissionKeys: Array.from(selected),
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const readOnly = role?.isSystem ?? true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role?.name ?? 'Role'}
            {readOnly && <Badge variant="secondary">read-only</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {permissions.map((p) => (
            <label
              key={p.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
            >
              <Checkbox
                checked={selected.has(p.key)}
                onCheckedChange={() => toggle(p.key)}
                disabled={readOnly}
              />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{p.key}</p>
              </div>
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {!readOnly && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving || selected.size === 0}>
              {saving ? 'Saving...' : 'Save permissions'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
