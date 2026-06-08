import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { WorkspacesService } from './workspaces.service';
import { CurrentUser, RequirePermissions, SkipWorkspace, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import { createWorkspaceSchema } from '@vibe-crm/validators';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspaces: WorkspacesService) {}

  @Get()
  @SkipWorkspace()
  list(@CurrentUser('id') userId: string) {
    return this.workspaces.listForUser(userId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.WORKSPACES_CREATE)
  @SkipWorkspace()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createWorkspaceSchema)) body: unknown,
  ) {
    return this.workspaces.create(userId, body as Parameters<WorkspacesService['create']>[1]);
  }

  @Get('members')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBERS_READ)
  membersByHeader(@WorkspaceId() workspaceId: string) {
    return this.workspaces.getMembers(workspaceId);
  }

  @Get(':id/members')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBERS_READ)
  @SkipWorkspace()
  membersById(
    @CurrentUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.workspaces.getMembersForUser(workspaceId, userId);
  }
}
