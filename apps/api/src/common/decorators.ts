import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SKIP_WORKSPACE_KEY = 'skipWorkspace';
export const SkipWorkspace = () => SetMetadata(SKIP_WORKSPACE_KEY, true);

export const SKIP_PERMISSIONS_KEY = 'skipPermissions';
export const SkipPermissions = () => SetMetadata(SKIP_PERMISSIONS_KEY, true);

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});

export const WorkspaceId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.workspaceId as string;
});
