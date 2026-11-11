import { isIP } from 'node:net';

/** Value accepted by Express' "trust proxy" setting. */
export type TrustProxySetting = false | number | string[];

const PROXY_ADDRESS_PRESETS = new Set(['loopback', 'linklocal', 'uniquelocal']);
const MAX_PREFIX_LENGTH: Record<number, number> = { 4: 32, 6: 128 };
const HOP_COUNT_PATTERN = /^\d+$/;
const PREFIX_LENGTH_PATTERN = /^\d{1,3}$/;

function isTrustedProxyEntry(entry: string): boolean {
  if (PROXY_ADDRESS_PRESETS.has(entry)) {
    return true;
  }
  const [address, prefixLength, ...rest] = entry.split('/');
  const ipVersion = isIP(address);
  if (ipVersion === 0 || rest.length > 0) {
    return false;
  }
  return (
    prefixLength === undefined ||
    (PREFIX_LENGTH_PATTERN.test(prefixLength) &&
      Number(prefixLength) <= MAX_PREFIX_LENGTH[ipVersion])
  );
}

function splitEntries(value: string): string[] {
  return value.split(',').map((entry) => entry.trim());
}

/**
 * Accepts "false", a hop count (e.g. "1"), or a comma-separated list of
 * IPs, CIDRs and the presets loopback / linklocal / uniquelocal.
 * "true" is rejected on purpose: trusting every hop lets any client spoof
 * its IP through X-Forwarded-For.
 */
export function isValidTrustProxy(value: string): boolean {
  return (
    value === 'false' ||
    HOP_COUNT_PATTERN.test(value) ||
    splitEntries(value).every(isTrustedProxyEntry)
  );
}

export function parseTrustProxy(value: string): TrustProxySetting {
  if (value === 'false') {
    return false;
  }
  if (HOP_COUNT_PATTERN.test(value)) {
    return Number(value);
  }
  return splitEntries(value);
}
