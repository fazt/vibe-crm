'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
} from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS, TaskPriority, TaskStatus } from '@vibe-crm/shared';
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

type TaskFormInput = z.infer<typeof createTaskSchema>;

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  clientId: string | null;
  opportunityId: string | null;
  assigneeId: string | null;
  client?: { id: string; name: string } | null;
  opportunity?: { id: string; title: string } | null;
  assignee?: { id: string; firstName: string; lastName: string } | null;
}

interface TaskDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  defaultClientId?: string;
  defaultOpportunityId?: string;
}

const labelClass = 'studio-label';
const selectTriggerClass = 'studio-inset rounded-lg';

export function TaskDialog({
  taskId,
  open,
  onOpenChange,
  onSaved,
  defaultClientId,
  defaultOpportunityId,
}: TaskDialogProps) {
  const isCreate = !taskId;
  const { can } = usePermissions();
  const { members } = useWorkspaceMembers();
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [opportunities, setOpportunities] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canUpdate = can(PERMISSIONS.TASKS_UPDATE);
  const canDelete = can(PERMISSIONS.TASKS_DELETE);
  const canCreate = can(PERMISSIONS.TASKS_CREATE);

  const form = useForm<TaskFormInput>({
    resolver: formResolver<TaskFormInput>(isCreate ? createTaskSchema : updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      clientId: defaultClientId,
      opportunityId: defaultOpportunityId,
    },
  });

  const loadOptions = useCallback(async () => {
    const [cl, op] = await Promise.all([
      apiClient.get<PaginatedResponse<{ id: string; name: string }>>('/clients', { limit: 100 }),
      apiClient.get<PaginatedResponse<{ id: string; title: string }>>('/opportunities', { limit: 100 }),
    ]);
    setClients(cl.data);
    setOpportunities(op.data);
  }, []);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get<TaskDetail>(`/tasks/${taskId}`);
      form.reset({
        title: data.title,
        description: data.description ?? '',
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        clientId: data.clientId ?? undefined,
        opportunityId: data.opportunityId ?? undefined,
        assigneeId: data.assigneeId ?? undefined,
      });
    } catch {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId, form]);

  useEffect(() => {
    if (!open) return;
    void loadOptions();
    if (taskId) void loadTask();
    else {
      form.reset({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        clientId: defaultClientId,
        opportunityId: defaultOpportunityId,
      });
      setError('');
    }
  }, [open, taskId, loadTask, loadOptions, form, defaultClientId, defaultOpportunityId]);

  const onSubmit = async (values: TaskFormInput) => {
    setError('');
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        clientId: values.clientId || undefined,
        opportunityId: values.opportunityId || undefined,
        assigneeId: values.assigneeId || undefined,
      };
      if (isCreate) {
        if (!canCreate) return;
        await apiClient.post('/tasks', payload);
      } else if (taskId) {
        if (!canUpdate) return;
        await apiClient.patch(`/tasks/${taskId}`, payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!taskId || !canDelete) return;
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    setError('');
    try {
      await apiClient.delete(`/tasks/${taskId}`);
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
          <DialogTitle>{isCreate ? 'New task' : loading ? 'Loading...' : 'Task details'}</DialogTitle>
        </DialogHeader>

        {loading && !isCreate ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TaskStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace('_', ' ')}
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(TaskPriority).map((p) => (
                            <SelectItem key={p} value={p}>
                              {p.charAt(0) + p.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Due date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={readOnly}
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
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Assignee</FormLabel>
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
                      {form.formState.isSubmitting ? 'Saving...' : isCreate ? 'Create' : 'Save'}
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
