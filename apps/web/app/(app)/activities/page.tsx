'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ActivityType } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/lib/utils';

interface ActivityRow {
  id: string;
  title: string;
  type: ActivityType;
  occurredAt: string;
  client?: { name: string } | null;
  contact?: { firstName: string; lastName: string } | null;
}

const columns: Column<ActivityRow>[] = [
  { key: 'title', header: 'Activity', cell: (row) => <span className="font-medium">{row.title}</span> },
  {
    key: 'type',
    header: 'Type',
    cell: (row) => (
      <Badge variant="outline" className="capitalize">
        {row.type.toLowerCase()}
      </Badge>
    ),
  },
  {
    key: 'client',
    header: 'Client',
    cell: (row) => row.client?.name ?? '—',
  },
  {
    key: 'when',
    header: 'When',
    cell: (row) => (
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatRelativeDate(row.occurredAt)}
      </span>
    ),
  },
];

export default function ActivitiesPage() {
  const [data, setData] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<ActivityRow>>('/activities', {
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
      <PageHeader title="Activities" description="Calls, emails, meetings and more" />
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
