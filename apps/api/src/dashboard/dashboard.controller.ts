import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { DashboardService } from './dashboard.service';
import { RequirePermissions, WorkspaceId } from '../common/decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('metrics')
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  metrics(@WorkspaceId() workspaceId: string) {
    return this.dashboard.getMetrics(workspaceId);
  }
}
