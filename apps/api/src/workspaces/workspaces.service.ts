import { ForbiddenException, Injectable } from '@nestjs/common';
import { DEFAULT_PIPELINE_STAGES, WorkspaceRoleSlug } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitsService } from '../rbac/plan-limits.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
    private rbac: RbacService,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true, role: true },
    });
    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: { id: m.role.id, slug: m.role.slug, name: m.role.name },
    }));
  }

  async create(userId: string, data: { name: string; slug?: string }) {
    const count = await this.prisma.workspaceMember.count({ where: { userId } });
    await this.planLimits.assertCanCreate(userId, null, 'workspaces', count);

    const ownerRoleId = await this.rbac.getWorkspaceRoleId(WorkspaceRoleSlug.OWNER);
    const slug =
      data.slug ??
      `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    return this.prisma.workspace.create({
      data: {
        name: data.name,
        slug,
        members: { create: { userId, roleId: ownerRoleId } },
        pipelineStages: {
          create: DEFAULT_PIPELINE_STAGES.map((s) => ({
            name: s.name,
            color: s.color,
            order: s.order,
            isWon: s.isWon,
            isLost: s.isLost,
          })),
        },
      },
    });
  }

  async getMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        role: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
    return members.map((m) => ({
      id: m.id,
      role: { id: m.role.id, slug: m.role.slug, name: m.role.name },
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async getMembersForUser(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');
    return this.getMembers(workspaceId);
  }
}
