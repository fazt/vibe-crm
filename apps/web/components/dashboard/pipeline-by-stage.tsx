import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { DashboardMetrics } from '@vibe-crm/shared';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface, SurfaceHeader, SurfaceBody } from '@/components/ui/surface';

interface PipelineByStageProps {
  stages: DashboardMetrics['pipelineByStage'];
  loading: boolean;
  maxStageValue: number;
}

export function PipelineByStage({ stages, loading, maxStageValue }: PipelineByStageProps) {
  return (
    <Link href="/opportunities" className="group block">
      <Surface padding="none" rail interactive>
        <SurfaceHeader>
          <div>
            <h2 className="text-sm font-medium tracking-tight text-amber-50/95">Pipeline by stage</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Deal count and value per stage</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-amber-200/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-200/60" />
        </SurfaceHeader>
        <SurfaceBody className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
          ) : stages.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No pipeline stages yet. Add opportunities to get started.
            </p>
          ) : (
            stages.map((stage) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="inline-flex items-center gap-2 font-medium text-amber-50/90">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage.color, opacity: 0.95 }}
                    />
                    {stage.stage}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {stage.count} · {formatCurrency(stage.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-950/60 ring-1 ring-amber-950/25">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(stage.value / maxStageValue) * 100}%`,
                      backgroundColor: stage.color,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </SurfaceBody>
      </Surface>
    </Link>
  );
}
