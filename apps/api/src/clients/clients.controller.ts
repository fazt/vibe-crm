import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { WorkspaceId } from '../common/decorators';
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
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.clients.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createClientSchema)) body: unknown,
  ) {
    return this.clients.create(
      workspaceId,
      body as Parameters<ClientsService['create']>[1],
    );
  }

  @Patch(':id')
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
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.clients.remove(workspaceId, id);
  }
}
