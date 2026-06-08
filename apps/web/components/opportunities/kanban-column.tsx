'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCard, KanbanColumn } from '@vibe-crm/shared';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/surface';
import { OpportunityCard } from './opportunity-card';
import { cn } from '@/lib/utils';

interface KanbanColumnViewProps {
  column: KanbanColumn;
  onCardClick: (cardId: string) => void;
  isOver?: boolean;
}

export function KanbanColumnView({ column, onCardClick, isOver }: KanbanColumnViewProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: column.id });
  const ids = column.opportunities.map((o) => o.id);
  const highlight = isOver || isDroppableOver;

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
          ref={setNodeRef}
          id={column.id}
          padding="sm"
          className={cn(
            'flex min-h-[200px] flex-1 flex-col gap-2 transition-colors',
            highlight && 'border-primary/40 bg-primary/5',
          )}
        >
          {column.opportunities.map((card) => (
            <SortableCard key={card.id} card={card} onClick={() => onCardClick(card.id)} />
          ))}
        </Surface>
      </SortableContext>
    </div>
  );
}

function SortableCard({ card, onClick }: { card: KanbanCard; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OpportunityCard
        card={card}
        isDragging={isDragging}
        dragHandleProps={listeners}
        onClick={onClick}
      />
    </div>
  );
}
