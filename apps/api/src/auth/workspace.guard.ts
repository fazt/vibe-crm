import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac/rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY, SKIP_WORKSPACE_KEY } from '../common/decorators';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
    private rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_WORKSPACE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const workspaceId = request.headers['x-workspace-id'] as string;
    if (!workspaceId) throw new ForbiddenException('Workspace header required');

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: request.user.id } },
      include: { role: true },
    });
    if (!member) throw new ForbiddenException('Not a workspace member');

    const workspacePermissions = await this.rbac.getRolePermissions(member.roleId);

    request.workspaceId = workspaceId;
    request.memberRoleSlug = member.role.slug;
    request.workspacePermissions = workspacePermissions;
    request.memberRole = {
      id: member.role.id,
      slug: member.role.slug,
      name: member.role.name,
    };
    return true;
  }
}
