import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { ActivitiesService } from './activities.service';
import { CurrentUser, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createActivitySchema,
  updateActivitySchema,
  paginationSchema,
} from '@vibe-crm/validators';

const activityListSchema = paginationSchema.extend({
  clientId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

@Controller('activities')
export class ActivitiesController {
  constructor(private activities: ActivitiesService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(activityListSchema)) query: unknown,
  ) {
    return this.activities.list(
      workspaceId,
      query as Parameters<ActivitiesService['list']>[1],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.activities.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') authorId: string,
    @Body(new ZodValidationPipe(createActivitySchema)) body: unknown,
  ) {
    return this.activities.create(
      workspaceId,
      authorId,
      body as Parameters<ActivitiesService['create']>[2],
    );
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateActivitySchema)) body: unknown,
  ) {
    return this.activities.update(
      workspaceId,
      id,
      body as Parameters<ActivitiesService['update']>[2],
    );
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.activities.remove(workspaceId, id);
  }
}
