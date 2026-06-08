import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_SCOPE } from '@vibe-crm/shared';
import {
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  SKIP_PERMISSIONS_KEY,
  SKIP_WORKSPACE_KEY,
} from '../common/decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipPermissions = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipPermissions) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const skipWorkspace = this.reflector.getAllAndOverride<boolean>(SKIP_WORKSPACE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    if (request.user?.isSuperAdmin) return true;

    const platformPermissions: string[] = request.user?.platformPermissions ?? [];
    const workspacePermissions: string[] = request.workspacePermissions ?? [];

    for (const perm of required) {
      const scope = PERMISSION_SCOPE[perm as keyof typeof PERMISSION_SCOPE];
      if (scope === 'PLATFORM') {
        if (!platformPermissions.includes(perm)) {
          throw new ForbiddenException(`Missing permission: ${perm}`);
        }
      } else if (!skipWorkspace) {
        if (!workspacePermissions.includes(perm)) {
          throw new ForbiddenException(`Missing permission: ${perm}`);
        }
      }
    }

    return true;
  }
}
