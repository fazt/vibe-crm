import { Controller, Get } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { WorkspaceId } from '../common/decorators';

@Controller('pipeline')
export class PipelineController {
  constructor(private pipeline: PipelineService) {}

  @Get('stages')
  listStages(@WorkspaceId() workspaceId: string) {
    return this.pipeline.listStages(workspaceId);
  }
}
