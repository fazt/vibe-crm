'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS, TaskStatus, TaskPriority } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { formatDate } from '@/lib/utils';

interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  client?: { name: string } | null;
}

const statusColors: Record<TaskStatus, 'secondary' | 'warning' | 'success' | 'outline'> = {
  [TaskStatus.TODO]: 'secondary',
  [TaskStatus.IN_PROGRESS]: 'warning',
  [TaskStatus.DONE]: 'success',
  [TaskStatus.CANCELLED]: 'outline',
};

const columns: Column<TaskRow>[] = [
  { key: 'title', header: 'Task', cell: (row) => <span className="font-medium">{row.title}</span> },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={statusColors[row.status]}>{row.status.replace('_', ' ')}</Badge>
    ),
  },
  {
    key: 'priority',
    header: 'Priority',
    cell: (row) => <span className="capitalize text-muted-foreground">{row.priority.toLowerCase()}</span>,
  },
  {
    key: 'due',
    header: 'Due',
    cell: (row) => (
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatDate(row.dueDate)}
      </span>
    ),
  },
  { key: 'client', header: 'Client', cell: (row) => row.client?.name ?? '—' },
];

export default function TasksPageClient() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [data, setData] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<TaskRow>>('/tasks', {
        page,
        limit: 20,
        search: search || undefined,
      });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedId(id);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setSelectedId(null);
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Track follow-ups and to-dos"
        actions={
          can(PERMISSIONS.TASKS_CREATE) ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New task
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        loading={loading}
        onRowClick={(row) => openDetail(row.id)}
      />

      <TaskDialog
        taskId={selectedId}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSaved={fetchData}
      />
      <TaskDialog
        taskId={null}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={fetchData}
      />
    </div>
  );
}
