'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Plus } from 'lucide-react';
import type { KanbanColumn, PaginatedResponse } from '@vibe-crm/shared';
import { PERMISSIONS } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/opportunities/kanban-board';
import { OpportunityDetailDialog } from '@/components/opportunities/opportunity-detail-dialog';
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface OpportunityRow {
  id: string;
  title: string;
  value: number;
  status: string;
  stage?: { name: string; color: string };
  client?: { name: string } | null;
  expectedCloseDate: string | null;
}

const listColumns: Column<OpportunityRow>[] = [
  { key: 'title', header: 'Title', cell: (row) => <span className="font-medium">{row.title}</span> },
  {
    key: 'value',
    header: 'Value',
    cell: (row) => (
      <span className="font-mono text-sm tabular-nums">{formatCurrency(row.value)}</span>
    ),
  },
  { key: 'stage', header: 'Stage', cell: (row) => row.stage?.name ?? '—' },
  { key: 'client', header: 'Client', cell: (row) => row.client?.name ?? '—' },
  {
    key: 'close',
    header: 'Close date',
    cell: (row) => (
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatDate(row.expectedCloseDate)}
      </span>
    ),
  },
];

function ViewToggle({
  view,
  onChange,
}: {
  view: 'kanban' | 'list';
  onChange: (v: 'kanban' | 'list') => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg border studio-divider bg-muted/40 p-1">
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
          view === 'kanban'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
          view === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
    </div>
  );
}

export default function OpportunitiesPage() {
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [createOpen, setCreateOpen] = useState(false);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [listData, setListData] = useState<OpportunityRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchKanban = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<KanbanColumn[]>('/opportunities/kanban');
      setColumns(data);
    } catch {
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<OpportunityRow>>('/opportunities', {
        page,
        limit: 20,
      });
      setListData(res.data);
      setListTotal(res.meta.total);
    } catch {
      setListData([]);
      setListTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (view === 'kanban') fetchKanban();
    else fetchList();
  }, [view, fetchKanban, fetchList]);

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
        title="Opportunities"
        description="Track deals through your pipeline"
        label="Pipeline"
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} onChange={setView} />
            {can(PERMISSIONS.OPPORTUNITIES_CREATE) && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New opportunity
              </Button>
            )}
          </div>
        }
      />

      {view === 'list' ? (
        <DataTable
          columns={listColumns}
          data={listData}
          total={listTotal}
          page={page}
          limit={20}
          onPageChange={setPage}
          loading={loading}
          onRowClick={(row) => openDetail(row.id)}
        />
      ) : loading ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : (
        <KanbanBoard
          initialColumns={columns}
          onRefresh={fetchKanban}
          onCardClick={openDetail}
        />
      )}

      <OpportunityDetailDialog
        opportunityId={selectedId}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onUpdated={() => {
          if (view === 'kanban') fetchKanban();
          else fetchList();
        }}
      />
      <CreateOpportunityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          if (view === 'kanban') fetchKanban();
          else fetchList();
        }}
      />
    </div>
  );
}
