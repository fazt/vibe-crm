'use client';

import { GripVertical } from 'lucide-react';
import type { KanbanCard } from '@vibe-crm/shared';
import { Surface } from '@/components/ui/surface';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  card: KanbanCard;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onClick?: () => void;
}

export function OpportunityCard({ card, isDragging, dragHandleProps, onClick }: OpportunityCardProps) {
  return (
    <Surface
      padding="sm"
      className={cn(
        'transition-colors hover:border-primary/30',
        isDragging && 'opacity-50 shadow-lg',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
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
        </div>
      </div>
    </Surface>
  );
}
