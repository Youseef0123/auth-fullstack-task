import { describe, expect, it } from 'vitest';
import * as frontendModule from '@/features/auth/schemas/validation.constants';
import * as backendModule from '../../../../../backend/src/common/constants/validation.constants';

const frontend: Record<string, unknown> = { ...frontendModule };
const backend: Record<string, unknown> = { ...backendModule };

/** Deep-copies a value with every RegExp replaced by its source and flags. */
function normalize(value: unknown): unknown {
  if (value instanceof RegExp) {
    return { regExpSource: value.source, regExpFlags: value.flags };
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalize(child)]),
    );
  }
  return value;
}

describe('validation constants (drift guard against the backend)', () => {
  it('exports exactly the same constants', () => {
    expect(Object.keys(frontend).sort()).toEqual(Object.keys(backend).sort());
  });

  it.each(Object.keys(backend))(
    '%s is deeply equal, regexes compared by source and flags',
    (name) => {
      expect(normalize(frontend[name])).toEqual(normalize(backend[name]));
    },
  );
});
