'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutGrid, List } from 'lucide-react';
import type { KanbanColumn, KanbanCard, PaginatedResponse } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { DataTable, Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface } from '@/components/ui/surface';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
    <div className="inline-flex h-9 items-center rounded-lg border studio-divider bg-stone-950/45 p-1">
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
          view === 'kanban'
            ? 'bg-amber-500/15 text-amber-50/95 shadow-[inset_0_-2px_0_0_hsl(32_82%_52%/0.7)]'
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
            ? 'bg-amber-500/15 text-amber-50/95 shadow-[inset_0_-2px_0_0_hsl(32_82%_52%/0.7)]'
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
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [listData, setListData] = useState<OpportunityRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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

  const findCard = (id: string) => {
    for (const col of columns) {
      const card = col.opportunities.find((o) => o.id === id);
      if (card) return { card, columnId: col.id };
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const found = findCard(String(event.active.id));
    if (found) setActiveCard(found.card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findCard(activeId);
    if (!source) return;

    let targetColumnId = overId;
    const overCard = findCard(overId);
    if (overCard) targetColumnId = overCard.columnId;

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (!targetColumn || source.columnId === targetColumnId) return;

    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === source.columnId) {
          return { ...col, opportunities: col.opportunities.filter((o) => o.id !== activeId) };
        }
        if (col.id === targetColumnId) {
          return { ...col, opportunities: [...col.opportunities, source.card] };
        }
        return col;
      }),
    );

    try {
      await apiClient.patch(`/opportunities/${activeId}/stage`, {
        stageId: targetColumnId,
        order: targetColumn.opportunities.length,
      });
    } catch {
      fetchKanban();
    }
  };

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Track deals through your pipeline"
        label="Pipeline"
        actions={<ViewToggle view={view} onChange={setView} />}
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
        />
      ) : loading ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((col) => (
              <KanbanColumnView key={col.id} column={col} />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? <OpportunityCard card={activeCard} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function KanbanColumnView({ column }: { column: KanbanColumn }) {
  const ids = column.opportunities.map((o) => o.id);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="studio-label">{column.name}</span>
        <Badge variant="secondary" className="ml-auto h-5 px-1.5 font-mono text-[10px] tabular-nums">
          {column.opportunities.length}
        </Badge>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy} id={column.id}>
        <Surface
          id={column.id}
          padding="sm"
          className="flex min-h-[200px] flex-1 flex-col gap-2"
        >
          {column.opportunities.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </Surface>
      </SortableContext>
    </div>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OpportunityCard card={card} isDragging={isDragging} />
    </div>
  );
}

function OpportunityCard({ card, isDragging }: { card: KanbanCard; isDragging?: boolean }) {
  return (
    <Surface
      padding="sm"
      className={cn(
        'cursor-grab transition-colors hover:border-amber-800/50 active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      <p className="text-sm font-medium leading-tight">{card.title}</p>
      <p className="mt-2 font-mono text-sm tabular-nums">{formatCurrency(card.value)}</p>
      {card.clientName && (
        <p className="mt-1 text-[11px] text-muted-foreground">{card.clientName}</p>
      )}
      {card.dueDate && (
        <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          Close {formatDate(card.dueDate)}
        </p>
      )}
    </Surface>
  );
}
