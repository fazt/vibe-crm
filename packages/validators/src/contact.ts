import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  clientId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  isPrimary: z.boolean().default(false),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
