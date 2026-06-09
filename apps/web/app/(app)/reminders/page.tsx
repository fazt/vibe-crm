'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formResolver } from '@/lib/form';
import { createReminderSchema, type CreateReminderInput } from '@vibe-crm/validators';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { EntityType, PERMISSIONS } from '@vibe-crm/shared';
import { apiClient, ApiRequestError } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { formatDate } from '@/lib/utils';

interface ReminderRow {
  id: string;
  title: string;
  message: string | null;
  dueAt: string;
  sent: boolean;
  entityType: EntityType | null;
}

const columns: Column<ReminderRow>[] = [
  { key: 'title', header: 'Reminder', cell: (row) => <span className="font-medium">{row.title}</span> },
  {
    key: 'due',
    header: 'Due',
    cell: (row) => (
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatDate(row.dueAt)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={row.sent ? 'success' : 'warning'}>{row.sent ? 'Sent' : 'Pending'}</Badge>
    ),
  },
];

export default function RemindersPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<ReminderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CreateReminderInput>({
    resolver: formResolver<CreateReminderInput>(createReminderSchema),
    defaultValues: { title: '', message: '', dueAt: new Date() },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<ReminderRow>>('/reminders', {
        page,
        limit: 20,
      });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (values: CreateReminderInput) => {
    setError('');
    try {
      await apiClient.post('/reminders', {
        ...values,
        message: values.message || undefined,
      });
      setCreateOpen(false);
      form.reset({ title: '', message: '', dueAt: new Date() });
      fetchData();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Create failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!can(PERMISSIONS.REMINDERS_DELETE)) return;
    if (!confirm('Delete this reminder?')) return;
    await apiClient.delete(`/reminders/${id}`);
    fetchData();
  };

  const columnsWithActions: Column<ReminderRow>[] = [
    ...columns,
    {
      key: 'actions',
      header: '',
      cell: (row) =>
        can(PERMISSIONS.REMINDERS_DELETE) ? (
          <Button variant="ghost" size="sm" onClick={() => void handleDelete(row.id)}>
            Delete
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="Scheduled follow-up reminders"
        actions={
          can(PERMISSIONS.REMINDERS_CREATE) ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New reminder
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columnsWithActions}
        data={data}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        loading={loading}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New reminder</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Message</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Due at</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
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
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="studio-label">Entity type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(EntityType).map((t) => (
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
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
