import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitsService } from '../rbac/plan-limits.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateTaskInput, PaginationInput } from '@vibe-crm/validators';

export interface TaskListQuery extends PaginationInput {
  status?: TaskStatus;
  assigneeId?: string;
  clientId?: string;
  opportunityId?: string;
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
  ) {}

  private include = {
    client: { select: { id: true, name: true } },
    opportunity: { select: { id: true, title: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  };

  async list(workspaceId: string, query: TaskListQuery) {
    const where = {
      workspaceId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
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
      : { dueDate: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(workspaceId: string, userId: string, data: CreateTaskInput) {
    const count = await this.prisma.task.count({ where: { workspaceId } });
    await this.planLimits.assertCanCreate(userId, workspaceId, 'tasks', count);
    return this.prisma.task.create({
      data: { ...data, workspaceId },
      include: this.include,
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateTaskInput>) {
    await this.getOne(workspaceId, id);

    let completedAt: Date | null | undefined;
    if (data.status === TaskStatus.DONE) {
      completedAt = new Date();
    } else if (data.status !== undefined) {
      completedAt = null;
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        ...(completedAt !== undefined ? { completedAt } : {}),
      },
      include: this.include,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.task.delete({ where: { id } });
    return { deleted: true };
  }
}
