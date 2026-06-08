import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { ClientsService } from './clients.service';
import { CurrentUser, RequirePermissions, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createClientSchema,
  updateClientSchema,
  paginationSchema,
  clientFilterSchema,
} from '@vibe-crm/validators';

const clientListSchema = paginationSchema.merge(clientFilterSchema);

@Controller('clients')
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CLIENTS_READ)
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(clientListSchema)) query: unknown,
  ) {
    return this.clients.list(
      workspaceId,
      query as Parameters<ClientsService['list']>[1],
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_READ)
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.clients.getOne(workspaceId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CLIENTS_CREATE)
  create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createClientSchema)) body: unknown,
  ) {
    return this.clients.create(
      workspaceId,
      userId,
      body as Parameters<ClientsService['create']>[2],
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_UPDATE)
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) body: unknown,
  ) {
    return this.clients.update(
      workspaceId,
      id,
      body as Parameters<ClientsService['update']>[2],
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_DELETE)
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.clients.remove(workspaceId, id);
  }
}
