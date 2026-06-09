'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Surface } from '@/components/ui/surface';
import { Badge } from '@/components/ui/badge';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
}

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<PipelineStage[]>('/pipeline/stages')
      .then(setStages)
      .catch(() => setStages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Pipeline stages"
        description="Your deal pipeline configuration (read-only)"
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : stages.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No stages configured.</p>
      ) : (
        <Surface padding="none" className="divide-y studio-divider">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-sm font-medium">{stage.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  #{stage.order + 1}
                </span>
                {stage.isWon && <Badge variant="success">Won</Badge>}
                {stage.isLost && <Badge variant="outline">Lost</Badge>}
              </div>
            </div>
          ))}
        </Surface>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">
        Stage management API is not yet available. Stages are seeded when your workspace is created.
      </p>
    </div>
  );
}
