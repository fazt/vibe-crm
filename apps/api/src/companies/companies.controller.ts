import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  createCompanySchema,
  updateCompanySchema,
  paginationSchema,
} from '@vibe-crm/validators';

@Controller('companies')
export class CompaniesController {
  constructor(private companies: CompaniesService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(paginationSchema)) query: unknown,
  ) {
    return this.companies.list(
      workspaceId,
      query as Parameters<CompaniesService['list']>[1],
    );
  }

  @Get(':id')
  getOne(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.companies.getOne(workspaceId, id);
  }

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body(new ZodValidationPipe(createCompanySchema)) body: unknown,
  ) {
    return this.companies.create(
      workspaceId,
      body as Parameters<CompaniesService['create']>[1],
    );
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCompanySchema)) body: unknown,
  ) {
    return this.companies.update(
      workspaceId,
      id,
      body as Parameters<CompaniesService['update']>[2],
    );
  }

  @Delete(':id')
  remove(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.companies.remove(workspaceId, id);
  }
}
