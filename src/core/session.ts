// The game screen: one poster that runs a game through its intro, five rounds
// (show, recreate, reveal) and the summary. Phases change as hard cuts: the
// stage is replaced, never faded or slid.
import { focusForKeys, h } from './dom';
import type { Button, Game, Outcome, Round, RoundCtx } from './game';
import { num, onLang, t } from './i18n';
import { round1, ROUNDS } from './score';
import { best, record } from './store';
import { arrowLeft, arrowRight } from '../ui/icons';
import { resultRings } from '../ui/rings';
import { unlock } from '../audio/synth';

export interface Screen {
  el: HTMLElement;
  close(): void;
}

const pts = (v: number) => num(round1(v), 1);

export function playScreen(game: Game): Screen {
  const abort = new AbortController();
  const signal = abort.signal;

  const home = h('a', { class: 'home', href: '#' }, arrowLeft(), h('span', { translate: 'no' }, 'Nearly'));
  const title = h('p', { class: 'bar-title' }, h('b', { translate: 'no' }, game.name), h('span', {}));
  const roundItems = Array.from({ length: ROUNDS }, (_, i) =>
    h('li', { class: 'round' }, h('span', { class: 'round-n' }, String(i + 1)), h('span', { class: 'round-p' })),
  );
  const rounds = h('ol', { class: 'rounds' }, ...roundItems);
  const cue = h('h1', { class: 'cue', tabindex: -1 });
  const note = h('p', { class: 'note', 'aria-live': 'polite' });
  const fig = h('div', { class: 'fig' });
  const stage = h('section', { class: 'stage' }, h('div', { class: 'words' }, cue, note), fig);
  const foot = h('footer', { class: 'foot' });
  const el = h(
    'main',
    { class: `screen play play--${game.id}`, 'data-ink': game.ink, 'data-phase': 'intro' },
    h('header', { class: 'bar' }, home, title),
    rounds,
    stage,
    foot,
  );

  const relabel = () => {
    title.lastElementChild!.textContent = game.kind();
    rounds.setAttribute('aria-label', t.roundsLabel);
    home.setAttribute('aria-label', t.allGames);
  };
  const offLang = onLang(relabel);
  relabel();

  // ── Buttons ────────────────────────────────────────────────────────────────
  let primary: Button | null = null;
  function button(cls: string, text: string, enabled: boolean, icon: boolean): Button {
    const label = h('span', {}, text);
    const b = h('button', { type: 'button', class: cls }, label, icon ? arrowRight() : null);
    b.disabled = !enabled;
    let resolve!: () => void;
    const pressed = new Promise<void>((r) => (resolve = r));
    b.addEventListener('click', () => {
      void unlock();
      resolve();
    });
    return {
      el: b,
      pressed,
      enable(on) {
        b.disabled = !on;
      },
      label(text) {
        label.textContent = text;
      },
    };
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.repeat) return;
    const target = e.target as Element | null;
    if (target?.closest('button, a, input')) return;
    if (primary && !primary.el.disabled) {
      e.preventDefault();
      primary.el.click();
    }
  };
  document.addEventListener('keydown', onKey);

  // ── Round context ──────────────────────────────────────────────────────────
  function phase(name: string) {
    el.dataset.phase = name;
    fig.replaceChildren();
    foot.replaceChildren();
    cue.textContent = '';
    note.textContent = '';
    primary = null;
  }

  function ground(css: string | null, ink: 'dark' | 'light' = 'dark') {
    if (css) {
      el.style.setProperty('--ground', css);
      el.dataset.on = ink;
      el.dataset.ground = 'custom';
    } else {
      el.style.removeProperty('--ground');
      delete el.dataset.on;
      delete el.dataset.ground;
    }
  }

  const ctx: RoundCtx = {
    stage: fig,
    cue: (text) => (cue.textContent = text),
    note: (text) => (note.textContent = text),
    action(label, enabled = true) {
      primary = button('go', label, enabled, true);
      foot.querySelector('.go')?.remove();
      foot.append(primary.el);
      return primary;
    },
    secondary(label) {
      const b = button('alt', label, true, false);
      foot.prepend(b.el);
      return b;
    },
    ground,
    signal,
  };

  function markRound(i: number, state: 'now' | 'done' | 'todo', points?: number) {
    const li = roundItems[i];
    li.dataset.state = state;
    if (state === 'now') li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
    li.lastElementChild!.textContent = points === undefined ? '' : pts(points);
    li.setAttribute('aria-label', points === undefined ? t.roundN(i + 1) : `${t.roundN(i + 1)}: ${pts(points)} ${t.points}`);
  }

  // ── Flow ───────────────────────────────────────────────────────────────────
  async function intro() {
    phase('intro');
    ground(null);
    roundItems.forEach((_, i) => markRound(i, 'todo'));
    cue.textContent = game.name;
    cue.setAttribute('translate', 'no');
    note.textContent = game.rule();
    const b = best(game.id);
    fig.append(
      h('div', { class: 'intro-figure', 'aria-hidden': 'true' }, game.figure()),
      h(
        'p',
        { class: 'intro-meta' },
        h('span', {}, game.needs === 'sight' ? t.needsSight : game.needs === 'mic' ? t.needsMic : t.needsSound),
        b !== null ? h('span', {}, `${t.best} ${num(b, 1)}`) : null,
      ),
      ...(game.options ? [game.options()] : []),
    );
    const start = ctx.action(t.start);
    focusForKeys(start.el);
    await start.pressed;
    cue.removeAttribute('translate');
  }

  async function play() {
    await intro();
    const outcomes: Outcome[] = [];
    const ringsView = resultRings(t.rings, game.axis?.());
    for (let i = 0; i < ROUNDS; i++) {
      if (signal.aborted) return;
      markRound(i, 'now');
      const round: Round = game.newRound(i);
      phase('show');
      ground(null);
      await round.show(ctx);
      phase('make');
      const o = await round.make(ctx);
      outcomes.push(o);
      markRound(i, 'done', o.points);

      phase('reveal');
      ground(null);
      cue.textContent = pts(o.points);
      cue.classList.add('cue--score');
      note.textContent = o.verdict;
      const cmp = h('div', { class: 'compare' });
      round.compare(ctx, cmp);
      fig.append(cmp, h('div', { class: 'rings-box' }, ringsView.el));
      ringsView.add(o, i + 1, true);
      const last = i === ROUNDS - 1;
      const next = ctx.action(last ? t.results : t.next);
      focusForKeys(next.el);
      await next.pressed;
      cue.classList.remove('cue--score');
    }
    summary(outcomes);
  }

  function summary(outcomes: Outcome[]) {
    phase('summary');
    ground(null);
    const total = outcomes.reduce((s, o) => s + round1(o.points), 0);
    const prev = record(game.id, total);
    cue.textContent = num(total, 1);
    cue.classList.add('cue--score');
    const isBest = prev === null || total > prev;
    note.textContent = `${t.outOf} · ${isBest ? t.newBest : t.bestWas(num(prev!, 1))}`;
    const view = resultRings(t.rings, game.axis?.());
    outcomes.forEach((o, i) => view.add(o, i + 1));
    const table = h(
      'ol',
      { class: 'tally' },
      ...outcomes.map((o, i) =>
        h(
          'li',
          { 'aria-label': t.ringAnswer(i + 1, pts(o.points), o.verdict) },
          h('span', { class: 'tally-n' }, String(i + 1)),
          h(
            'span',
            { class: 'tally-pair' },
            o.swatch ? h('i', { class: 'chip', style: { background: o.swatch[0] } }) : null,
            h('span', {}, o.target),
            h('span', { class: 'tally-vs' }, arrowRight()),
            o.swatch ? h('i', { class: 'chip', style: { background: o.swatch[1] } }) : null,
            h('span', {}, o.answer),
          ),
          h('span', { class: 'tally-p' }, pts(o.points)),
        ),
      ),
    );
    fig.append(h('div', { class: 'compare' }, table), h('div', { class: 'rings-box' }, view.el));
    const again = ctx.action(t.again);
    const back = ctx.secondary(t.allGames);
    focusForKeys(again.el);
    void again.pressed.then(() => {
      cue.classList.remove('cue--score');
      run();
    });
    void back.pressed.then(() => (location.hash = ''));
  }

  function run() {
    play().catch((err) => {
      if (!signal.aborted) console.error(err);
    });
  }
  run();

  return {
    el,
    close() {
      abort.abort(new DOMException('closed', 'AbortError'));
      document.removeEventListener('keydown', onKey);
      offLang();
      game.close?.();
    },
  };
}

