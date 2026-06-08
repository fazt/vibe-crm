import { z } from 'zod';
import { EntityType } from '@vibe-crm/shared';

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#6366f1'),
});

export const assignTagSchema = z.object({
  tagId: z.string().uuid(),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string().uuid(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
