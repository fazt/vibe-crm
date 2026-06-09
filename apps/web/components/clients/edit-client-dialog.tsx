'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { updateClientSchema, type CreateClientInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ClientStatus, PERMISSIONS } from '@vibe-crm/shared';
import { z } from 'zod';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type UpdateClientInput = z.infer<typeof updateClientSchema>;

interface EditClientDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function EditClientDialog({
  clientId,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: EditClientDialogProps) {
  const { can } = usePermissions();
  const { members } = useWorkspaceMembers();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.CLIENTS_UPDATE);
  const canDelete = can(PERMISSIONS.CLIENTS_DELETE);

  const form = useForm<UpdateClientInput>({
    resolver: formResolver<UpdateClientInput>(updateClientSchema),
  });

  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    Promise.all([
      apiClient.get<CreateClientInput & { id: string; companyId?: string }>(`/clients/${clientId}`),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/companies', { limit: 100 }),
    ])
      .then(([client, co]) => {
        setCompanies(co.data);
        form.reset({
          name: client.name,
          email: client.email ?? '',
          phone: client.phone ?? '',
          status: client.status,
          website: client.website ?? '',
          description: client.description ?? '',
          companyId: client.companyId,
          assigneeId: client.assigneeId,
        });
      })
      .catch(() => setError('Failed to load client'))
      .finally(() => setLoading(false));
  }, [open, clientId, form]);

  const onSubmit = async (values: UpdateClientInput) => {
    if (!canUpdate) return;
    setError('');
    try {
      await apiClient.patch(`/clients/${clientId}`, {
        ...values,
        email: values.email || undefined,
        website: values.website || undefined,
        companyId: values.companyId || undefined,
        assigneeId: values.assigneeId || undefined,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!confirm('Delete this client and all related data?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/clients/${clientId}`);
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (!canUpdate && !canDelete) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ClientStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Company</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v || undefined)}
                      value={field.value ?? ''}
                      disabled={!canUpdate}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Assignee</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v || undefined)}
                      value={field.value ?? ''}
                      disabled={!canUpdate}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-between gap-2">
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    Delete
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  {canUpdate && (
                    <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
