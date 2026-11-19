// Pulse: a beat plays for two bars; turn the ring until your beat matches.
// Scored by the tempo difference in percent.
import { h, svg } from '../core/dom';
import { wait, type Game, type Round } from '../core/game';
import { num, t } from '../core/i18n';
import { pick, rand, randAway } from '../core/rng';
import { points } from '../core/score';
import { dial, tickFace } from '../ui/dial';
import { Beat, beatDot, voicePicker } from './beat';
import { spread } from './common';
import { play } from '../ui/icons';

/** Percent that scores 5 of 10. */
const HALF = 6;
const MIN = 40;
const MAX = 240;

let used: number[] = [];
const bpmText = (v: number) => `${num(v)} ${t.bpm}`;

function round(i: number): Round {
  const tg = Math.round(randAway(62, 168, used, 14));
  used.push(tg);
  let ans = Math.round(Math.min(MAX, Math.max(MIN, tg * pick([rand(0.68, 0.84), rand(1.18, 1.38)]))));
  let beat: Beat | null = null;
  const stop = () => {
    beat?.stop();
    beat = null;
  };

  return {
    async show(ctx) {
      ctx.cue(t.pulseShow);
      const dot = beatDot();
      ctx.stage.append(h('div', { class: 'pulse-show' }, dot.el));
      ctx.signal.addEventListener('abort', stop);
      await wait(300, ctx.signal);
      beat = new Beat(tg, (n) => dot.hit(n), 8);
      await beat.start();
      stop();
      await wait(60000 / tg + 300, ctx.signal);
    },

    async make(ctx) {
      ctx.cue(t.pulseMake);
      ctx.note(t.pulseHint);
      const dot = beatDot();
      const d = dial(
        [
          {
            label: t.tempo,
            value: ans,
            min: MIN,
            max: MAX,
            perTurn: 60,
            step: 1,
            big: 10,
            paint: (face) => tickFace(face, 30),
          },
        ],
        {
          input(_, v) {
            ans = Math.round(v);
            if (beat) beat.bpm = ans;
          },
        },
      );
      d.hub.append(dot.el);
      ctx.stage.append(d.el);
      d.focus();
      beat = new Beat(ans, (n) => dot.hit(n));
      void beat.start();
      await ctx.action(t.lockIn).pressed;
      stop();
      const pct = 100 * Math.log(ans / tg);
      const p = Math.round(Math.abs(pct));
      return {
        points: points(pct, HALF),
        angle: (pct >= 0 ? 0 : Math.PI) + spread(i),
        verdict: p === 0 ? t.exact : `${t.percent(String(p))} ${pct > 0 ? t.faster : t.slower}`,
        target: bpmText(tg),
        answer: bpmText(ans),
      };
    },

    compare(ctx, el) {
      const mk = (title: string, spoken: string, bpm: number) => {
        const dot = beatDot();
        const b = h(
          'button',
          {
            type: 'button',
            class: 'replay',
            'aria-label': `${spoken}: ${bpmText(bpm)}`,
            onclick: () => {
              stop();
              beat = new Beat(bpm, (n) => dot.hit(n), 4);
              void beat.start();
            },
          },
          play(),
          h('span', { class: 'replay-t' }, title),
          h('span', { class: 'replay-v' }, bpmText(bpm)),
          dot.el,
        );
        return b;
      };
      ctx.signal.addEventListener('abort', stop);
      el.append(h('div', { class: 'replays' }, mk(t.target, t.playTarget, tg), mk(t.yours, t.playYours, ans)));
    },
  };
}

export const pulse: Game = {
  id: 'pulse',
  name: 'Pulse',
  kind: () => t.pulseKind,
  rule: () => t.pulseRule,
  needs: 'sound',
  ink: 'black',
  axis: () => ({ up: t.faster, down: t.slower }),
  options: voicePicker,
  figure: () =>
    svg(`<svg class="figure" viewBox="0 0 200 120" preserveAspectRatio="xMinYMin slice">
      <circle cx="40" cy="44" r="26" fill="var(--red)"/>
      <circle cx="96" cy="36" r="12" fill="var(--paper)"/>
      <circle cx="136" cy="36" r="12" fill="var(--paper)"/>
      <circle cx="176" cy="36" r="12" fill="var(--paper)"/>
    </svg>`),
  newRound(i) {
    if (i === 0) used = [];
    return round(i);
  },
};
