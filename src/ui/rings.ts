// The result rings: the same diagram in every game. The target sits at the
// centre; an answer lands at a distance set by its points (each ring is two
// points less) in the direction of its error. The reveal is the one authored
// motion in the app: the marker travels in from outside and settles.
import { svg } from '../core/dom';
import { reducedMotion, type Outcome } from '../core/game';

const NS = 'http://www.w3.org/2000/svg';
const R = 90;

export const radiusFor = (points: number) => (Math.min(10, Math.max(0, 10 - points)) / 10) * R;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

export interface RingsView {
  el: SVGSVGElement;
  /** Adds an answer marker; `animate` sends it in from outside. */
  add(o: Outcome, n: number, animate?: boolean): void;
}

export function resultRings(label: string, axis?: { up: string; down: string } | null): RingsView {
  const root = svg(
    `<svg class="rings" viewBox="-104 -124 208 254" role="img"><title></title></svg>`,
  );
  root.querySelector('title')!.textContent = label;
  for (let p = 8; p >= 0; p -= 2) {
    root.append(el('circle', { class: 'rings-line', r: radiusFor(p), cx: 0, cy: 0 }));
    const lab = el('text', { class: 'rings-num', x: radiusFor(p) - 2, y: -2, 'text-anchor': 'end' });
    lab.textContent = String(p);
    if (p > 0) root.append(lab);
  }
  root.append(el('line', { class: 'rings-axis', x1: 0, y1: -R, x2: 0, y2: R }));
  root.append(el('circle', { class: 'rings-bull', r: 3.5, cx: 0, cy: 0 }));
  if (axis) {
    const up = el('text', { class: 'rings-word', x: 0, y: -R - 20, 'text-anchor': 'middle' });
    up.textContent = axis.up;
    const down = el('text', { class: 'rings-word', x: 0, y: R + 28, 'text-anchor': 'middle' });
    down.textContent = axis.down;
    root.append(up, down);
  }
  const marks = el('g', { class: 'rings-marks' });
  root.append(marks);
  const placed: { x: number; y: number }[] = [];
  /** Same radius, nudged around the ring (alternating sides, same half) until clear of the others. */
  function place(r: number, angle: number) {
    const clear = (p: { x: number; y: number }) => placed.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= 18);
    let best = { x: r * Math.sin(angle), y: -r * Math.cos(angle) };
    if (!clear(best)) {
      // Near the centre there is no room to step along the ring: fan out on a
      // small circle instead (a marker is bigger than that distance anyway).
      const rr = Math.max(r, 18);
      const at = (a: number) => ({ x: rr * Math.sin(a), y: -rr * Math.cos(a) });
      const step = 18 / rr;
      best = at(angle);
      for (let k = 1; k <= 14 && !clear(best); k++) {
        const a = angle + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
        // Stay on the same side of the horizontal, so up still means up (the centre has no side).
        if (r > 18 && Math.cos(a) * Math.cos(angle) < 0) continue;
        best = at(a);
      }
    }
    placed.push(best);
    return best;
  }

  return {
    el: root as SVGSVGElement,
    add(o, n, animate = false) {
      const r = radiusFor(o.points);
      const { x, y } = place(r, o.angle);
      const g = el('g', { class: 'rings-mark' });
      const dot = el('circle', { r: 8.5, cx: 0, cy: 0, class: 'rings-dot' });
      if (o.swatch) dot.setAttribute('style', `fill:${o.swatch[1]}`);
      const num = el('text', { class: 'rings-n', x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      num.textContent = String(n);
      g.append(dot, num);
      marks.append(g);
      const to = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      if (!animate || reducedMotion()) {
        g.style.transform = to;
        return;
      }
      // From outside the outer ring, along the same direction, to its place.
      const fx = (R + 30) * Math.sin(o.angle);
      const fy = -(R + 30) * Math.cos(o.angle);
      g.animate([{ transform: `translate(${fx}px, ${fy}px)` }, { transform: to }], {
        duration: 900,
        delay: 150,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both',
      });
    },
  };
}
