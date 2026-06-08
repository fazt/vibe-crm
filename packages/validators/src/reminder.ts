import { z } from 'zod';
import { EntityType } from '@vibe-crm/shared';

export const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  dueAt: z.coerce.date(),
  entityType: z.nativeEnum(EntityType).optional(),
  entityId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
