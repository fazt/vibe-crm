import { z } from 'zod';
import { ClientStatus } from '@vibe-crm/shared';

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  status: z.nativeEnum(ClientStatus).default(ClientStatus.PROSPECT),
  companyId: z.string().uuid().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientFilterSchema = z.object({
  status: z.nativeEnum(ClientStatus).optional(),
  assigneeId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
