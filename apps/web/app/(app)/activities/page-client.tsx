'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@vibe-crm/shared';
import { ActivityType, PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActivityDialog } from '@/components/activities/activity-dialog';
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

export default function ActivitiesPageClient() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [data, setData] = useState<ActivityRow[]>([]);
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
        title="Activities"
        description="Calls, emails, meetings and more"
        actions={
          can(PERMISSIONS.ACTIVITIES_CREATE) ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Log activity
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

      <ActivityDialog
        activityId={selectedId}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSaved={fetchData}
      />
      <ActivityDialog
        activityId={null}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={fetchData}
      />
    </div>
  );
}
