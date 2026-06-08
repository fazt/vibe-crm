import { Global, Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { PlanLimitsService } from './plan-limits.service';

@Global()
@Module({
  providers: [RbacService, PlanLimitsService],
  exports: [RbacService, PlanLimitsService],
})
export class RbacModule {}
