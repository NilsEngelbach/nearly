// Pieces the sound games share: the sounding figure, the replay pair for the
// reveal, and the pitch verdict.
import { h } from '../core/dom';
import { wait, type Outcome } from '../core/game';
import { t } from '../core/i18n';
import { points } from '../core/score';
import { play } from '../ui/icons';

/** A disc that is solid while a sound plays and an outline while silent: hard on, hard off. */
export function soundingFigure() {
  const el = h('div', { class: 'sounding', 'aria-hidden': 'true' }, h('span', {}), h('span', {}), h('span', {}));
  return {
    el,
    set(on: boolean) {
      el.classList.toggle('is-on', on);
    },
  };
}

/** Plays `fn` twice with the figure lit while each one sounds. */
export async function playTwice(
  fig: { set(on: boolean): void },
  once: () => Promise<number> | number,
  signal: AbortSignal,
  gapMs = 550,
) {
  await wait(350, signal);
  for (let k = 0; k < 2; k++) {
    fig.set(true);
    const ms = await once();
    await wait(ms, signal);
    fig.set(false);
    await wait(gapMs, signal);
  }
}

/** The reveal's two replay buttons, target first. */
export function replayPair(el: HTMLElement, target: { label: string; play(): void }, yours: { label: string; play(): void }) {
  // Visible: just "Target" / "Yours" (the play icon says the rest); read out: "Play target".
  const b = (title: string, spoken: string, value: string, fn: () => void) =>
    h(
      'button',
      { type: 'button', class: 'replay', onclick: fn, 'aria-label': `${spoken}: ${value}` },
      play(),
      h('span', { class: 'replay-t' }, title),
      h('span', { class: 'replay-v' }, value),
    );
  el.append(h('div', { class: 'replays' }, b(t.target, t.playTarget, target.label, target.play), b(t.yours, t.playYours, yours.label, yours.play)));
}

/** Small spread so five answers on the same side do not sit on one line. */
export const spread = (i: number) => (i - 2) * 0.16;

/** Outcome for a pitch error in cents (positive = sharp). */
export function pitchOutcome(cents: number, half: number, i: number, target: string, answer: string): Outcome {
  const c = Math.round(cents);
  const verdict = Math.abs(c) < 3 ? t.exact : `${t.cents(Math.abs(c))} ${c > 0 ? t.sharp : t.flat}`;
  return {
    points: points(cents, half),
    angle: (c >= 0 ? 0 : Math.PI) + spread(i),
    verdict,
    target,
    answer,
  };
}
