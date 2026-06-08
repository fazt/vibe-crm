import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { ContactsService } from './contacts.service';
import { WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createContactSchema,
  updateContactSchema,
  paginationSchema,
} from '@vibe-crm/validators';

const contactListSchema = paginationSchema.extend({
  clientId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

@Controller('contacts')
export class ContactsController {
  constructor(private contacts: ContactsService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(contactListSchema)) query: unknown,
  ) {
    return this.contacts.list(
      workspaceId,
      query as Parameters<ContactsService['list']>[1],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contacts.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createContactSchema)) body: unknown,
  ) {
    return this.contacts.create(
      workspaceId,
      body as Parameters<ContactsService['create']>[1],
    );
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateContactSchema)) body: unknown,
  ) {
    return this.contacts.update(
      workspaceId,
      id,
      body as Parameters<ContactsService['update']>[2],
    );
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contacts.remove(workspaceId, id);
  }
}
