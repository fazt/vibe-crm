import { z } from 'zod';
import { ActivityType } from '@vibe-crm/shared';

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  duration: z.coerce.number().int().min(0).optional(),
  outcome: z.string().max(500).optional(),
  occurredAt: z.coerce.date().optional(),
  clientId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  externalId: z.string().optional(),
  source: z.string().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
