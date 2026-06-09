'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { updateContactSchema, type CreateContactInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { z } from 'zod';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

type UpdateContactInput = z.infer<typeof updateContactSchema>;

interface EditContactDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function EditContactDialog({
  contactId,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: EditContactDialogProps) {
  const { can } = usePermissions();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.CONTACTS_UPDATE);
  const canDelete = can(PERMISSIONS.CONTACTS_DELETE);

  const form = useForm<UpdateContactInput>({
    resolver: formResolver<UpdateContactInput>(updateContactSchema),
  });

  useEffect(() => {
    if (!open || !contactId) return;
    setLoading(true);
    Promise.all([
      apiClient.get<CreateContactInput & { id: string }>(`/contacts/${contactId}`),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/companies', { limit: 100 }),
    ])
      .then(([contact, cl, co]) => {
        setClients(cl.data);
        setCompanies(co.data);
        form.reset({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          jobTitle: contact.jobTitle ?? '',
          clientId: contact.clientId,
          companyId: contact.companyId,
          isPrimary: contact.isPrimary,
        });
      })
      .catch(() => setError('Failed to load contact'))
      .finally(() => setLoading(false));
  }, [open, contactId, form]);

  const onSubmit = async (values: UpdateContactInput) => {
    if (!canUpdate) return;
    setError('');
    try {
      await apiClient.patch(`/contacts/${contactId}`, {
        ...values,
        email: values.email || undefined,
        clientId: values.clientId || undefined,
        companyId: values.companyId || undefined,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!confirm('Delete this contact?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/contacts/${contactId}`);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>First name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canUpdate} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Job title</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canUpdate} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Client</FormLabel>
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
                        {clients.map((c) => (
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
                          <SelectValue placeholder="Optional" />
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
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canUpdate}
                      />
                    </FormControl>
                    <FormLabel className="text-[11px] font-normal text-muted-foreground">
                      Primary contact
                    </FormLabel>
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
