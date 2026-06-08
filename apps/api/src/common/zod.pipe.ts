import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      (result.error as ZodError).issues.forEach((issue) => {
        const key = issue.path.join('.') || '_root';
        errors[key] = errors[key] ?? [];
        errors[key].push(issue.message);
      });
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
    return result.data;
  }
}
