import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { PipelineService } from './pipeline.service';
import { RequirePermissions, WorkspaceId } from '../common/decorators';

@Controller('pipeline')
export class PipelineController {
  constructor(private pipeline: PipelineService) {}

  @Get('stages')
  @RequirePermissions(PERMISSIONS.PIPELINE_READ)
  listStages(@WorkspaceId() workspaceId: string) {
    return this.pipeline.listStages(workspaceId);
  }
}
