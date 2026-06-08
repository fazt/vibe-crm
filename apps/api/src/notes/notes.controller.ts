import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { PERMISSIONS } from '@vibe-crm/shared';
import { NotesService } from './notes.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createNoteSchema,
  updateNoteSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const noteListSchema = paginationSchema.extend({
  clientId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
});

@Controller('notes')
export class NotesController {
  constructor(private notes: NotesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.NOTES_READ)
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(noteListSchema)) query: unknown,
  ) {
    return this.notes.list(
      workspaceId,
      query as Parameters<NotesService['list']>[1],
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.NOTES_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.notes.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.NOTES_CREATE)
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') authorId: string,
    @Body(new ZodValidationPipe(createNoteSchema)) body: unknown,
  ) {
    return this.notes.create(
      workspaceId,
      authorId,
      body as Parameters<NotesService['create']>[2],
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.NOTES_UPDATE)
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) body: unknown,
  ) {
    return this.notes.update(
      workspaceId,
      id,
      body as Parameters<NotesService['update']>[2],
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.NOTES_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.notes.remove(workspaceId, id);
  }
}
