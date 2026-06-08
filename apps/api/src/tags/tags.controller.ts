import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createTagSchema,
  assignTagSchema,
  paginationSchema,
} from '@vibe-crm/validators';

@Controller('tags')
export class TagsController {
  constructor(private tags: TagsService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: unknown,
  ) {
    return this.tags.list(
      workspaceId,
      query as Parameters<TagsService['list']>[1],
    );
  }

  @Post('assign')
  assign(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(assignTagSchema)) body: unknown,
  ) {
    return this.tags.assign(
      workspaceId,
      body as Parameters<TagsService['assign']>[1],
    );
  }

  @Post('unassign')
  unassign(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(assignTagSchema)) body: unknown,
  ) {
    return this.tags.unassign(
      workspaceId,
      body as Parameters<TagsService['unassign']>[1],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tags.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createTagSchema)) body: unknown,
  ) {
    return this.tags.create(
      workspaceId,
      body as Parameters<TagsService['create']>[1],
    );
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createTagSchema.partial())) body: unknown,
  ) {
    return this.tags.update(
      workspaceId,
      id,
      body as Parameters<TagsService['update']>[2],
    );
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tags.remove(workspaceId, id);
  }
}
