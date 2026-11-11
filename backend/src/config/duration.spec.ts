import { durationToMilliseconds, durationToSeconds } from './duration';

describe('durationToMilliseconds', () => {
  it.each([
    ['1s', 1_000],
    ['45s', 45_000],
    ['1m', 60_000],
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['12h', 43_200_000],
    ['1d', 86_400_000],
    ['7d', 604_800_000],
  ])('converts %p to %p ms', (duration, expected) => {
    expect(durationToMilliseconds(duration)).toBe(expected);
  });

  it.each(['', '0s', '15', '1w', '1.5h', '-1d', ' 1d', '1D', '1 d'])(
    'rejects %p',
    (duration) => {
      expect(() => durationToMilliseconds(duration)).toThrow(
        `Invalid duration "${duration}"`,
      );
    },
  );
});

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['1h', 3_600],
    ['1d', 86_400],
  ])('converts %p to %p seconds', (duration, expected) => {
    expect(durationToSeconds(duration)).toBe(expected);
  });
});
