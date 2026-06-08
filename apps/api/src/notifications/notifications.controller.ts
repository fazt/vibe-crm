import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { z } from 'zod';
import { NotificationsService } from './notifications.service';
import { CurrentUser, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import { paginationSchema } from '@vibe-crm/validators';

const notificationListSchema = paginationSchema.extend({
  read: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(notificationListSchema)) query: unknown,
  ) {
    return this.notifications.list(
      workspaceId,
      userId,
      query as Parameters<NotificationsService['list']>[2],
    );
  }

  @Patch('read-all')
  markAllRead(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notifications.markAllRead(workspaceId, userId);
  }

  @Patch(':id/read')
  markRead(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(workspaceId, userId, id);
  }
}
