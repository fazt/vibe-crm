import { z } from 'zod';
import { WorkspaceRoleSlug } from '@vibe-crm/shared';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleSlug: z
    .enum([WorkspaceRoleSlug.ADMIN, WorkspaceRoleSlug.MEMBER])
    .default(WorkspaceRoleSlug.MEMBER),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
