import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { PERMISSIONS } from '@vibe-crm/shared';
import { ContactsService } from './contacts.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
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
  @RequirePermissions(PERMISSIONS.CONTACTS_READ)
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
  @RequirePermissions(PERMISSIONS.CONTACTS_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contacts.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CONTACTS_CREATE)
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createContactSchema)) body: unknown,
  ) {
    return this.contacts.create(
      workspaceId,
      userId,
      body as Parameters<ContactsService['create']>[2],
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CONTACTS_UPDATE)
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
  @RequirePermissions(PERMISSIONS.CONTACTS_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.contacts.remove(workspaceId, id);
  }
}
