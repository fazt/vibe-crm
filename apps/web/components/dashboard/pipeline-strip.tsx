import type { DashboardMetrics } from '@vibe-crm/shared';
import { formatCurrency } from '@/lib/utils';

export function PipelineStrip({
  stages,
  total,
}: {
  stages: DashboardMetrics['pipelineByStage'];
  total: number;
}) {
  if (total === 0) {
    return <div className="h-2 w-full rounded-full bg-stone-950/60 ring-1 ring-amber-950/30" />;
  }

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-950/60 ring-1 ring-amber-950/30">
      {stages
        .filter((s) => s.value > 0)
        .map((stage) => (
          <div
            key={stage.stage}
            className="inline-block h-full align-top transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(stage.value / total) * 100}%`,
              backgroundColor: stage.color,
              opacity: 0.9,
            }}
            title={`${stage.stage}: ${formatCurrency(stage.value)}`}
          />
        ))}
    </div>
  );
}
