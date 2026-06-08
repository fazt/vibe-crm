import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

export function formResolver<T extends FieldValues>(schema: ZodTypeAny): Resolver<T> {
  return zodResolver(schema) as Resolver<T>;
}
