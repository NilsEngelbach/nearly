// Random helpers for targets. Free play only, so Math.random is enough.

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Like rand, but at least `gap` away from every value in `avoid` (best of a few tries). */
export function randAway(min: number, max: number, avoid: number[], gap: number, dist = (a: number, b: number) => Math.abs(a - b)): number {
  let best = rand(min, max);
  let bestD = -1;
  for (let i = 0; i < 12; i++) {
    const v = rand(min, max);
    const d = avoid.length ? Math.min(...avoid.map((a) => dist(a, v))) : Infinity;
    if (d >= gap) return v;
    if (d > bestD) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
