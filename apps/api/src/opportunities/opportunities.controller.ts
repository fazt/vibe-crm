import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { OpportunityStatus, PERMISSIONS } from '@vibe-crm/shared';
import { OpportunitiesService } from './opportunities.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  updateOpportunityStageSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const opportunityListSchema = paginationSchema.extend({
  status: z.nativeEnum(OpportunityStatus).optional(),
  stageId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
});

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private opportunities: OpportunitiesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_READ)
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(opportunityListSchema)) query: unknown,
  ) {
    return this.opportunities.list(
      workspaceId,
      query as Parameters<OpportunitiesService['list']>[1],
    );
  }

  @Get('kanban')
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_READ)
  kanban(@WorkspaceId() workspaceId: string) {
    return this.opportunities.getKanban(workspaceId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.opportunities.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_CREATE)
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createOpportunitySchema)) body: unknown,
  ) {
    return this.opportunities.create(
      workspaceId,
      userId,
      body as Parameters<OpportunitiesService['create']>[2],
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_UPDATE)
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOpportunitySchema)) body: unknown,
  ) {
    return this.opportunities.update(
      workspaceId,
      id,
      body as Parameters<OpportunitiesService['update']>[2],
    );
  }

  @Patch(':id/stage')
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_MOVE)
  updateStage(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOpportunityStageSchema)) body: unknown,
  ) {
    return this.opportunities.updateStage(
      workspaceId,
      id,
      body as Parameters<OpportunitiesService['updateStage']>[2],
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.OPPORTUNITIES_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.opportunities.remove(workspaceId, id);
  }
}
