import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, SkipWorkspace } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';
import { updateProfileSchema, changePasswordSchema } from '@vibe-crm/validators';

@Controller('users')
@SkipWorkspace()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me')
  update(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    return this.users.updateProfile(userId, body as Parameters<UsersService['updateProfile']>[1]);
  }

  @Post('me/change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: { currentPassword: string; newPassword: string },
  ) {
    return this.users.changePassword(userId, body.currentPassword, body.newPassword);
  }
}
