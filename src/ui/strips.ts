// The strip control: the ring dial's compact sibling for narrow screens, where
// a colour game needs the screen for the colour. Each value is a flat band; the
// notch above it marks the value. Press anywhere on a band to jump there, drag
// to slide; keyboard and wheel as on the dial.
import { focusForKeys, h } from '../core/dom';
import type { Dial, RingSpec } from './dial';

export function strips(specs: RingSpec[], on: { input(i: number, v: number): void }): Dial {
  const values = specs.map((s) => s.value);

  const rows = specs.map((s, i) => {
    const face = h('span', { class: 'strip-face' });
    const notch = h('span', { class: 'strip-notch', 'aria-hidden': 'true' });
    const el = h(
      'div',
      {
        class: 'strip',
        role: 'slider',
        tabindex: 0,
        'aria-label': s.label,
        'aria-valuemin': s.min,
        'aria-valuemax': s.max,
        'aria-orientation': 'horizontal',
      },
      h('span', { class: 'strip-label', 'aria-hidden': 'true' }, s.label),
      h('span', { class: 'strip-track' }, face, notch),
    );
    el.addEventListener('keydown', (e) => {
      let d = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = s.step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -s.step;
      else if (e.key === 'PageUp') d = s.big;
      else if (e.key === 'PageDown') d = -s.big;
      else if (e.key === 'Home') return e.preventDefault(), commit(i, s.min);
      else if (e.key === 'End') return e.preventDefault(), commit(i, s.max);
      else return;
      e.preventDefault();
      commit(i, values[i] + d * (e.shiftKey ? 5 : 1));
    });
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        commit(i, values[i] - Math.sign(e.deltaY) * s.step * (e.shiftKey ? 5 : 1));
      },
      { passive: false },
    );
    const track = el.querySelector('.strip-track') as HTMLElement;
    const at = (x: number) => {
      const box = track.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (x - box.left) / box.width));
      return s.min + f * (s.max - s.min);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone: the drag still works while it stays over the control */
      }
      el.classList.add('is-grabbed');
      commit(i, at(e.clientX));
      const move = (ev: PointerEvent) => commit(i, at(ev.clientX));
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.classList.remove('is-grabbed');
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
    return { el, face, notch };
  });

  function norm(i: number, v: number) {
    const s = specs[i];
    if (s.wrap) {
      const span = s.max - s.min;
      return ((((v - s.min) % span) + span) % span) + s.min;
    }
    return Math.min(s.max, Math.max(s.min, v));
  }

  function draw(i: number) {
    const s = specs[i];
    const r = rows[i];
    const v = values[i];
    r.notch.style.left = `${(((v - s.min) / (s.max - s.min)) * 100).toFixed(3)}%`;
    r.el.setAttribute('aria-valuenow', String(Math.round(v)));
    if (s.text) r.el.setAttribute('aria-valuetext', s.text(v));
    s.paint(r.face, v, 'strip');
  }

  function commit(i: number, v: number) {
    const nv = norm(i, v);
    if (nv === values[i]) return;
    values[i] = nv;
    draw(i);
    on.input(i, nv);
  }

  specs.forEach((_, i) => draw(i));
  const el = h('div', { class: 'strips' }, ...rows.map((r) => r.el));

  return {
    el,
    hub: el,
    value: (i) => values[i],
    set(i, v) {
      values[i] = norm(i, v);
      draw(i);
    },
    repaint() {
      specs.forEach((_, i) => draw(i));
    },
    focus() {
      focusForKeys(rows[0].el);
    },
  };
}
