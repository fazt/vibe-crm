import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleScope, SubscriptionPlan, SubscriptionStatus } from '@vibe-crm/database';
import * as bcrypt from 'bcryptjs';
import type { CreateAdminUserInput, CreateRoleInput } from '@vibe-crm/validators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ scope: 'asc' }, { isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      scope: r.scope,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissions: r.permissions.map((rp) => ({
        id: rp.permission.id,
        key: rp.permission.key,
        name: rp.permission.name,
      })),
    }));
  }

  async createRole(data: CreateRoleInput) {
    const existing = await this.prisma.role.findUnique({
      where: { scope_slug: { scope: RoleScope.PLATFORM, slug: data.slug } },
    });
    if (existing) throw new BadRequestException('Role slug already exists');

    return this.prisma.role.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        scope: RoleScope.PLATFORM,
        isSystem: false,
      },
    });
  }

  async updateRolePermissions(roleId: string, permissionKeys: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be modified');

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys }, scope: RoleScope.PLATFORM },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    });

    return this.listRoles().then((roles) => roles.find((r) => r.id === roleId));
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    if (role._count.users > 0) throw new BadRequestException('Role is assigned to users');

    await this.prisma.role.delete({ where: { id: roleId } });
    return { deleted: true };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        role: { select: { id: true, slug: true, name: true, scope: true } },
        subscription: { select: { plan: true, status: true } },
      },
    });
    return users;
  }

  async assignUserRole(userId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role || role.scope !== RoleScope.PLATFORM) {
      throw new BadRequestException('Invalid platform role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { id: true, slug: true, name: true } },
      },
    });
  }

  async createUser(data: CreateAdminUserInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already registered');

    const role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role || role.scope !== RoleScope.PLATFORM) {
      throw new BadRequestException('Invalid platform role');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        roleId: data.roleId,
        subscription: {
          create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        role: { select: { id: true, slug: true, name: true, scope: true } },
        subscription: { select: { plan: true, status: true } },
      },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      where: { scope: RoleScope.PLATFORM },
      orderBy: { key: 'asc' },
    });
  }
}
