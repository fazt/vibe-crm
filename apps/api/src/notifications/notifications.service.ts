import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { PaginationInput } from '@vibe-crm/validators';

export interface NotificationListQuery extends PaginationInput {
  read?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(workspaceId: string, userId: string, query: NotificationListQuery) {
    const where = {
      workspaceId,
      userId,
      ...(query.read !== undefined ? { read: query.read } : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async markRead(workspaceId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, workspaceId, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(workspaceId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { workspaceId, userId, read: false },
      data: { read: true },
    });
    return { updated: result.count };
  }
}
