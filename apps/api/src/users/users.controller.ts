import { Body, Controller, Delete, Get, Headers, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import { UsersService } from './users.service';
import { CurrentUser, RequirePermissions, SkipWorkspace } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import {
  updateProfileSchema,
  changePasswordSchema,
  presignAvatarSchema,
  confirmAvatarSchema,
} from '@vibe-crm/validators';

@Controller('users')
@SkipWorkspace()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  me(
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId?: string,
  ) {
    return this.users.getProfile(userId, workspaceId);
  }

  @Patch('me')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  update(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    return this.users.updateProfile(userId, body as Parameters<UsersService['updateProfile']>[1]);
  }

  @Post('me/change-password')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: { currentPassword: string; newPassword: string },
  ) {
    return this.users.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('me/avatar/presign')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  presignAvatar(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(presignAvatarSchema)) body: unknown,
  ) {
    return this.users.presignAvatarUpload(userId, body as Parameters<UsersService['presignAvatarUpload']>[1]);
  }

  @Post('me/avatar/confirm')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  confirmAvatar(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(confirmAvatarSchema)) body: unknown,
  ) {
    return this.users.confirmAvatarUpload(userId, body as Parameters<UsersService['confirmAvatarUpload']>[1]);
  }

  @Delete('me/avatar')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  removeAvatar(@CurrentUser('id') userId: string) {
    return this.users.removeAvatar(userId);
  }
}
