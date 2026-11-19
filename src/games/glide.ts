// Glide: a tone plays twice; turn the ring until you hear it again.
// Scored in cents between the two pitches.
import { svg } from '../core/dom';
import type { Game, Round } from '../core/game';
import { num, t } from '../core/i18n';
import { clamp, pick, rand, randAway } from '../core/rng';
import { midiToFreq } from '../audio/notes';
import { sustain, tone, type Voice } from '../audio/synth';
import { dial, tickFace } from '../ui/dial';
import { speaker } from '../ui/icons';
import { pitchOutcome, playTwice, replayPair, soundingFigure } from './common';

/** Cents that score 5 of 10. */
const HALF = 75;
const LOW = 53; // F3
const HIGH = 77; // F5
const TONE_S = 1.2;

let used: number[] = [];
const hz = (m: number) => `${num(midiToFreq(m, 440))} Hz`;

function round(i: number): Round {
  const tg = randAway(LOW, HIGH, used, 3);
  used.push(tg);
  let ans = clamp(tg + pick([-1, 1]) * rand(4, 9), LOW - 6, HIGH + 6);

  return {
    async show(ctx) {
      ctx.cue(t.glideShow);
      const fig = soundingFigure();
      ctx.stage.append(fig.el);
      await playTwice(fig, () => (void tone(midiToFreq(tg, 440), TONE_S), TONE_S * 1000), ctx.signal);
    },

    async make(ctx) {
      ctx.cue(t.glideMake);
      ctx.note(t.glideHint);
      let voice: Voice | null = null;
      let pending: Promise<Voice> | null = null;
      let idle = 0;
      const sound = () => {
        clearTimeout(idle);
        if (voice) voice.setFreq(midiToFreq(ans, 440));
        else if (!pending) {
          pending = sustain(midiToFreq(ans, 440));
          void pending.then((v) => {
            voice = v;
            pending = null;
            v.setFreq(midiToFreq(ans, 440));
          });
        }
      };
      const quiet = (ms: number) => {
        clearTimeout(idle);
        idle = window.setTimeout(() => {
          voice?.stop(0.12);
          voice = null;
        }, ms);
      };
      const d = dial(
        [
          {
            label: t.pitch,
            value: ans,
            min: LOW - 6,
            max: HIGH + 6,
            perTurn: 12,
            step: 0.1,
            big: 1,
            paint: (face) => tickFace(face, 24),
          },
        ],
        {
          input(_, v) {
            ans = v;
            sound();
          },
          grab: () => sound(),
          release: () => quiet(450),
        },
      );
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dial-play';
      btn.setAttribute('aria-label', t.playYours);
      btn.append(speaker());
      btn.addEventListener('click', () => {
        sound();
        quiet(1000);
      });
      d.hub.append(btn);
      ctx.stage.append(d.el);
      d.focus();
      ctx.signal.addEventListener('abort', () => (voice as Voice | null)?.stop());
      await ctx.action(t.lockIn).pressed;
      clearTimeout(idle);
      (voice as Voice | null)?.stop();
      return pitchOutcome((ans - tg) * 100, HALF, i, hz(tg), hz(ans));
    },

    compare(_ctx, el) {
      replayPair(
        el,
        { label: hz(tg), play: () => void tone(midiToFreq(tg, 440), TONE_S) },
        { label: hz(ans), play: () => void tone(midiToFreq(ans, 440), TONE_S) },
      );
    },
  };
}

export const glide: Game = {
  id: 'glide',
  name: 'Glide',
  kind: () => t.glideKind,
  rule: () => t.glideRule,
  needs: 'sound',
  ink: 'blue',
  axis: () => ({ up: t.sharp, down: t.flat }),
  figure: () =>
    svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMaxYMid slice">
      <circle cx="252" cy="150" r="128" fill="none" stroke="var(--paper)" stroke-width="7"/>
      <circle cx="252" cy="150" r="100" fill="none" stroke="var(--yellow)" stroke-width="7"/>
      <circle cx="252" cy="150" r="72" fill="none" stroke="var(--paper)" stroke-width="7"/>
      <circle cx="122" cy="40" r="9" fill="var(--yellow)"/>
    </svg>`),
  newRound(i) {
    if (i === 0) used = [];
    return round(i);
  },
};
