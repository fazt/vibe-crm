'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createOpportunitySchema, type CreateOpportunityInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
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

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  defaultClientId?: string;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  onCreated,
  defaultClientId,
}: CreateOpportunityDialogProps) {
  const { can } = usePermissions();
  const { members } = useWorkspaceMembers();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [error, setError] = useState('');

  const form = useForm<CreateOpportunityInput>({
    resolver: formResolver<CreateOpportunityInput>(createOpportunitySchema),
    defaultValues: {
      title: '',
      value: 0,
      probability: 0,
      description: '',
      clientId: defaultClientId,
    },
  });

  const clientId = form.watch('clientId');

  useEffect(() => {
    if (!open) return;
    setError('');
    Promise.all([
      apiClient.get<PipelineStage[]>('/pipeline/stages'),
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
    ]).then(([st, cl]) => {
      setStages(st);
      setClients(cl.data);
      form.reset({
        title: '',
        value: 0,
        probability: 0,
        description: '',
        clientId: defaultClientId,
        stageId: st[0]?.id,
      });
    });
  }, [open, defaultClientId, form]);

  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      return;
    }
    apiClient
      .get<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>('/contacts', {
        clientId,
        limit: 50,
      })
      .then((res) => setContacts(res.data))
      .catch(() => setContacts([]));
  }, [clientId]);

  const onSubmit = async (values: CreateOpportunityInput) => {
    if (!can(PERMISSIONS.OPPORTUNITIES_CREATE)) return;
    setError('');
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        clientId: values.clientId || undefined,
        contactId: values.contactId || undefined,
        assigneeId: values.assigneeId || undefined,
        expectedCloseDate: values.expectedCloseDate || undefined,
      };
      await apiClient.post('/opportunities', payload);
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Create failed');
    }
  };

  if (!can(PERMISSIONS.OPPORTUNITIES_CREATE)) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New opportunity</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Value</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Probability %</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="expectedCloseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Expected close</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
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
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Client</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v || undefined)}
                    value={field.value ?? ''}
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
                    disabled={!clientId}
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
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Assignee</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v || undefined)}
                    value={field.value ?? ''}
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
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
