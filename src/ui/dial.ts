// The concentric ring dial: the one control every dial game shares. Each ring
// is a value; grab a ring where it lies and turn it around the centre. The ring
// face rotates under a fixed index at twelve o'clock, so the value you have set
// is always the part of the ring under the index. Keyboard: arrows, Page Up/Down,
// Home/End; mouse wheel over a ring.
import { focusForKeys, h } from '../core/dom';

export interface RingSpec {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Values wrap around (hue) instead of stopping at the ends. */
  wrap?: boolean;
  /** Value change for one full clockwise turn. */
  perTurn: number;
  step: number;
  big: number;
  /** aria-valuetext; omit to hide the value from assistive tech too (the game is to find it). */
  text?(v: number): string;
  /** Paints the face (background) for the current state; `shape` says whether it is a ring or a strip. */
  paint(face: HTMLElement, v: number, shape: 'ring' | 'strip'): void;
}

export interface Dial {
  el: HTMLElement;
  /** Inner hole, free for a game's own content. */
  hub: HTMLElement;
  value(i: number): number;
  set(i: number, v: number): void;
  /** Repaints every ring face (after a value changed that others depend on). */
  repaint(): void;
  focus(): void;
}

const TAU = Math.PI * 2;

export function dial(
  specs: RingSpec[],
  on: { input(i: number, v: number): void; grab?(i: number): void; release?(i: number): void },
): Dial {
  const n = specs.length;
  // Band and gap as a share of the dial's radius.
  const band = n === 1 ? 0.3 : 0.2;
  const gap = n === 1 ? 0 : 0.035;
  const values = specs.map((s) => s.value);

  const rings = specs.map((s, i) => {
    const outer = 1 - i * (band + gap);
    const inner = outer - band;
    const face = h('span', { class: 'ring-face' });
    const ring = h(
      'span',
      {
        class: 'ring',
        role: 'slider',
        tabindex: 0,
        'aria-label': s.label,
        'aria-valuemin': s.min,
        'aria-valuemax': s.max,
        'aria-orientation': 'horizontal',
        style: {
          inset: `${((1 - outer) * 50).toFixed(3)}%`,
          // Mask the face down to the band: inner radius as a share of this ring's own radius.
          '--hole': `${((inner / outer) * 100).toFixed(2)}%`,
        },
      },
      face,
    );
    ring.addEventListener('keydown', (e) => {
      const k = e.key;
      let d = 0;
      if (k === 'ArrowRight' || k === 'ArrowUp') d = s.step;
      else if (k === 'ArrowLeft' || k === 'ArrowDown') d = -s.step;
      else if (k === 'PageUp') d = s.big;
      else if (k === 'PageDown') d = -s.big;
      else if (k === 'Home') return e.preventDefault(), commit(i, s.min);
      else if (k === 'End') return e.preventDefault(), commit(i, s.max);
      else return;
      e.preventDefault();
      on.grab?.(i);
      commit(i, values[i] + d * (e.shiftKey ? 5 : 1));
      on.release?.(i);
    });
    ring.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        on.grab?.(i);
        commit(i, values[i] - Math.sign(e.deltaY) * s.step * (e.shiftKey ? 5 : 1));
        on.release?.(i);
      },
      { passive: false },
    );
    return { ring, face, inner, outer };
  });

  // The index: one bar at twelve o'clock across every band, from just outside the dial to the hole.
  const index = h('span', {
    class: 'dial-index',
    'aria-hidden': 'true',
    style: { height: `calc(${((1 - rings[n - 1].inner) * 50).toFixed(2)}% + 14px)` },
  });
  const hub = h('div', { class: 'dial-hub', style: { inset: `${((1 - rings[n - 1].inner) * 50 + 2).toFixed(2)}%` } });
  const el = h('div', { class: `dial dial--${n}` }, ...rings.map((r) => r.ring), index, hub);

  function norm(i: number, v: number): number {
    const s = specs[i];
    if (s.wrap) {
      const span = s.max - s.min;
      return ((((v - s.min) % span) + span) % span) + s.min;
    }
    return Math.min(s.max, Math.max(s.min, v));
  }

  function draw(i: number) {
    const s = specs[i];
    const v = values[i];
    const r = rings[i];
    // The face turns with the finger; the value under the index sits at the face's
    // -angle, so faces are painted counter-clockwise (see the Tint gradients).
    r.face.style.transform = `rotate(${(((v - s.min) / s.perTurn) * 360).toFixed(3)}deg)`;
    r.ring.setAttribute('aria-valuenow', String(Math.round(v)));
    if (s.text) r.ring.setAttribute('aria-valuetext', s.text(v));
    s.paint(r.face, v, 'ring');
  }

  function commit(i: number, v: number) {
    const nv = norm(i, v);
    if (nv === values[i]) return;
    values[i] = nv;
    draw(i);
    on.input(i, nv);
  }

  // ── Pointer: grab the ring under the finger, turn it around the centre ──
  el.addEventListener('pointerdown', (e) => {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const R = box.width / 2;
    const rel = Math.hypot(e.clientX - cx, e.clientY - cy) / R;
    // The ring whose band (padded by half a gap, and generously outside) holds the point.
    let i = rings.findIndex((r) => rel <= r.outer + (r === rings[0] ? 0.25 : gap / 2) && rel >= r.inner - gap / 2);
    if (i < 0) return;
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone: the drag still works while it stays over the control */
    }
    rings[i].ring.focus({ preventScroll: true });
    el.classList.add('is-turning');
    rings[i].ring.classList.add('is-grabbed');
    on.grab?.(i);
    let last = Math.atan2(e.clientY - cy, e.clientX - cx);
    let carry = values[i];
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let d = a - last;
      if (d > Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      last = a;
      // Keep the unclamped sum so a ring stopped at an end does not creep.
      carry += (d / TAU) * specs[i].perTurn;
      const before = values[i];
      commit(i, carry);
      if (!specs[i].wrap && values[i] === before) carry = Math.min(specs[i].max, Math.max(specs[i].min, carry));
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.classList.remove('is-turning');
      rings[i].ring.classList.remove('is-grabbed');
      on.release?.(i);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  specs.forEach((_, i) => draw(i));

  return {
    el,
    hub,
    value: (i) => values[i],
    set(i, v) {
      values[i] = norm(i, v);
      draw(i);
    },
    repaint() {
      specs.forEach((_, i) => draw(i));
    },
    focus() {
      focusForKeys(rings[0].ring);
    },
  };
}

/** A face of evenly spaced ticks, every `every`-th one long; for single-ring dials. */
export function tickFace(face: HTMLElement, ticks: number) {
  face.style.background = `repeating-conic-gradient(from -0.8deg, var(--ink) 0 1.6deg, transparent 1.6deg ${360 / ticks}deg), color-mix(in srgb, var(--ink) 16%, transparent)`;
}
