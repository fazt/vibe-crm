import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityType } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateTagInput, PaginationInput } from '@vibe-crm/validators';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async list(workspaceId: string, query: PaginationInput) {
    const where = {
      workspaceId,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { name: 'asc' as const };

    const [data, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: { _count: { select: { assignments: true } } },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, workspaceId },
      include: { _count: { select: { assignments: true } } },
    });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(workspaceId: string, data: CreateTagInput) {
    return this.prisma.tag.create({
      data: { ...data, workspaceId },
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateTagInput>) {
    await this.getOne(workspaceId, id);
    return this.prisma.tag.update({
      where: { id },
      data,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.tagAssignment.deleteMany({ where: { tagId: id } });
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: true };
  }

  async assign(
    workspaceId: string,
    data: { tagId: string; entityType: EntityType; entityId: string },
  ) {
    await this.getOne(workspaceId, data.tagId);
    return this.prisma.tagAssignment.upsert({
      where: {
        tagId_entityType_entityId: {
          tagId: data.tagId,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      },
      create: { ...data, workspaceId },
      update: {},
      include: { tag: true },
    });
  }

  async unassign(
    workspaceId: string,
    data: { tagId: string; entityType: EntityType; entityId: string },
  ) {
    await this.getOne(workspaceId, data.tagId);
    const result = await this.prisma.tagAssignment.deleteMany({
      where: {
        workspaceId,
        tagId: data.tagId,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
    return { removed: result.count > 0 };
  }
}
