const MILLISECONDS_PER_UNIT = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

type DurationUnit = keyof typeof MILLISECONDS_PER_UNIT;

export const DURATION_PATTERN = /^([1-9]\d*)([smhd])$/;

export function durationToMilliseconds(duration: string): number {
  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new Error(
      `Invalid duration "${duration}": expected a positive integer followed by s, m, h or d (e.g. 15m)`,
    );
  }

  const [, amount, unit] = match;
  return Number(amount) * MILLISECONDS_PER_UNIT[unit as DurationUnit];
}

export function durationToSeconds(duration: string): number {
  return durationToMilliseconds(duration) / MILLISECONDS_PER_UNIT.s;
}
