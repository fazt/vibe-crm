import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { EntityType } from '@vibe-crm/shared';
import { RemindersService } from './reminders.service';
import { WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createReminderSchema,
  updateReminderSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const reminderListSchema = paginationSchema.extend({
  assigneeId: z.string().uuid().optional(),
  entityType: z.nativeEnum(EntityType).optional(),
  entityId: z.string().uuid().optional(),
  sent: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

@Controller('reminders')
export class RemindersController {
  constructor(private reminders: RemindersService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(reminderListSchema)) query: unknown,
  ) {
    return this.reminders.list(
      workspaceId,
      query as Parameters<RemindersService['list']>[1],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.reminders.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createReminderSchema)) body: unknown,
  ) {
    return this.reminders.create(
      workspaceId,
      body as Parameters<RemindersService['create']>[1],
    );
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateReminderSchema)) body: unknown,
  ) {
    return this.reminders.update(
      workspaceId,
      id,
      body as Parameters<RemindersService['update']>[2],
    );
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.reminders.remove(workspaceId, id);
  }
}
