import { z } from 'zod';
import { EntityType } from '@vibe-crm/shared';

export const presignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.coerce.number().int().min(1).max(10 * 1024 * 1024),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string().uuid(),
});

export const confirmUploadSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.coerce.number().int().min(1),
  entityType: z.nativeEnum(EntityType),
  entityId: z.string().uuid(),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
