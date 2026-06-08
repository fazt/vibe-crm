'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { TaskStatus, TaskPriority } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
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

export default function TasksPage() {
  const [data, setData] = useState<TaskRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <PageHeader title="Tasks" description="Track follow-ups and to-dos" />
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
      />
    </div>
  );
}
