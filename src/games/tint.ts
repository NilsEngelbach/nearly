// Tint: a colour shows for three seconds; mix it again on three rings.
// Scored by the distance between the two colours in OKLab.
import { deltaE, hex, hsbCss, hueDiff, luminance, oklab, type Hsb } from '../core/color';
import { h, svg } from '../core/dom';
import { wait, type Game, type Outcome, type Round, type RoundCtx } from '../core/game';
import { num, t } from '../core/i18n';
import { rand, randAway } from '../core/rng';
import { points } from '../core/score';
import { dial } from '../ui/dial';
import { strips } from '../ui/strips';

const SHOW_S = 3;
/** Colour difference that scores 5 of 10. */
const HALF = 10;

const inkOn = (c: Hsb): 'dark' | 'light' => (luminance(c) > 0.2 ? 'dark' : 'light');

let used: number[] = [];

function target(): Hsb {
  const hue = randAway(0, 360, used, 45, (a, b) => Math.abs(hueDiff(a, b)));
  used.push(hue);
  // Not too grey and not too dark, where hue stops meaning much.
  return { h: hue, s: rand(30, 100), b: rand(38, 100) };
}

function start(tg: Hsb): Hsb {
  for (let i = 0; i < 20; i++) {
    const c = { h: rand(0, 360), s: rand(15, 100), b: rand(25, 100) };
    if (deltaE(c, tg) > 30) return c;
  }
  return { h: (tg.h + 180) % 360, s: 50, b: 60 };
}

function hueName(hue: number): string {
  return t.hues[Math.round((((hue % 360) + 360) % 360) / 30) % 12];
}

function score(tg: Hsb, ans: Hsb): Outcome {
  const d = deltaE(tg, ans);
  const [L1, a1, b1] = oklab(tg);
  const [L2, a2, b2] = oklab(ans);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const dL = (L2 - L1) * 100;
  const dC = (C2 - C1) * 100;
  const dh = hueDiff(tg.h, ans.h);
  // The miss split into lightness, chroma and hue, all in the same OKLab units:
  // ΔH = 2·√(C1·C2)·sin(Δh/2), so the three parts add up (in squares) to ΔE.
  const okHue = Math.atan2(b2, a2) - Math.atan2(b1, a1);
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(Math.atan2(Math.sin(okHue), Math.cos(okHue)) / 2) * 100;
  const parts: [number, string][] = [];
  if (Math.abs(dL) >= 3) parts.push([Math.abs(dL), dL > 0 ? t.lighter : t.darker]);
  if (Math.abs(dC) >= 3) parts.push([Math.abs(dC), dC > 0 ? t.vivid : t.dull]);
  if (Math.abs(dh) >= 8 && Math.abs(dH) >= 3) {
    // A small miss leans toward the next hue over; a big one is named for where it landed.
    const towards = Math.abs(dh) >= 40 ? ans.h : tg.h + Math.sign(dh) * 30;
    parts.push([Math.abs(dH), t.leans(hueName(towards))]);
  }
  parts.sort((x, y) => y[0] - x[0]);
  const words = parts.slice(0, 2).map((p) => p[1]);
  const verdict = words.length ? words.join(', ') : t.spotOn;

  // Direction on the rings: the miss in the a/b plane (hue and chroma), or up
  // and down for a miss in lightness alone.
  const da = a2 - a1;
  const db = b2 - b1;
  const angle = Math.hypot(da, db) * 100 > Math.abs(dL) * 0.5 ? Math.atan2(da, db) : dL > 0 ? 0 : Math.PI;
  return {
    points: points(d, HALF),
    angle,
    verdict: `${verdict} · ${t.deltaE(num(d, 1))}`,
    target: hex(tg),
    answer: hex(ans),
    swatch: [hsbCss(tg), hsbCss(ans)],
  };
}

/**
 * Faces for the three controls. A ring turns with the finger, so the value
 * under its index is the one painted at the face's -angle: ring gradients run
 * counter-clockwise. A strip runs left to right.
 */
