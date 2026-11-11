import { isValidTrustProxy, parseTrustProxy } from './trust-proxy';

describe('isValidTrustProxy', () => {
  it.each([
    'false',
    'loopback',
    '0',
    '1',
    '12',
    '10.0.0.1',
    '10.0.0.0/8',
    '192.168.1.0/24',
    '::1',
    'fd00::/8',
    '2001:db8::/128',
    'loopback, 10.0.0.0/8',
    'loopback,linklocal,uniquelocal',
    '127.0.0.1, 192.168.1.0/24, ::1',
  ])('accepts %p', (value) => {
    expect(isValidTrustProxy(value)).toBe(true);
  });

  it.each([
    'true',
    '',
    'localhost',
    'yes',
    '-1',
    '1.5',
    '1.2.3',
    '10.0.0.0/33',
    '::1/129',
    '10.0.0.0/',
    '10.0.0.0/8/1',
    '10.0.0.0/abc',
    'loopback,',
    'loopback, true',
  ])('rejects %p', (value) => {
    expect(isValidTrustProxy(value)).toBe(false);
  });
});

describe('parseTrustProxy', () => {
  it('maps "false" to false', () => {
    expect(parseTrustProxy('false')).toBe(false);
  });

  it('maps a hop count to a number', () => {
    expect(parseTrustProxy('2')).toBe(2);
  });

  it('maps presets, IPs and CIDRs to a trimmed list', () => {
    expect(parseTrustProxy('loopback')).toEqual(['loopback']);
    expect(parseTrustProxy('loopback, 10.0.0.0/8 ,::1')).toEqual([
      'loopback',
      '10.0.0.0/8',
      '::1',
    ]);
  });
});
