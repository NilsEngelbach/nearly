// Hum: a tone plays twice; hum or sing it back. Any octave counts. The pitch
// is read with the Tactus tuner's detector (AudioWorklet + Rust/WASM).
import { h, svg } from '../core/dom';
import { wait, type Game, type Outcome, type Round, type RoundCtx } from '../core/game';
import { lang, t } from '../core/i18n';
import { randAway } from '../core/rng';
import { Listener, type MicError } from '../audio/listen';
import { midiToFreq, noteName, noteText } from '../audio/notes';
import { tone } from '../audio/synth';
import { pitchOutcome, playTwice, replayPair, soundingFigure } from './common';

/** Cents that score 5 of 10. */
const HALF = 75;
const LOW = 48; // C3
const HIGH = 67; // G4
const TONE_S = 1.4;
/** How long a note must be held steady, and how steady. */
const HOLD_MS = 900;
const STEADY_CENTS = 40;

const listener = new Listener();
let used: number[] = [];

const name = (m: number) => {
  const r = Math.round(m);
  const n = noteName(r, lang);
  return `${noteText(n)}${n.octave}`;
};

/** Folds an error onto the nearest octave: -600 to +600 cents. */
const fold = (c: number) => ((((c + 600) % 1200) + 1200) % 1200) - 600;

const micText = (e: MicError) =>
  e === 'denied' ? t.micDenied : e === 'no-mic' ? t.micMissing : e === 'insecure' ? t.micInsecure : t.micFailed;

/** The live pitch ring: a dot that circles with your pitch class, and an arc that fills while you hold. */
function pitchRing() {
  const C = 2 * Math.PI * 80;
  const el = svg(`<svg class="hum-ring" viewBox="-100 -100 200 200" aria-hidden="true">
    <circle class="hum-track" r="80"/>
    <circle class="hum-hold" r="80" stroke-dasharray="0 ${C}" transform="rotate(-90)"/>
    <circle class="hum-dot" r="11" cx="0" cy="-80"/>
  </svg>`);
  const dot = el.querySelector('.hum-dot') as SVGCircleElement;
  const hold = el.querySelector('.hum-hold') as SVGCircleElement;
  return {
    el,
    pitch(m: number | null) {
      el.classList.toggle('is-live', m !== null);
      if (m === null) return;
      const a = ((m % 12) / 12) * 2 * Math.PI;
      dot.setAttribute('cx', (80 * Math.sin(a)).toFixed(2));
      dot.setAttribute('cy', (-80 * Math.cos(a)).toFixed(2));
    },
    hold(share: number) {
      hold.setAttribute('stroke-dasharray', `${(share * C).toFixed(1)} ${C}`);
    },
  };
}

function round(i: number): Round {
  const tg = Math.round(randAway(LOW, HIGH, used, 3));
  used.push(tg);
  let sung: number | null = null;

  /** Listens until a note is held steady; resolves with its median pitch. */
  function capture(ctx: RoundCtx, ring: ReturnType<typeof pitchRing>): Promise<number> {
    return new Promise((resolve, reject) => {
      let run: { t: number; m: number }[] = [];
      let lastHeard = performance.now();
      const quiet = window.setInterval(() => {
        if (performance.now() - lastHeard > 7000) ctx.note(t.humQuiet);
      }, 1000);
      const finish = () => {
        window.clearInterval(quiet);
        listener.onPitch = () => {};
      };
      ctx.signal.addEventListener('abort', () => (finish(), reject(ctx.signal.reason)), { once: true });
      listener.onPitch = (m) => {
        const now = performance.now();
        ring.pitch(m);
        if (m === null) {
          // A short dropout inside a held note is forgiven.
          if (run.length && now - run[run.length - 1].t > 140) run = [];
          ring.hold(0);
          return;
        }
        lastHeard = now;
        run.push({ t: now, m });
        const sorted = run.map((x) => x.m).sort((a, b) => a - b);
        const med = sorted[sorted.length >> 1];
        // Drop the start of the run until what is left is steady around the median.
        while (run.length && Math.abs(run[0].m - med) * 100 > STEADY_CENTS) run.shift();
        const held = run.length ? now - run[0].t : 0;
        ring.hold(Math.min(1, held / HOLD_MS));
        ctx.note(held > 150 ? t.humHold : t.humListening);
        if (held >= HOLD_MS) {
          finish();
          const ms = run.map((x) => x.m).sort((a, b) => a - b);
          resolve(ms[ms.length >> 1]);
        }
      };
    });
  }

  return {
    async show(ctx) {
      ctx.cue(t.humShow);
      const fig = soundingFigure();
      ctx.stage.append(fig.el);
      await playTwice(fig, () => (void tone(midiToFreq(tg, 440), TONE_S), TONE_S * 1000), ctx.signal);
    },

    async make(ctx) {
      ctx.cue(t.humMake);
      const ring = pitchRing();
      ctx.stage.append(h('div', { class: 'hum-live' }, ring.el));
      const skip = ctx.secondary(t.skip);
      const skipped = skip.pressed.then(() => null);

      for (;;) {
        ctx.note(t.humStarting);
        const err = await listener.start();
        if (!err) break;
        ctx.note(micText(err));
        const retry = ctx.action(t.retry);
        const again = await Promise.race([retry.pressed.then(() => true), skipped.then(() => false)]);
        retry.el.remove();
        if (!again) {
          listener.stop();
          return skippedOutcome();
        }
      }
      ctx.note(t.humListening);
      const got = await Promise.race([capture(ctx, ring), skipped]);
      listener.stop();
      if (got === null) return skippedOutcome();
      sung = got;
      ctx.note(`${t.humGotIt}: ${name(got)}`);
      ring.hold(1);
      await wait(700, ctx.signal);
      return pitchOutcome(fold((got - tg) * 100), HALF, i, name(tg), name(got));
    },

    compare(_ctx, el) {
      const s = sung;
      replayPair(
        el,
        { label: name(tg), play: () => void tone(midiToFreq(tg, 440), TONE_S) },
        { label: s === null ? '—' : name(s), play: () => s !== null && void tone(midiToFreq(s, 440), TONE_S) },
      );
    },
  };

  function skippedOutcome(): Outcome {
    return { points: 0, angle: Math.PI, verdict: t.skip, target: name(tg), answer: '—' };
  }
}

export const hum: Game = {
  id: 'hum',
  name: 'Hum',
  kind: () => t.humKind,
  rule: () => t.humRule,
  needs: 'mic',
  ink: 'yellow',
  axis: () => ({ up: t.sharp, down: t.flat }),
  figure: () =>
    svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMaxYMin meet">
      <circle cx="150" cy="56" r="34" fill="var(--black)"/>
      <circle cx="150" cy="56" r="50" fill="none" stroke="var(--black)" stroke-width="3"/>
      <circle cx="150" cy="56" r="64" fill="none" stroke="var(--black)" stroke-width="2"/>
      <circle cx="150" cy="56" r="78" fill="none" stroke="var(--black)" stroke-width="1"/>
    </svg>`),
  newRound(i) {
    if (i === 0) used = [];
    return round(i);
  },
  close() {
    listener.stop();
  },
};
