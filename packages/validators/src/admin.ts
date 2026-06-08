import { z } from 'zod';

export const createRoleSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissionKeys: z.array(z.string()).min(1),
});

export const assignUserRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  roleId: z.string().uuid(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
