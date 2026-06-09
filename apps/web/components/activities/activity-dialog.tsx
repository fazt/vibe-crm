'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityInput,
} from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ActivityType, PERMISSIONS } from '@vibe-crm/shared';
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

type ActivityFormInput = z.infer<typeof createActivitySchema>;

interface ActivityDialogProps {
  activityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  defaultClientId?: string;
  defaultContactId?: string;
  defaultOpportunityId?: string;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function ActivityDialog({
  activityId,
  open,
  onOpenChange,
  onSaved,
  defaultClientId,
  defaultContactId,
  defaultOpportunityId,
}: ActivityDialogProps) {
  const isCreate = !activityId;
  const { can } = usePermissions();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [opportunities, setOpportunities] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.ACTIVITIES_UPDATE);
  const canDelete = can(PERMISSIONS.ACTIVITIES_DELETE);
  const canCreate = can(PERMISSIONS.ACTIVITIES_CREATE);

  const form = useForm<ActivityFormInput>({
    resolver: formResolver<ActivityFormInput>(isCreate ? createActivitySchema : updateActivitySchema),
    defaultValues: {
      type: ActivityType.CALL,
      title: '',
      description: '',
      clientId: defaultClientId,
      contactId: defaultContactId,
      opportunityId: defaultOpportunityId,
      occurredAt: new Date(),
    },
  });

  const loadOptions = useCallback(async () => {
    const [cl, co, op] = await Promise.all([
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
      apiClient.get<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>('/contacts', { limit: 100 }),
      apiClient.get<PaginatedResponse<{ id: string; title: string }>>('/opportunities', { limit: 100 }),
    ]);
    setClients(cl.data);
    setContacts(co.data);
    setOpportunities(op.data);
  }, []);

  const loadActivity = useCallback(async () => {
    if (!activityId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<ActivityFormInput & { id: string; occurredAt: string }>(
        `/activities/${activityId}`,
      );
      form.reset({
        type: data.type,
        title: data.title,
        description: data.description ?? '',
        duration: data.duration,
        outcome: data.outcome ?? '',
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        clientId: data.clientId ?? undefined,
        contactId: data.contactId ?? undefined,
        opportunityId: data.opportunityId ?? undefined,
      });
    } catch {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [activityId, form]);

  useEffect(() => {
    if (!open) return;
    void loadOptions();
    if (activityId) void loadActivity();
    else {
      form.reset({
        type: ActivityType.CALL,
        title: '',
        description: '',
        clientId: defaultClientId,
        contactId: defaultContactId,
        opportunityId: defaultOpportunityId,
        occurredAt: new Date(),
      });
      setError('');
    }
  }, [open, activityId, loadActivity, loadOptions, form, defaultClientId, defaultContactId, defaultOpportunityId]);

  const onSubmit = async (values: ActivityFormInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        outcome: values.outcome || undefined,
        clientId: values.clientId || undefined,
        contactId: values.contactId || undefined,
        opportunityId: values.opportunityId || undefined,
      };
      if (isCreate) {
        if (!canCreate) return;
        await apiClient.post('/activities', payload);
      } else if (activityId) {
        if (!canUpdate) return;
        await apiClient.patch(`/activities/${activityId}`, payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!activityId || !canDelete) return;
    if (!confirm('Delete this activity?')) return;
    setDeleting(true);
    setError('');
    try {
      await apiClient.delete(`/activities/${activityId}`);
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const readOnly = !isCreate && !canUpdate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Log activity' : loading ? 'Loading...' : 'Activity details'}</DialogTitle>
        </DialogHeader>

        {loading && !isCreate ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ActivityType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0) + t.slice(1).toLowerCase()}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Title</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
                    </FormControl>
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
                      <Textarea rows={3} {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="occurredAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={readOnly}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) =>
                            field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Duration (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          disabled={readOnly}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Outcome</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} />
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
                      disabled={readOnly}
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
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Contact</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v || undefined)}
                      value={field.value ?? ''}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
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
                name="opportunityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Opportunity</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v || undefined)}
                      value={field.value ?? ''}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {opportunities.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-between gap-2">
                {!isCreate && canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  {(isCreate ? canCreate : canUpdate) && (
                    <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : isCreate ? 'Log' : 'Save'}
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
