import { Injectable } from '@nestjs/common';
import type { DashboardMetrics } from '@vibe-crm/shared';
import { OpportunityStatus, TaskStatus } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(workspaceId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      openOpportunities,
      pipelineAgg,
      overdueTasks,
      weeklyActivities,
      wonCount,
      lostCount,
      stages,
    ] = await Promise.all([
      this.prisma.opportunity.count({
        where: { workspaceId, status: OpportunityStatus.OPEN },
      }),
      this.prisma.opportunity.aggregate({
        where: { workspaceId, status: OpportunityStatus.OPEN },
        _sum: { value: true },
      }),
      this.prisma.task.count({
        where: {
          workspaceId,
          dueDate: { lt: now },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        },
      }),
      this.prisma.activity.count({
        where: { workspaceId, occurredAt: { gte: weekAgo } },
      }),
      this.prisma.opportunity.count({
        where: { workspaceId, status: OpportunityStatus.WON },
      }),
      this.prisma.opportunity.count({
        where: { workspaceId, status: OpportunityStatus.LOST },
      }),
      this.prisma.pipelineStage.findMany({
        where: { workspaceId },
        orderBy: { order: 'asc' },
        include: {
          opportunities: {
            where: { status: OpportunityStatus.OPEN },
            select: { value: true },
          },
        },
      }),
    ]);

    const closed = wonCount + lostCount;
    const winRate = closed > 0 ? Math.round((wonCount / closed) * 100) : 0;

    return {
      openOpportunities,
      pipelineValue: pipelineAgg._sum.value ?? 0,
      overdueTasks,
      weeklyActivities,
      winRate,
      pipelineByStage: stages.map((stage) => ({
        stage: stage.name,
        count: stage.opportunities.length,
        value: stage.opportunities.reduce((sum, o) => sum + o.value, 0),
        color: stage.color,
      })),
    };
  }
}
