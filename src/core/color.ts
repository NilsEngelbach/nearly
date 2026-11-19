// Colour maths: HSB (what the player dials) to sRGB, and OKLab for the score.
// OKLab (Björn Ottosson, 2020) is perceptually uniform enough that the plain
// distance between two colours tracks how different they look.

export interface Hsb {
  /** 0–360 */
  h: number;
  /** 0–100 */
  s: number;
  /** 0–100 */
  b: number;
}

export function hsbToRgb({ h, s, b }: Hsb): [number, number, number] {
  const S = s / 100;
  const V = b / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return V - V * S * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

export function rgbCss([r, g, b]: [number, number, number]): string {
  const c = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255);
  return `rgb(${c(r)} ${c(g)} ${c(b)})`;
}

export const hsbCss = (c: Hsb) => rgbCss(hsbToRgb(c));

export function hex(c: Hsb): string {
  return (
    '#' +
    hsbToRgb(c)
      .map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

const lin = (x: number) => (x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));

export function oklab(c: Hsb): [number, number, number] {
  const [r, g, b] = hsbToRgb(c).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Perceptual difference, scaled so 1 is about the smallest step people notice side by side. */
export function deltaE(a: Hsb, b: Hsb): number {
  const [l1, a1, b1] = oklab(a);
  const [l2, a2, b2] = oklab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100;
}

/** Relative luminance (WCAG), to pick ink that reads on a colour. */
export function luminance(c: Hsb): number {
  const [r, g, b] = hsbToRgb(c).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Signed hue difference a → b in degrees, -180..180. */
export const hueDiff = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;
