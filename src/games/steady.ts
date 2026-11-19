// Steady: a beat plays for two bars, then stops; the player taps the next two
// bars on their own. Every tap is judged against where its beat would have
// fallen, so the result shows the drift note by note.
import { focusForKeys, h, svg } from '../core/dom';
import { wait, type Game, type Outcome, type Round, type RoundCtx } from '../core/game';
import { num, t } from '../core/i18n';
import { randAway } from '../core/rng';
import { points } from '../core/score';
import { Beat, beatDot, voicePicker } from './beat';

const BEATS = 8;
/** Average miss in milliseconds that scores 5 of 10. */
const HALF = 45;

let used: number[] = [];

interface Taps {
  /** Signed error per expected beat in ms (positive = late), null = no tap. */
  errors: (number | null)[];
  period: number;
}

/** The drift chart: one column per beat, a dot above the line for early, below for late. */
function driftChart(r: Taps): SVGSVGElement {
  const W = 320;
  const H = 120;
  const mid = H / 2;
  const scale = (H / 2 - 12) / (r.period / 4); // a quarter beat off reaches the edge (more is clamped)
  const col = (k: number) => 20 + (k * (W - 40)) / (BEATS - 1);
  const parts = [
    `<line class="drift-line" x1="0" y1="${mid}" x2="${W}" y2="${mid}"/>`,
    ...r.errors.map((e, k) => {
      const x = col(k);
      const tick = `<line class="drift-tick" x1="${x}" y1="${mid - 6}" x2="${x}" y2="${mid + 6}"/>`;
      if (e === null) return `${tick}<circle class="drift-miss" cx="${x}" cy="${mid}" r="7"/>`;
      const y = mid + Math.max(-mid + 10, Math.min(mid - 10, e * scale));
      return `${tick}<line class="drift-stem" x1="${x}" y1="${mid}" x2="${x}" y2="${y.toFixed(1)}"/><circle class="drift-dot" cx="${x}" cy="${y.toFixed(1)}" r="7"/>`;
    }),
  ];
  const el = svg(
    `<svg class="drift" viewBox="0 0 ${W} ${H}" role="img"><title></title><text class="drift-word" x="0" y="10">${t.early}</text><text class="drift-word" x="0" y="${H - 2}">${t.late}</text>${parts.join('')}</svg>`,
  );
  el.querySelector('title')!.textContent = r.errors
    .map((e, k) => `${t.beatN(k + 1)}: ${e === null ? t.missed(1) : `${Math.round(Math.abs(e))} ms ${e < 0 ? t.early : t.late}`}`)
    .join('; ');
  return el;
}

function score(r: Taps, bpm: number, i: number): Outcome {
  const hit = r.errors.map((e, k) => [k, e] as const).filter((x): x is readonly [number, number] => x[1] !== null);
  const missed = BEATS - hit.length;
  // A missed beat counts as half a beat off.
  const abs = r.errors.map((e) => (e === null ? r.period / 2 : Math.abs(e)));
  const meanAbs = abs.reduce((a, b) => a + b, 0) / BEATS;
  const mean = hit.length ? hit.reduce((a, [, e]) => a + e, 0) / hit.length : 0;
  // Drift: slope of the error over the beats (least squares), in ms per beat.
  let slope = 0;
  if (hit.length >= 3) {
    const mk = hit.reduce((a, [k]) => a + k, 0) / hit.length;
    let num_ = 0;
    let den = 0;
    for (const [k, e] of hit) {
      num_ += (k - mk) * (e - mean);
      den += (k - mk) * (k - mk);
    }
    slope = den ? num_ / den : 0;
  }
  const words = [t.avgOff(Math.round(meanAbs))];
  if (Math.abs(slope) >= 6) words.push(slope > 0 ? t.slowingDown : t.speedingUp);
  else if (Math.abs(mean) >= 20) words.push(mean > 0 ? t.late : t.early);
  if (missed) words.push(t.missed(missed));
  return {
    points: points(meanAbs, HALF),
    // Early is up, late is down.
    angle: (mean <= 0 ? 0 : Math.PI) + (i - 2) * 0.16,
    verdict: words.join(', '),
    target: `${num(bpm)} ${t.bpm}`,
    answer: `Ø ${Math.round(meanAbs)} ms`,
  };
}

