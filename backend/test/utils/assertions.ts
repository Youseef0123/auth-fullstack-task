import type { Response } from 'supertest';

const PASSWORD_KEY = /password/i;
const PASSWORD_HASH = /\$argon2/;

/** Returns the JSON paths of any password-like key or argon2 hash. */
export function findPasswordLeaks(value: unknown, path = 'body'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findPasswordLeaks(item, `${path}[${index}]`),
    );
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => [
      ...(PASSWORD_KEY.test(key) ? [`${path}.${key}`] : []),
      ...findPasswordLeaks(child, `${path}.${key}`),
    ]);
  }
  return typeof value === 'string' && PASSWORD_HASH.test(value) ? [path] : [];
}

/** No recorded response may expose a password field, a hash or a plain password. */
export function expectNoPasswordLeaks(
  responses: Response[],
  plainPasswords: string[],
): void {
  for (const response of responses) {
    expect(findPasswordLeaks(response.body)).toEqual([]);
    for (const password of plainPasswords) {
      expect(response.text ?? '').not.toContain(password);
    }
  }
}

export interface ParsedCookie {
  value: string;
  attributes: Map<string, string>;
}

/** Parses a Set-Cookie header; attribute names are lowercased, flags map to "". */
export function getSetCookie(
  response: Response,
  name: string,
): ParsedCookie | undefined {
  const header = (response.get('Set-Cookie') ?? []).find((cookie) =>
    cookie.startsWith(`${name}=`),
  );
  if (!header) {
    return undefined;
  }
  const [pair, ...attributes] = header.split(';').map((part) => part.trim());
  return {
    value: pair.slice(name.length + 1),
    attributes: new Map(
      attributes.map((attribute) => {
        const [key, ...rest] = attribute.split('=');
        return [key.toLowerCase(), rest.join('=')];
      }),
    ),
  };
}
