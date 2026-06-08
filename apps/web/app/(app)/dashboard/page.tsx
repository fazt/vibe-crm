'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { DashboardMetrics } from '@vibe-crm/shared';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Surface } from '@/components/ui/surface';
import { PipelineStrip } from '@/components/dashboard/pipeline-strip';
import { WinRateRing } from '@/components/dashboard/win-rate-ring';
import { PipelineByStage } from '@/components/dashboard/pipeline-by-stage';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowUpRight, CheckSquare, Target, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<DashboardMetrics>('/dashboard/metrics')
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  const pipelineTotal = useMemo(
    () => metrics?.pipelineByStage.reduce((sum, s) => sum + s.value, 0) ?? 0,
    [metrics],
  );

  const maxStageValue = Math.max(...(metrics?.pipelineByStage.map((s) => s.value) ?? [1]), 1);
  const hasOverdue = (metrics?.overdueTasks ?? 0) > 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="Pipeline health and what needs your attention before the next call"
        label="Today"
      />

      <Link href="/opportunities" className="group block">
        <Surface rail interactive padding="lg" className="pl-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1 space-y-5">
              <div className="flex items-center gap-2">
                <span className="studio-label">Active pipeline</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-200/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-amber-200/60" />
              </div>
              {loading ? (
                <Skeleton className="h-11 w-48" />
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-amber-50">
                    {formatCurrency(metrics?.pipelineValue ?? 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metrics?.openOpportunities ?? 0} open{' '}
                    {(metrics?.openOpportunities ?? 0) === 1 ? 'deal' : 'deals'}
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {loading ? (
                  <Skeleton className="h-2 w-full" />
                ) : (
                  <PipelineStrip stages={metrics?.pipelineByStage ?? []} total={pipelineTotal} />
                )}
                {!loading && pipelineTotal > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {metrics?.pipelineByStage
                      .filter((s) => s.value > 0)
                      .map((stage) => (
                        <span
                          key={stage.stage}
                          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.stage}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-6 border-t studio-divider pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="text-center lg:text-left">
                <p className="studio-label">Win rate</p>
                {loading ? (
                  <Skeleton className="mx-auto mt-3 h-[88px] w-[88px] rounded-full lg:mx-0" />
                ) : (
                  <div className="mt-2 flex justify-center lg:justify-start">
                    <WinRateRing rate={metrics?.winRate ?? 0} />
                  </div>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">Won vs lost deals</p>
              </div>
            </div>
          </div>
        </Surface>
      </Link>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Open deals"
          value={metrics?.openOpportunities ?? 0}
          hint="View kanban board"
          href="/opportunities"
          icon={Target}
          loading={loading}
          accent="brand"
        />
        <StatTile
          label="Pipeline value"
          value={formatCurrency(metrics?.pipelineValue ?? 0)}
          hint="Total open opportunity value"
          href="/opportunities"
          icon={TrendingUp}
          loading={loading}
        />
        <StatTile
          label="Overdue tasks"
          value={metrics?.overdueTasks ?? 0}
          hint={hasOverdue ? 'Needs attention today' : 'All caught up'}
          href="/tasks"
          icon={CheckSquare}
          loading={loading}
          accent={hasOverdue ? 'warning' : 'default'}
        />
        <StatTile
          label="This week"
          value={metrics?.weeklyActivities ?? 0}
          hint="Calls, emails & meetings"
          href="/activities"
          icon={Activity}
          loading={loading}
          accent="success"
        />
      </div>

      <PipelineByStage
        stages={metrics?.pipelineByStage ?? []}
        loading={loading}
        maxStageValue={maxStageValue}
      />
    </div>
  );
}
