import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
  clientId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
