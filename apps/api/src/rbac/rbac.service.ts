import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@vibe-crm/database';
import {
  PLAN_LIMITS,
  PlatformRoleSlug,
  SubscriptionPlan as SharedPlan,
  type PlanLimitResource,
  type PlanUsage,
} from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getRolePermissions(roleId: string): Promise<string[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rows.map((r) => r.permission.key);
  }

  async loadUserAuthContext(userId: string, workspaceId?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        role: true,
        subscription: true,
      },
    });

    const platformPermissions = await this.getRolePermissions(user.roleId);
    const isSuperAdmin = user.role.slug === PlatformRoleSlug.SUPERADMIN;

    let workspacePermissions: string[] = [];
    let workspaceRole: { id: string; slug: string; name: string } | undefined;

    if (workspaceId) {
      const member = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        include: { role: true },
      });
      if (member) {
        workspacePermissions = await this.getRolePermissions(member.roleId);
        workspaceRole = {
          id: member.role.id,
          slug: member.role.slug,
          name: member.role.name,
        };
      }
    }

    const plan = this.effectivePlan(user.subscription);
    const planLimits = PLAN_LIMITS[plan as SharedPlan];
    const usage = workspaceId
      ? await this.getWorkspaceUsage(userId, workspaceId)
      : await this.getUserUsage(userId);

    const isSubscriber =
      isSuperAdmin ||
      user.role.slug === PlatformRoleSlug.SUBSCRIBER ||
      (user.subscription != null && ACTIVE_SUBSCRIPTION_STATUSES.includes(user.subscription.status));

    return {
      role: { id: user.role.id, slug: user.role.slug, name: user.role.name },
      platformPermissions,
      workspacePermissions,
      workspaceRole,
      isSuperAdmin,
      isSubscriber,
      plan,
      planLimits,
      usage,
    };
  }

  effectivePlan(subscription: { plan: SubscriptionPlan; status: SubscriptionStatus } | null): SubscriptionPlan {
    if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      return SubscriptionPlan.SOLO;
    }
    return subscription.plan;
  }

  async getUserUsage(userId: string): Promise<PlanUsage> {
    const workspaceIds = (
      await this.prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      })
    ).map((m) => m.workspaceId);

    const [workspaces, clients, contacts, opportunities, tasks, documents] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { userId } }),
      workspaceIds.length
        ? this.prisma.client.count({ where: { workspaceId: { in: workspaceIds } } })
        : 0,
      workspaceIds.length
        ? this.prisma.contact.count({ where: { workspaceId: { in: workspaceIds } } })
        : 0,
      workspaceIds.length
        ? this.prisma.opportunity.count({ where: { workspaceId: { in: workspaceIds } } })
        : 0,
      workspaceIds.length
        ? this.prisma.task.count({ where: { workspaceId: { in: workspaceIds } } })
        : 0,
      workspaceIds.length
        ? this.prisma.document.count({ where: { workspaceId: { in: workspaceIds } } })
        : 0,
    ]);

    const members = workspaceIds.length
      ? await this.prisma.workspaceMember.count({ where: { workspaceId: { in: workspaceIds } } })
      : 0;

    return { workspaces, clients, contacts, opportunities, tasks, members, documents };
  }

  async getWorkspaceUsage(userId: string, workspaceId: string): Promise<PlanUsage> {
    const [workspaces, clients, contacts, opportunities, tasks, members, documents] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { userId } }),
      this.prisma.client.count({ where: { workspaceId } }),
      this.prisma.contact.count({ where: { workspaceId } }),
      this.prisma.opportunity.count({ where: { workspaceId } }),
      this.prisma.task.count({ where: { workspaceId } }),
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
      this.prisma.document.count({ where: { workspaceId } }),
    ]);
    return { workspaces, clients, contacts, opportunities, tasks, members, documents };
  }

  async getPlatformRoleId(slug: string) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { scope_slug: { scope: 'PLATFORM', slug } },
    });
    return role.id;
  }

  async getWorkspaceRoleId(slug: string) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { scope_slug: { scope: 'WORKSPACE', slug } },
    });
    return role.id;
  }
}

export type { PlanLimitResource };
