import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityType } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitsService } from '../rbac/plan-limits.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateClientInput, PaginationInput } from '@vibe-crm/validators';
import { clientFilterSchema } from '@vibe-crm/validators';
import type { z } from 'zod';

type ClientFilters = z.infer<typeof clientFilterSchema>;

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
  ) {}

  private clientInclude = {
    company: { select: { id: true, name: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  };

  private async attachTags<T extends { id: string }>(workspaceId: string, clients: T[]) {
    if (clients.length === 0) return clients.map((c) => ({ ...c, tags: [] }));

    const assignments = await this.prisma.tagAssignment.findMany({
      where: {
        workspaceId,
        entityType: EntityType.CLIENT,
        entityId: { in: clients.map((c) => c.id) },
      },
      include: { tag: true },
    });

    const tagsByClient = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const list = tagsByClient.get(a.entityId) ?? [];
      list.push(a);
      tagsByClient.set(a.entityId, list);
    }

    return clients.map((c) => ({
      ...c,
      tags: (tagsByClient.get(c.id) ?? []).map((a) => a.tag),
    }));
  }

  async list(workspaceId: string, query: PaginationInput & ClientFilters) {
    let tagClientIds: string[] | undefined;
    if (query.tagId) {
      tagClientIds = (
        await this.prisma.tagAssignment.findMany({
          where: { workspaceId, tagId: query.tagId, entityType: EntityType.CLIENT },
          select: { entityId: true },
        })
      ).map((a) => a.entityId);
      if (tagClientIds.length === 0) {
        return paginate([], 0, query.page, query.limit);
      }
    }

    const where = {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(tagClientIds ? { id: { in: tagClientIds } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [rows, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.clientInclude,
      }),
      this.prisma.client.count({ where }),
    ]);

    const data = await this.attachTags(workspaceId, rows);
    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, workspaceId },
      include: this.clientInclude,
    });
    if (!client) throw new NotFoundException('Client not found');
    const [withTags] = await this.attachTags(workspaceId, [client]);
    return withTags;
  }

  async create(workspaceId: string, userId: string, data: CreateClientInput) {
    const count = await this.prisma.client.count({ where: { workspaceId } });
    await this.planLimits.assertCanCreate(userId, workspaceId, 'clients', count);
    const { tagIds, ...clientData } = data;
    const client = await this.prisma.client.create({
      data: { ...clientData, workspaceId },
      include: this.clientInclude,
    });

    if (tagIds?.length) {
      await this.prisma.tagAssignment.createMany({
        data: tagIds.map((tagId) => ({
          workspaceId,
          tagId,
          entityType: EntityType.CLIENT,
          entityId: client.id,
        })),
        skipDuplicates: true,
      });
    }

    return this.getOne(workspaceId, client.id);
  }

  async update(workspaceId: string, id: string, data: Partial<CreateClientInput>) {
    await this.getOne(workspaceId, id);
    const { tagIds, ...clientData } = data;

    const client = await this.prisma.client.update({
      where: { id },
      data: clientData,
      include: this.clientInclude,
    });

    if (tagIds !== undefined) {
      await this.prisma.tagAssignment.deleteMany({
        where: { workspaceId, entityType: EntityType.CLIENT, entityId: id },
      });
      if (tagIds.length > 0) {
        await this.prisma.tagAssignment.createMany({
          data: tagIds.map((tagId) => ({
            workspaceId,
            tagId,
            entityType: EntityType.CLIENT,
            entityId: id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.getOne(workspaceId, client.id);
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.tagAssignment.deleteMany({
      where: { workspaceId, entityType: EntityType.CLIENT, entityId: id },
    });
    await this.prisma.client.delete({ where: { id } });
    return { deleted: true };
  }
}
