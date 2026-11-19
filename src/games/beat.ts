// Shared by the beat games (Pulse, Steady): a metronome on the audio clock and
// the sound picker shown on their intro.
import { h } from '../core/dom';
import { t } from '../core/i18n';
import { savedVoice, saveVoice } from '../core/store';
import { audibleTime, audio } from '../audio/engine';
import { click, VOICE_COUNT } from '../audio/synth';

/**
 * Clicks on the audio clock, scheduled a little ahead so timers can be late
 * without the beat stumbling. `onBeat(n, heardAt)` fires when click n is heard;
 * `heardAt` is that moment on the performance.now() clock, the same clock as
 * pointer and key event timestamps.
 */
export class Beat {
  private timer = 0;
  private next = 0;
  private n = 0;
  private visuals: number[] = [];
  bpm: number;

  constructor(
    bpm: number,
    private onBeat: (n: number, heardAt: number) => void,
    private limit = Infinity,
  ) {
    this.bpm = bpm;
  }

  /** Resolves when click `limit` has been heard (never, without a limit). */
  async start(): Promise<void> {
    const ctx = await audio();
    const voice = savedVoice();
    this.next = ctx.currentTime + 0.15;
    this.n = 0;
    return new Promise((done) => {
      const tick = () => {
        while (this.next < ctx.currentTime + 0.15 && this.n < this.limit) {
          const at = this.next;
          const n = this.n;
          void click(at, n % 4 === 0, voice);
          // When this click reaches the speaker, on the performance clock.
          const heardAt = performance.now() + (at - audibleTime(ctx)) * 1000;
          const last = n === this.limit - 1;
          this.visuals.push(
            window.setTimeout(() => {
              this.onBeat(n, heardAt);
              if (last) done();
            }, Math.max(0, heardAt - performance.now())),
          );
          this.n++;
          this.next += 60 / this.bpm;
        }
        if (this.n < this.limit) this.timer = window.setTimeout(tick, 25);
      };
      tick();
    });
  }

  stop() {
    clearTimeout(this.timer);
    this.visuals.forEach(clearTimeout);
    this.visuals = [];
  }
}

/** A dot that lights on each beat (in the accent ink on the downbeat), hard on, hard off. */
export function beatDot() {
  const el = h('span', { class: 'beat-dot', 'aria-hidden': 'true' });
  let off = 0;
  return {
    el,
    hit(n: number) {
      el.classList.add('is-on');
      el.classList.toggle('is-down', n % 4 === 0);
      clearTimeout(off);
      off = window.setTimeout(() => el.classList.remove('is-on'), 110);
    },
  };
}

/** The intro's sound picker: four voices from the Tactus metronome; tapping one plays it. */
export function voicePicker(): HTMLElement {
  const buttons = Array.from({ length: VOICE_COUNT }, (_, v) =>
    h(
      'button',
      {
        type: 'button',
        class: 'voice',
        'aria-pressed': String(v === savedVoice()),
        onclick: async () => {
          saveVoice(v);
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === v)));
          const ctx = await audio();
          void click(ctx.currentTime + 0.02, true, v);
          void click(ctx.currentTime + 0.32, false, v);
        },
      },
      t.voices[v],
    ),
  );
  return h('div', { class: 'voices', role: 'group', 'aria-label': t.sound }, h('span', { class: 'voices-label' }, t.sound), ...buttons);
}
