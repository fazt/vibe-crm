import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { ConfirmAvatarInput, PresignAvatarInput } from '@vibe-crm/validators';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
    private storage: StorageService,
  ) {}

  async getProfile(userId: string, workspaceId?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, createdAt: true },
    });
    const ctx = await this.rbac.loadUserAuthContext(userId, workspaceId);
    return {
      ...user,
      role: ctx.role,
      permissions: [...ctx.platformPermissions, ...ctx.workspacePermissions],
      platformPermissions: ctx.platformPermissions,
      workspacePermissions: ctx.workspacePermissions,
      workspaceRole: ctx.workspaceRole,
      plan: ctx.plan,
      planLimits: ctx.planLimits,
      usage: ctx.usage,
      isSubscriber: ctx.isSubscriber,
      isSuperAdmin: ctx.isSuperAdmin,
    };
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password updated' };
  }

  async presignAvatarUpload(userId: string, data: PresignAvatarInput) {
    this.storage.validateAvatarMimeType(data.mimeType);
    const key = this.storage.buildAvatarKey(userId, data.fileName);
    const { url, headers } = await this.storage.getPresignedUploadUrl(key, data.mimeType, 3600, {
      publicRead: true,
    });
    return { uploadUrl: url, key, uploadHeaders: headers };
  }

  async confirmAvatarUpload(userId: string, data: ConfirmAvatarInput) {
    const prefix = `users/${userId}/avatar/`;
    if (!data.key.startsWith(prefix)) {
      throw new BadRequestException('Invalid avatar storage key');
    }
    this.storage.validateAvatarMimeType(data.mimeType);

    const avatarUrl = this.storage.getPublicUrl(data.key);
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
  }

  async removeAvatar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
  }
}
