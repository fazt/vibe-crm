import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { PERMISSIONS } from '@vibe-crm/shared';
import { ActivitiesService } from './activities.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
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
  @RequirePermissions(PERMISSIONS.ACTIVITIES_READ)
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
  @RequirePermissions(PERMISSIONS.ACTIVITIES_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.activities.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ACTIVITIES_CREATE)
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
  @RequirePermissions(PERMISSIONS.ACTIVITIES_UPDATE)
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
  @RequirePermissions(PERMISSIONS.ACTIVITIES_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.activities.remove(workspaceId, id);
  }
}
