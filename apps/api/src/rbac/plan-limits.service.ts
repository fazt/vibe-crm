import { ForbiddenException, Injectable } from '@nestjs/common';
import { PLAN_LIMITS, SubscriptionPlan, type PlanLimitResource } from '@vibe-crm/shared';
import { RbacService } from './rbac.service';

@Injectable()
export class PlanLimitsService {
  constructor(private rbac: RbacService) {}

  async assertCanCreate(
    userId: string,
    workspaceId: string | null,
    resource: PlanLimitResource,
    currentCount: number,
  ) {
    const ctx = await this.rbac.loadUserAuthContext(userId, workspaceId ?? undefined);
    if (ctx.isSuperAdmin) return;

    const limits = PLAN_LIMITS[ctx.plan as SubscriptionPlan];
    const limit = limits[resource];
    if (limit === null) return;

    if (currentCount >= limit) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Plan limit reached for ${resource}`,
        code: 'PLAN_LIMIT',
        resource,
        limit,
        current: currentCount,
      });
    }
  }
}
