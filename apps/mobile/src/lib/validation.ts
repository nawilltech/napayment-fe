import type { ZodSchema } from 'zod';

/** Parse with a shared @napayment/schemas schema; first message per field on failure. */
export function validate<T>(schema: ZodSchema<T>, values: unknown):
  | { ok: true; data: T; errors: Record<string, string> }
  | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