function hueFace(shape: 'ring' | 'strip'): string {
  const stops = [];
  for (let d = 0; d <= 360; d += 30) {
    const hue = shape === 'ring' ? (360 - d) % 360 : d;
    stops.push(`${hsbCss({ h: hue, s: 100, b: 100 })} ${shape === 'ring' ? `${d}deg` : `${(d / 3.6).toFixed(2)}%`}`);
  }
  return shape === 'ring' ? `conic-gradient(${stops.join(', ')})` : `linear-gradient(to right, ${stops.join(', ')})`;
}

function rampFace(shape: 'ring' | 'strip', from: string, to: string): string {
  return shape === 'ring' ? `conic-gradient(${to}, ${from})` : `linear-gradient(to right, ${from}, ${to})`;
}

/** Phones and narrow windows get strips, so the colour keeps the screen. */
const narrow = () => matchMedia('(max-width: 959px)').matches;

function round(): Round {
  const tg = target();
  let ans: Hsb = start(tg);

  return {
    async show(ctx: RoundCtx) {
      ctx.ground(hsbCss(tg), inkOn(tg));
      ctx.cue(t.tintShow);
      const count = h('p', { class: 'count', 'aria-hidden': 'true' });
      ctx.stage.append(count);
      for (let s = SHOW_S; s > 0; s--) {
        count.textContent = String(s);
        await wait(1000, ctx.signal);
      }
    },

    async make(ctx: RoundCtx) {
      ctx.ground(hsbCss(ans), inkOn(ans));
      ctx.cue(t.tintMake);
      const compact = narrow();
      ctx.note(compact ? t.tintHintStrips : t.tintHint);
      const paint = () => {
        ctx.ground(hsbCss(ans), inkOn(ans));
      };
      const d = (compact ? strips : dial)(
        [
          {
            label: t.hue,
            value: ans.h,
            min: 0,
            max: 360,
            wrap: true,
            perTurn: 360,
            step: 1,
            big: 15,
            paint: (face, _v, shape) => (face.style.background = hueFace(shape)),
          },
          {
            label: t.saturation,
            value: ans.s,
            min: 0,
            max: 100,
            perTurn: 100,
            step: 1,
            big: 10,
            paint: (face, _v, shape) =>
              (face.style.background = rampFace(shape, hsbCss({ ...ans, s: 0 }), hsbCss({ ...ans, s: 100 }))),
          },
          {
            label: t.brightness,
            value: ans.b,
            min: 0,
            max: 100,
            perTurn: 100,
            step: 1,
            big: 10,
            paint: (face, _v, shape) =>
              (face.style.background = rampFace(shape, hsbCss({ ...ans, b: 0 }), hsbCss({ ...ans, b: 100 }))),
          },
        ],
        {
          input(i, v) {
            ans = { ...ans, [i === 0 ? 'h' : i === 1 ? 's' : 'b']: v };
            paint();
            d.repaint();
          },
        },
      );
      ctx.stage.append(d.el);
      d.focus();
      await ctx.action(t.lockIn).pressed;
      return score(tg, ans);
    },

    compare(ctx, el) {
      ctx.ground('var(--paper)', 'dark');
      el.append(
        h(
          'div',
          { class: 'swatches' },
          h('figure', { class: 'swatch', style: { background: hsbCss(tg) } }, h('figcaption', { 'data-on': inkOn(tg) }, h('b', {}, t.target), h('span', {}, hex(tg)))),
          h('figure', { class: 'swatch', style: { background: hsbCss(ans) } }, h('figcaption', { 'data-on': inkOn(ans) }, h('b', {}, t.yours), h('span', {}, hex(ans)))),
        ),
      );
    },
  };
}

export const tint: Game = {
  id: 'tint',
  name: 'Tint',
  kind: () => t.tintKind,
  rule: () => t.tintRule,
  needs: 'sight',
  ink: 'red',
  figure: () =>
    svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMaxYMin meet">
      <circle cx="168" cy="22" r="70" fill="none" stroke="var(--paper)" stroke-width="16"/>
      <circle cx="150" cy="50" r="38" fill="var(--yellow)"/>
      <circle cx="150" cy="50" r="38" fill="none" stroke="var(--black)" stroke-width="7"/>
      <circle cx="104" cy="94" r="14" fill="var(--blue)"/>
    </svg>`),
  newRound(i) {
    if (i === 0) used = [];
    return round();
  },
};
