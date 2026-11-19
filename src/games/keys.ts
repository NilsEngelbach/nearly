// Keys: a piano note plays twice; find it on the keyboard. Try keys freely,
// then lock one in. Scored in semitones. The notes are a recorded grand piano.
import { focusForKeys, h, svg } from '../core/dom';
import type { Game, Outcome, Round } from '../core/game';
import { lang, t } from '../core/i18n';
import { randAway } from '../core/rng';
import { points } from '../core/score';
import { noteName, noteText } from '../audio/notes';
import { loadPiano, pianoNote } from '../audio/synth';
import { playTwice, replayPair, soundingFigure, spread } from './common';

const LOW = 48; // C3
const HIGH = 83; // B5
/** Semitones that score 5 of 10. */
const HALF = 1.5;

const BLACK = new Set([1, 3, 6, 8, 10]);
const isBlack = (m: number) => BLACK.has(m % 12);
const name = (m: number) => {
  const n = noteName(m, lang);
  return `${noteText(n)}${n.octave}`;
};
const strike = (m: number) => void pianoNote(m);

let used: number[] = [];

/** Narrow screens stack the three octaves (high on top) instead of one 21-key row. */
const stacked = () => matchMedia('(max-width: 639px)').matches;

/** The keyboard, C3 to B5. `onKey` makes it playable; without it, it is a picture. */
function keyboard(onKey?: (m: number) => void) {
  const keys = new Map<number, HTMLElement>();
  const rows: [number, number][] = stacked() ? [[72, 83], [60, 71], [48, 59]] : [[LOW, HIGH]];
  const el = h('div', { class: `kbs${rows.length > 1 ? ' kbs--rows' : ''}` });
  for (const [lo, hi] of rows) el.append(octaves(lo, hi, keys, onKey));
  return { el, keys };
}

/** One keyboard row from `lo` to `hi` (both white keys). */
function octaves(lo: number, hi: number, keys: Map<number, HTMLElement>, onKey?: (m: number) => void) {
  const whites = h('div', { class: 'kb-whites' });
  const blacks = h('div', { class: 'kb-blacks' });
  const whiteCount = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).filter((m) => !isBlack(m)).length;
  let w = 0;
  for (let m = lo; m <= hi; m++) {
    const black = isBlack(m);
    const tag = onKey ? 'button' : 'span';
    const label = m % 12 === 0 ? h('span', { class: 'kb-c' }, name(m)) : null;
    const key = h(tag as 'button', {
      class: black ? 'kb-key kb-key--black' : 'kb-key',
      'data-m': m,
      ...(onKey ? { type: 'button', 'aria-label': t.key(name(m)), 'aria-pressed': 'false' } : {}),
    }, label);
    if (black) {
      key.style.left = `calc(${(w / whiteCount) * 100}% - var(--kb-black) / 2)`;
      blacks.append(key);
    } else {
      w++;
      whites.append(key);
    }
    if (onKey) {
      // Touch and mouse sound on press, not release; keyboard (click with detail 0) on Enter or Space.
      key.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onKey(m);
      });
      key.addEventListener('click', (e) => {
        if (e.detail === 0) onKey(m);
      });
    }
    keys.set(m, key);
  }
  return h('div', { class: 'kb', style: { '--kb-whites': String(whiteCount) } }, whites, blacks);
}

function score(tg: number, ans: number, i: number): Outcome {
  const d = ans - tg;
  const a = Math.abs(d);
  const verdict = d === 0 ? t.exact : a === 12 ? t.octave : `${t.semitones(a)} ${d > 0 ? t.higher : t.lower}`;
  return {
    points: points(d, HALF),
    angle: (d >= 0 ? 0 : Math.PI) + spread(i),
    verdict,
    target: name(tg),
    answer: name(ans),
  };
}

function round(i: number): Round {
  const tg = Math.round(randAway(LOW, HIGH, used, 3));
  used.push(tg);
  let ans: number | null = null;

  return {
    async show(ctx) {
      ctx.cue(t.keysShow);
      const fig = soundingFigure();
      ctx.stage.append(fig.el);
      // The first round waits for the recordings (a moment, once) rather than playing the stand-in.
      await loadPiano();
      await playTwice(fig, () => (strike(tg), 1100), ctx.signal, 400);
    },

    async make(ctx) {
      ctx.cue(t.keysMake);
      ctx.note(t.keysPick);
      const lock = ctx.action(t.lockIn, false);
      const kb = keyboard((m) => {
        strike(m);
        if (ans !== null) kb.keys.get(ans)?.setAttribute('aria-pressed', 'false');
        ans = m;
        kb.keys.get(m)?.setAttribute('aria-pressed', 'true');
        ctx.note(name(m));
        lock.enable(true);
      });
      ctx.stage.append(kb.el);
      focusForKeys(kb.keys.get(LOW));
      await lock.pressed;
      return score(tg, ans ?? tg, i);
    },

    compare(_ctx, el) {
      const kb = keyboard();
      const a = ans ?? tg;
      const mark = (m: number, cls: string, text: string) => {
        const key = kb.keys.get(m);
        key?.classList.add(cls);
        key?.append(h('span', { class: 'kb-mark' }, text));
      };
      if (a === tg) mark(tg, 'is-target', `${t.target} = ${t.yours}`);
      else {
        mark(tg, 'is-target', t.target);
        mark(a, 'is-yours', t.yours);
      }
      el.append(kb.el);
      replayPair(el, { label: name(tg), play: () => strike(tg) }, { label: name(a), play: () => strike(a) });
    },
  };
}

export const keys: Game = {
  id: 'keys',
  name: 'Keys',
  kind: () => t.keysKind,
  rule: () => t.keysRule,
  needs: 'sound',
  ink: 'paper',
  axis: () => ({ up: t.higher, down: t.lower }),
  figure: () => {
    // Ten white keys, black keys between, one key in red: the note to find.
    // The keyboard hangs from the top; the paper below it carries the name and caption.
    const whites = Array.from({ length: 10 }, (_, k) => `<rect x="${k * 20}" y="-4" width="20" height="68" fill="${k === 6 ? 'var(--red)' : 'none'}" stroke="var(--black)" stroke-width="3"/>`).join('');
    const pattern = [1, 1, 0, 1, 1, 1, 0, 1, 1, 0];
    const blacks = pattern
      .map((on, k) => (on && k < 9 ? `<rect x="${k * 20 + 13}" y="0" width="14" height="40" fill="var(--black)"/>` : ''))
      .join('');
    return svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMidYMin slice"><rect x="-200" y="66" width="600" height="400" fill="var(--black)"/>${whites}${blacks}</svg>`);
  },
  newRound(i) {
    if (i === 0) {
      used = [];
      void loadPiano();
    }
    return round(i);
  },
};
