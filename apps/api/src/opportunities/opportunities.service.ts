import { Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityStatus } from '@vibe-crm/shared';
import type { KanbanColumn } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type {
  CreateOpportunityInput,
  PaginationInput,
} from '@vibe-crm/validators';

export interface OpportunityListQuery extends PaginationInput {
  status?: OpportunityStatus;
  stageId?: string;
  clientId?: string;
  assigneeId?: string;
}

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  private include = {
    stage: true,
    client: { select: { id: true, name: true } },
    contact: { select: { id: true, firstName: true, lastName: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  };

  async list(workspaceId: string, query: OpportunityListQuery) {
    const where = {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  async getKanban(workspaceId: string): Promise<KanbanColumn[]> {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
      include: {
        opportunities: {
          where: { status: OpportunityStatus.OPEN },
          orderBy: { order: 'asc' },
          include: {
            client: { select: { name: true } },
            contact: { select: { firstName: true, lastName: true } },
            assignee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      order: stage.order,
      opportunities: stage.opportunities.map((opp) => ({
        id: opp.id,
        title: opp.title,
        value: opp.value,
        probability: opp.probability,
        clientName: opp.client?.name,
        contactName: opp.contact
          ? `${opp.contact.firstName} ${opp.contact.lastName}`
          : undefined,
        assigneeName: opp.assignee
          ? `${opp.assignee.firstName} ${opp.assignee.lastName}`
          : undefined,
        dueDate: opp.expectedCloseDate?.toISOString() ?? null,
        order: opp.order,
      })),
    }));
  }

  async create(workspaceId: string, data: CreateOpportunityInput) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: data.stageId, workspaceId },
    });
    if (!stage) throw new NotFoundException('Pipeline stage not found');

    const status = stage.isWon
      ? OpportunityStatus.WON
      : stage.isLost
        ? OpportunityStatus.LOST
        : data.status;

    return this.prisma.opportunity.create({
      data: {
        ...data,
        workspaceId,
        status,
        lastActivityAt: new Date(),
      },
      include: this.include,
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateOpportunityInput>) {
    await this.getOne(workspaceId, id);

    if (data.stageId) {
      const stage = await this.prisma.pipelineStage.findFirst({
        where: { id: data.stageId, workspaceId },
      });
      if (!stage) throw new NotFoundException('Pipeline stage not found');
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...data,
        lastActivityAt: new Date(),
      },
      include: this.include,
    });
  }

  async updateStage(
    workspaceId: string,
    id: string,
    data: { stageId: string; order?: number },
  ) {
    await this.getOne(workspaceId, id);

    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: data.stageId, workspaceId },
    });
    if (!stage) throw new NotFoundException('Pipeline stage not found');

    const status = stage.isWon
      ? OpportunityStatus.WON
      : stage.isLost
        ? OpportunityStatus.LOST
        : OpportunityStatus.OPEN;

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        stageId: data.stageId,
        order: data.order,
        status,
        lastActivityAt: new Date(),
      },
      include: this.include,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.opportunity.delete({ where: { id } });
    return { deleted: true };
  }
}
