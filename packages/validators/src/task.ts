import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@vibe-crm/shared';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional(),
  clientId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
