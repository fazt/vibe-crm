import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { WorkspaceId } from '../common/decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('metrics')
  metrics(@WorkspaceId() workspaceId: string) {
    return this.dashboard.getMetrics(workspaceId);
  }
}
