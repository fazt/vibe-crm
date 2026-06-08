import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatTileProps {
  label: string;
  value: string | number;
  hint: string;
  href: string;
  icon: React.ElementType;
  loading?: boolean;
  accent?: 'default' | 'warning' | 'brand' | 'success';
}

export function StatTile({
  label,
  value,
  hint,
  href,
  icon: Icon,
  loading,
  accent = 'default',
}: StatTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group studio-surface studio-rail studio-surface-interactive flex gap-4 p-4 pl-5',
        accent === 'warning' && 'before:bg-amber-400/70',
        accent === 'brand' && 'before:bg-amber-500/80',
        accent === 'success' && 'before:bg-emerald-500/65',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border studio-divider',
          accent === 'warning' && 'border-amber-700/30 bg-amber-950/40 text-amber-300',
          accent === 'brand' && 'border-amber-700/35 bg-amber-950/50 text-amber-200',
          accent === 'success' && 'border-emerald-800/35 bg-emerald-950/35 text-emerald-300',
          accent === 'default' && 'bg-stone-950/50 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="studio-label">{label}</p>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-200/25 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-200/50" />
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-28" />
        ) : (
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-amber-50/95">
            {value}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}
