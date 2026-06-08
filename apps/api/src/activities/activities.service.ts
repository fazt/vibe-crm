import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateActivityInput, PaginationInput } from '@vibe-crm/validators';

export interface ActivityListQuery extends PaginationInput {
  clientId?: string;
  contactId?: string;
  opportunityId?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  private include = {
    author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    client: { select: { id: true, name: true } },
    contact: { select: { id: true, firstName: true, lastName: true } },
    opportunity: { select: { id: true, title: true } },
  };

  private async touchOpportunity(opportunityId?: string | null) {
    if (!opportunityId) return;
    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { lastActivityAt: new Date() },
    });
  }

  async list(workspaceId: string, query: ActivityListQuery) {
    const where = {
      workspaceId,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.opportunityId ? { opportunityId: query.opportunityId } : {}),
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
      : { occurredAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async create(workspaceId: string, authorId: string, data: CreateActivityInput) {
    const activity = await this.prisma.activity.create({
      data: { ...data, workspaceId, authorId },
      include: this.include,
    });
    await this.touchOpportunity(activity.opportunityId);
    return activity;
  }

  async update(workspaceId: string, id: string, data: Partial<CreateActivityInput>) {
    const existing = await this.getOne(workspaceId, id);
    const activity = await this.prisma.activity.update({
      where: { id },
      data,
      include: this.include,
    });
    await this.touchOpportunity(data.opportunityId ?? existing.opportunityId);
    return activity;
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.activity.delete({ where: { id } });
    return { deleted: true };
  }
}
