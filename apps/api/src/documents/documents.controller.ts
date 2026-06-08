import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { EntityType } from '@vibe-crm/shared';
import { DocumentsService } from './documents.service';
import { CurrentUser, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  presignUploadSchema,
  confirmUploadSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const documentListSchema = paginationSchema.extend({
  entityType: z.nativeEnum(EntityType).optional(),
  entityId: z.string().uuid().optional(),
});

@Controller('documents')
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(documentListSchema)) query: unknown,
  ) {
    return this.documents.list(
      workspaceId,
      query as Parameters<DocumentsService['list']>[1],
    );
  }

  @Post('presign')
  presign(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(presignUploadSchema)) body: unknown,
  ) {
    return this.documents.presignUpload(
      workspaceId,
      body as Parameters<DocumentsService['presignUpload']>[1],
    );
  }

  @Post('confirm')
  confirm(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(confirmUploadSchema)) body: unknown,
  ) {
    return this.documents.confirmUpload(
      workspaceId,
      userId,
      body as Parameters<DocumentsService['confirmUpload']>[2],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.documents.getOne(workspaceId, id);
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.documents.remove(workspaceId, id);
  }
}
