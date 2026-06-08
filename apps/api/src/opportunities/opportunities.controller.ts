import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { OpportunityStatus } from '@vibe-crm/shared';
import { OpportunitiesService } from './opportunities.service';
import { WorkspaceId } from '../common/decorators';
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
  kanban(@WorkspaceId() workspaceId: string) {
    return this.opportunities.getKanban(workspaceId);
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.opportunities.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createOpportunitySchema)) body: unknown,
  ) {
    return this.opportunities.create(
      workspaceId,
      body as Parameters<OpportunitiesService['create']>[1],
    );
  }

  @Patch(':id')
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
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.opportunities.remove(workspaceId, id);
  }
}