function round(i: number): Round {
  const bpm = Math.round(randAway(70, 140, used, 12));
  used.push(bpm);
  const period = 60000 / bpm;
  let lastHeard = 0;
  let beat: Beat | null = null;
  let taps: Taps = { errors: Array(BEATS).fill(null), period };
  const stop = () => {
    beat?.stop();
    beat = null;
  };

  return {
    async show(ctx) {
      ctx.cue(t.steadyShow);
      const dot = beatDot();
      ctx.stage.append(h('div', { class: 'pulse-show' }, dot.el));
      ctx.signal.addEventListener('abort', stop);
      await wait(300, ctx.signal);
      beat = new Beat(
        bpm,
        (n, heardAt) => {
          dot.hit(n);
          lastHeard = heardAt;
        },
        8,
      );
      // Resolves on the last click: the taps start one beat later.
      await beat.start();
      stop();
    },

    make(ctx: RoundCtx) {
      ctx.cue(t.steadyMake);
      ctx.note(t.steadyHint);
      const expected = Array.from({ length: BEATS }, (_, k) => lastHeard + (k + 1) * period);
      const pips = Array.from({ length: BEATS }, () => h('span', { class: 'pip' }));
      const pad = h('button', { type: 'button', class: 'tap-pad' }, h('span', {}, t.tap));
      ctx.stage.append(pad, h('div', { class: 'pips', 'aria-hidden': 'true' }, ...pips));
      focusForKeys(pad);
      let count = 0;
      const errors: (number | null)[] = Array(BEATS).fill(null);

      return new Promise<Outcome>((resolve, reject) => {
        let flash = 0;
        const tap = (time: number) => {
          // Each tap belongs to the nearest beat it can still claim.
          const k = Math.round((time - expected[0]) / period);
          if (k < 0 || k >= BEATS || errors[k] !== null) return;
          errors[k] = time - expected[k];
          pips[count]?.classList.add('is-on');
          count++;
          pad.classList.add('is-on');
          clearTimeout(flash);
          flash = window.setTimeout(() => pad.classList.remove('is-on'), 90);
          if (count >= BEATS) finish();
        };
        const onPointer = (e: PointerEvent) => {
          e.preventDefault();
          tap(e.timeStamp);
        };
        const onKey = (e: KeyboardEvent) => {
          if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
          e.preventDefault();
          tap(e.timeStamp);
        };
        pad.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        // Ends on its own one beat after the last expected beat.
        const timer = window.setInterval(() => {
          if (performance.now() > expected[BEATS - 1] + period) finish();
        }, 50);
        const cleanup = () => {
          window.clearInterval(timer);
          pad.removeEventListener('pointerdown', onPointer);
          document.removeEventListener('keydown', onKey);
        };
        let done = false;
        function finish() {
          if (done) return;
          done = true;
          cleanup();
          taps = { errors, period };
          resolve(score(taps, bpm, i));
        }
        ctx.signal.addEventListener('abort', () => (cleanup(), reject(ctx.signal.reason)), { once: true });
      });
    },

    compare(ctx, el) {
      const replay = h(
        'button',
        {
          type: 'button',
          class: 'replay',
          'aria-label': `${t.playTarget}: ${num(bpm)} ${t.bpm}`,
          onclick: () => {
            stop();
            beat = new Beat(bpm, (n) => dot.hit(n), 8);
            void beat.start();
          },
        },
        h('span', { class: 'replay-t' }, t.target),
        h('span', { class: 'replay-v' }, `${num(bpm)} ${t.bpm}`),
      );
      const dot = beatDot();
      replay.append(dot.el);
      ctx.signal.addEventListener('abort', stop);
      el.append(h('div', { class: 'drift-box' }, driftChart(taps)), replay);
    },
  };
}

export const steady: Game = {
  id: 'steady',
  name: 'Steady',
  kind: () => t.steadyKind,
  rule: () => t.steadyRule,
  needs: 'sound',
  ink: 'red',
  axis: () => ({ up: t.early, down: t.late }),
  options: voicePicker,
  figure: () =>
    svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMaxYMin slice">
      <line x1="0" y1="40" x2="200" y2="40" stroke="var(--paper)" stroke-width="3"/>
      <circle cx="34" cy="40" r="9" fill="var(--paper)"/>
      <circle cx="64" cy="40" r="9" fill="var(--paper)"/>
      <circle cx="94" cy="40" r="9" fill="var(--paper)"/>
      <circle cx="124" cy="40" r="9" fill="var(--paper)"/>
      <circle cx="152" cy="47" r="9" fill="var(--yellow)"/>
      <circle cx="179" cy="58" r="9" fill="var(--yellow)"/>
      <circle cx="205" cy="73" r="9" fill="var(--yellow)"/>
    </svg>`),
  newRound(i) {
    if (i === 0) used = [];
    return round(i);
  },
};
