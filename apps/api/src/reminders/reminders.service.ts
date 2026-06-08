import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateReminderInput, PaginationInput } from '@vibe-crm/validators';
import { EntityType } from '@vibe-crm/shared';

export interface ReminderListQuery extends PaginationInput {
  assigneeId?: string;
  entityType?: EntityType;
  entityId?: string;
  sent?: boolean;
}

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  private include = {
    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  };

  async list(workspaceId: string, query: ReminderListQuery) {
    const where = {
      workspaceId,
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.sent !== undefined ? { sent: query.sent } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { message: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { dueAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    return reminder;
  }

  async create(workspaceId: string, data: CreateReminderInput) {
    return this.prisma.reminder.create({
      data: { ...data, workspaceId },
      include: this.include,
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateReminderInput>) {
    await this.getOne(workspaceId, id);
    return this.prisma.reminder.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.reminder.delete({ where: { id } });
    return { deleted: true };
  }
}
