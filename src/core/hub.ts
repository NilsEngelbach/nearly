// The hub: the masthead and a wall of posters, one per game.
import { h } from './dom';
import type { Game } from './game';
import { lang, num, onLang, setLang, t } from './i18n';
import { best, saveLang } from './store';
import type { Screen } from './session';

export interface HubChrome {
  /** Install and update plates live in the hub's top line. */
  tools: HTMLElement;
}

export function hubScreen(games: Game[], chrome: HubChrome): Screen {
  const tagline = h('span', { class: 'bar-tag' });
  const langBtn = h(
    'button',
    {
      type: 'button',
      class: 'lang',
      onclick: () => {
        const next = lang === 'en' ? 'de' : 'en';
        saveLang(next);
        setLang(next);
      },
    },
    h('span', { 'data-l': 'en' }, 'EN'),
    h('span', { class: 'lang-sep', 'aria-hidden': 'true' }, '/'),
    h('span', { 'data-l': 'de' }, 'DE'),
  );
  const lede = h('p', { class: 'lede' });
  const foot = h('p', { class: 'hub-foot' });
  const credits = h('p', { class: 'hub-credits' });

  const posters = games.map((g) => {
    const meta = h('span', { class: 'p-meta' });
    const a = h(
      'a',
      { class: 'poster', href: `#${g.id}`, 'data-ink': g.ink, 'data-game': g.id },
      h('span', { class: 'p-figure', 'aria-hidden': 'true' }, g.figure()),
      meta,
      h('span', { class: 'p-name', translate: 'no' }, g.name),
    );
    return { g, a, meta };
  });

  const el = h(
    'main',
    { class: 'screen hub' },
    h('header', { class: 'bar' }, tagline, h('div', { class: 'bar-tools' }, chrome.tools, langBtn)),
    h(
      'div',
      { class: 'hub-head' },
      h('h1', { class: 'mast', translate: 'no' }, h('span', {}, 'Near'), h('span', {}, 'ly')),
      lede,
    ),
    h('nav', { class: 'wall' }, ...posters.map((p) => p.a)),
    h('footer', { class: 'hub-end' }, foot, credits),
  );

  const relabel = () => {
    tagline.textContent = t.tagline;
    lede.textContent = t.intro;
    foot.textContent = t.footer;
    credits.textContent = t.credits;
    langBtn.dataset.lang = lang;
    langBtn.setAttribute('aria-label', `${t.language}: ${lang === 'de' ? 'Deutsch' : 'English'}`);
    el.querySelector('.wall')!.setAttribute('aria-label', t.allGames);
    for (const p of posters) {
      const b = best(p.g.id);
      p.meta.textContent = b === null ? p.g.kind() : `${p.g.kind()} · ${t.best} ${num(b, 1)}`;
      p.a.setAttribute('aria-label', `${p.g.name}, ${p.g.kind()}${b === null ? '' : `, ${t.best} ${num(b, 1)}`}`);
    }
  };
  const off = onLang(relabel);
  relabel();

  return {
    el,
    close() {
      off();
    },
  };
}
