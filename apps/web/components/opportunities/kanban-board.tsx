'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { KanbanCard, KanbanColumn } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { KanbanColumnView } from './kanban-column';
import { OpportunityCard } from './opportunity-card';
import { OPPORTUNITY_EVENTS, useWorkspaceSocket } from '@/hooks/use-workspace-socket';

interface KanbanBoardProps {
  initialColumns: KanbanColumn[];
  onRefresh: () => void;
  onCardClick: (cardId: string) => void;
}

function findCard(columns: KanbanColumn[], id: string) {
  for (const col of columns) {
    const card = col.opportunities.find((o) => o.id === id);
    if (card) return { card, columnId: col.id, column: col };
  }
  return null;
}

function cardToKanbanCard(opp: {
  id: string;
  title: string;
  value: number;
  probability?: number;
  client?: { name: string } | null;
  contact?: { firstName: string; lastName: string } | null;
  assignee?: { firstName: string; lastName: string } | null;
  expectedCloseDate?: string | Date | null;
  order?: number;
}): KanbanCard {
  return {
    id: opp.id,
    title: opp.title,
    value: opp.value,
    probability: opp.probability ?? 0,
    clientName: opp.client?.name,
    contactName: opp.contact ? `${opp.contact.firstName} ${opp.contact.lastName}` : undefined,
    assigneeName: opp.assignee ? `${opp.assignee.firstName} ${opp.assignee.lastName}` : undefined,
    dueDate: opp.expectedCloseDate
      ? typeof opp.expectedCloseDate === 'string'
        ? opp.expectedCloseDate
        : opp.expectedCloseDate.toISOString()
      : null,
    order: opp.order ?? 0,
  };
}

export function KanbanBoard({ initialColumns, onRefresh, onCardClick }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleRemoteStageChange = useCallback((payload: unknown) => {
    const data = payload as {
      opportunity: {
        id: string;
        title: string;
        value: number;
        probability: number;
        status: string;
        stageId: string;
        order: number;
        expectedCloseDate?: string | null;
        client?: { name: string } | null;
        contact?: { firstName: string; lastName: string } | null;
        assignee?: { firstName: string; lastName: string } | null;
      };
      stageId: string;
      order?: number;
    };

    const opp = data.opportunity;
    if (opp.status !== 'OPEN') {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          opportunities: col.opportunities.filter((c) => c.id !== opp.id),
        })),
      );
      return;
    }

    const card = cardToKanbanCard(opp);

    setColumns((prev) => {
      const without = prev.map((col) => ({
        ...col,
        opportunities: col.opportunities.filter((c) => c.id !== opp.id),
      }));

      return without.map((col) => {
        if (col.id !== data.stageId) return col;
        const next = [...col.opportunities];
        const insertAt = data.order ?? next.length;
        next.splice(Math.min(insertAt, next.length), 0, card);
        return { ...col, opportunities: next };
      });
    });
  }, []);

  const socketHandlers = useMemo(
    () => ({
      [OPPORTUNITY_EVENTS.STAGE_CHANGED]: handleRemoteStageChange,
      [OPPORTUNITY_EVENTS.UPDATED]: handleRemoteStageChange,
      [OPPORTUNITY_EVENTS.CREATED]: () => onRefresh(),
      [OPPORTUNITY_EVENTS.DELETED]: (payload: unknown) => {
        const { id } = payload as { id: string };
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            opportunities: col.opportunities.filter((c) => c.id !== id),
          })),
        );
      },
    }),
    [handleRemoteStageChange, onRefresh],
  );

  useWorkspaceSocket(socketHandlers);

  const handleDragStart = (event: DragStartEvent) => {
    const found = findCard(columns, String(event.active.id));
    if (found) setActiveCard(found.card);
    setError('');
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findCard(columns, activeId);
    if (!source) return;

    let targetColumnId = overId;
    const overCard = findCard(columns, overId);
    if (overCard) targetColumnId = overCard.columnId;

    setOverColumnId(targetColumnId);

    if (source.columnId === targetColumnId) {
      const col = columns.find((c) => c.id === targetColumnId);
      if (!col) return;
      const oldIndex = col.opportunities.findIndex((c) => c.id === activeId);
      const newIndex = overCard
        ? col.opportunities.findIndex((c) => c.id === overId)
        : col.opportunities.length - 1;
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) =>
          prev.map((c) =>
            c.id === targetColumnId
              ? { ...c, opportunities: arrayMove(c.opportunities, oldIndex, newIndex) }
              : c,
          ),
        );
      }
      return;
    }

    setColumns((prev) => {
      const activeCardData = source.card;
      const withoutSource = prev.map((col) =>
        col.id === source.columnId
          ? { ...col, opportunities: col.opportunities.filter((c) => c.id !== activeId) }
          : col,
      );

      return withoutSource.map((col) => {
        if (col.id !== targetColumnId) return col;
        const insertIndex = overCard
          ? col.opportunities.findIndex((c) => c.id === overId)
          : col.opportunities.length;
        const next = [...col.opportunities];
        next.splice(insertIndex >= 0 ? insertIndex : next.length, 0, activeCardData);
        return { ...col, opportunities: next };
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const source = findCard(columns, activeId);
    if (!source) return;

    let targetColumnId = String(over.id);
    const overCard = findCard(columns, targetColumnId);
    if (overCard) targetColumnId = overCard.columnId;

    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) return;

    const order = targetColumn.opportunities.findIndex((c) => c.id === activeId);
    const finalOrder = order >= 0 ? order : targetColumn.opportunities.length;

    try {
      await apiClient.patch(`/opportunities/${activeId}/stage`, {
        stageId: targetColumnId,
        order: finalOrder,
      });
    } catch {
      setError('Failed to move opportunity. Changes reverted.');
      onRefresh();
    }
  };

  return (
    <>
      {error && (
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumnView
              key={col.id}
              column={col}
              onCardClick={onCardClick}
              isOver={overColumnId === col.id}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <OpportunityCard card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
