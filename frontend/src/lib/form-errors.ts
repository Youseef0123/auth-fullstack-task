import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api-error';

interface ApplyApiErrorOptions<T extends FieldValues> {
  /** Form fields that may receive backend validation messages. */
  fields: readonly Path<T>[];
  /** Feature-specific lookup from a backend message to the field it belongs to. */
  fieldForMessage?: (message: string) => string | undefined;
  /** Routes a whole status to one field, e.g. 409 -> email. */
  fieldByStatus?: Partial<Record<number, Path<T>>>;
}

/**
 * Shows a failed request on the form: each backend message on its field (first
 * one per field), otherwise the error's user-facing message at form level.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  { fields, fieldForMessage, fieldByStatus = {} }: ApplyApiErrorOptions<T>,
): void {
  const apiError = ApiError.from(error);

  const statusField = fieldByStatus[apiError.statusCode];
  if (statusField) {
    setError(
      statusField,
      { type: 'server', message: apiError.message },
      { shouldFocus: true },
    );
    return;
  }

  const assigned = new Set<Path<T>>();
  for (const message of apiError.messages) {
    const target = fieldForMessage?.(message);
    const field = fields.find((candidate) => candidate === target);
    if (field && !assigned.has(field)) {
      setError(
        field,
        { type: 'server', message },
        { shouldFocus: assigned.size === 0 },
      );
      assigned.add(field);
    }
  }
  if (assigned.size === 0) {
    setError('root.server', { type: 'server', message: apiError.message });
  }
}
