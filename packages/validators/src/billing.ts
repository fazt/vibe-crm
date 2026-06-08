import { z } from 'zod';

export const checkoutSchema = z.object({
  priceId: z.string().min(1).optional(),
  plan: z.enum(['studio', 'agency']).optional(),
  interval: z.enum(['month', 'year']).default('month'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
