import { z } from 'zod';
import { OpportunityStatus } from '@vibe-crm/shared';

export const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  value: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().min(0).max(100).default(0),
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.OPEN),
  stageId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  expectedCloseDate: z.coerce.date().optional(),
  description: z.string().max(2000).optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const updateOpportunityStageSchema = z.object({
  stageId: z.string().uuid(),
  order: z.coerce.number().int().min(0).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
