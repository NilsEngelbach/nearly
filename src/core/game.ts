// The contract between the shell and a game. Every game plays the same way:
// show the target, take it away, let the player recreate it, compare. The shell
// owns the screen, the five rounds, the scores and the results; a game owns
// only its target, its figure and its controls.

/** The flat inks of the poster world. */
export type Ink = 'red' | 'blue' | 'yellow' | 'black' | 'paper';

export interface Outcome {
  /** 0–10, unrounded. */
  points: number;
  /** Direction of the error on the result rings: radians, 0 = up, clockwise. */
  angle: number;
  /** A few words on the miss: "12 cents flat". */
  verdict: string;
  /** Short labels for the summary table. */
  target: string;
  answer: string;
  /** Colours for target and answer markers (colour games). */
  swatch?: [string, string];
}

export interface Button {
  el: HTMLButtonElement;
  /** Resolves when pressed (or Enter on the page). */
  pressed: Promise<void>;
  enable(on: boolean): void;
  label(text: string): void;
}

export interface RoundCtx {
  /** The poster field this phase draws into; emptied at every phase change. */
  stage: HTMLElement;
  /** The big phase word, flush left. */
  cue(text: string): void;
  /** One short line under the cue. */
  note(text: string): void;
  /** The primary action at the foot of the screen. */
  action(label: string, enabled?: boolean): Button;
  /** A secondary action beside it. */
  secondary(label: string): Button;
  /** Repaints the whole screen in a colour (the colour game) with dark or light ink, or back to the game's ink. */
  ground(css: string | null, ink?: 'dark' | 'light'): void;
  /** Aborted when the player leaves the game. */
  signal: AbortSignal;
}

export interface Round {
  /** Present the target. Resolves when the player should start recreating. */
  show(ctx: RoundCtx): Promise<void>;
  /** Let the player recreate it; resolves with the scored outcome. */
  make(ctx: RoundCtx): Promise<Outcome>;
  /** Draw target against answer (beside the result rings) for the reveal. */
  compare(ctx: RoundCtx, el: HTMLElement): void;
}

export interface Game {
  id: string;
  /** Brand name, never translated. */
  name: string;
  kind(): string;
  rule(): string;
  needs: 'sight' | 'sound' | 'mic';
  ink: Ink;
  /** The poster figure, drawn into a square-ish box; also the intro's figure. */
  figure(): Element;
  /** Words for the up and down ends of the result rings, when the error has a direction. */
  axis?(): { up: string; down: string } | null;
  /** Settings shown on the intro (e.g. the click sound). */
  options?(): Element;
  newRound(index: number): Round;
  /** Called when the game screen closes (stop the microphone, etc.). */
  close?(): void;
}

/** Sleeps, but wakes early (rejecting) when the round is abandoned. */
export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const id = setTimeout(() => {
      signal.removeEventListener('abort', stop);
      resolve();
    }, ms);
    const stop = () => {
      clearTimeout(id);
      reject(signal.reason);
    };
    signal.addEventListener('abort', stop, { once: true });
  });
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
