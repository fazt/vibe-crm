'use client';

interface PlanUsageMeterProps {
  label: string;
  current: number;
  limit: number | null | undefined;
}

export function PlanUsageMeter({ label, current, limit }: PlanUsageMeterProps) {
  if (limit == null) return null;

  const pct = Math.min(100, Math.round((current / limit) * 100));
  const atLimit = current >= limit;

  return (
    <div className="rounded-lg border studio-divider p-3">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={atLimit ? 'text-amber-400' : 'text-foreground'}>
          {current} / {limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-amber-500/70'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
