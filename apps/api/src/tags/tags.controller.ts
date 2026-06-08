import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { TagsService } from './tags.service';
import { RequirePermissions, WorkspaceId } from '../common/decorators';
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
  @RequirePermissions(PERMISSIONS.TAGS_READ)
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
  @RequirePermissions(PERMISSIONS.TAGS_ASSIGN)
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
  @RequirePermissions(PERMISSIONS.TAGS_ASSIGN)
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
  @RequirePermissions(PERMISSIONS.TAGS_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tags.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TAGS_CREATE)
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
  @RequirePermissions(PERMISSIONS.TAGS_UPDATE)
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
  @RequirePermissions(PERMISSIONS.TAGS_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.tags.remove(workspaceId, id);
  }
}
