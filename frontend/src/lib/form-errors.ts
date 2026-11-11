import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api-error';

interface ApplyApiErrorOptions<T extends FieldValues> {
  /** Form fields that may receive backend validation messages. */
  fields: readonly Path<T>[];
  /** Routes a whole status to one field, e.g. 409 -> email. */
  fieldByStatus?: Partial<Record<number, Path<T>>>;
}

/** Shows a failed request on the form: on the matching fields, else as a form-level error. */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  { fields, fieldByStatus = {} }: ApplyApiErrorOptions<T>,
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

  const fieldsWithErrors = fields.filter(
    (field) => apiError.fieldErrors?.[field],
  );
  fieldsWithErrors.forEach((field, index) => {
    setError(
      field,
      { type: 'server', message: apiError.fieldErrors?.[field] },
      { shouldFocus: index === 0 },
    );
  });
  if (fieldsWithErrors.length === 0) {
    setError('root.server', { type: 'server', message: apiError.message });
  }
}
