// One curve for every game: 10 points for a perfect answer, 5 at the game's
// "half-way" error, falling off smoothly after that. Each game picks the error
// measure (colour difference, cents, percent) and its half-way point.

export const ROUND_MAX = 10;
export const ROUNDS = 5;

/** 10 at err = 0, 5 at err = half, about 1 at err = 3 × half. */
export function points(err: number, half: number): number {
  const x = Math.abs(err) / half;
  return ROUND_MAX / (1 + x * x);
}

/** Points are shown with one decimal; totals add the rounded values so the sum checks out. */
export const round1 = (v: number) => Math.round(v * 10) / 10;

export function fmt(v: number, lang: string): string {
  return round1(v).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
