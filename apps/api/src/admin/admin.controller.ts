import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@vibe-crm/shared';
import {
  assignUserRoleSchema,
  createAdminUserSchema,
  createRoleSchema,
  updateRolePermissionsSchema,
} from '@vibe-crm/validators';
import { AdminService } from './admin.service';
import { RequirePermissions, SkipWorkspace } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';

@Controller('admin')
@SkipWorkspace()
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('roles')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES_READ)
  listRoles() {
    return this.admin.listRoles();
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES_READ)
  listPermissions() {
    return this.admin.listPermissions();
  }

  @Post('roles')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES_CREATE)
  createRole(@Body(new ZodValidationPipe(createRoleSchema)) body: unknown) {
    return this.admin.createRole(body as Parameters<AdminService['createRole']>[0]);
  }

  @Patch('roles/:id/permissions')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES_UPDATE)
  updatePermissions(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRolePermissionsSchema)) body: { permissionKeys: string[] },
  ) {
    return this.admin.updateRolePermissions(id, body.permissionKeys);
  }

  @Delete('roles/:id')
  @RequirePermissions(PERMISSIONS.ADMIN_ROLES_DELETE)
  deleteRole(@Param('id') id: string) {
    return this.admin.deleteRole(id);
  }

  @Get('users')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_READ)
  listUsers() {
    return this.admin.listUsers();
  }

  @Patch('users/:id/role')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_UPDATE)
  assignRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignUserRoleSchema)) body: { roleId: string },
  ) {
    return this.admin.assignUserRole(id, body.roleId);
  }

  @Post('users')
  @RequirePermissions(PERMISSIONS.ADMIN_USERS_CREATE)
  createUser(@Body(new ZodValidationPipe(createAdminUserSchema)) body: unknown) {
    return this.admin.createUser(body as Parameters<AdminService['createUser']>[0]);
  }
}
