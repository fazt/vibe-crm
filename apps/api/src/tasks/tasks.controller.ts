import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { PERMISSIONS, TaskStatus } from '@vibe-crm/shared';
import { TasksService } from './tasks.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createTaskSchema,
  updateTaskSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const taskListSchema = paginationSchema.extend({
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TASKS_READ)
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(taskListSchema)) query: unknown,
  ) {
    return this.tasks.list(
      workspaceId,
      query as Parameters<TasksService['list']>[1],
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TASKS_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tasks.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TASKS_CREATE)
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: unknown,
  ) {
    return this.tasks.create(
      workspaceId,
      userId,
      body as Parameters<TasksService['create']>[2],
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TASKS_UPDATE)
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: unknown,
  ) {
    return this.tasks.update(
      workspaceId,
      id,
      body as Parameters<TasksService['update']>[2],
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.TASKS_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tasks.remove(workspaceId, id);
  }
}
