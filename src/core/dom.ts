type Child = Node | string | null | undefined | false;
type Props = Record<string, unknown> & { class?: string };

/** Small element factory: h('div', { class: 'x', 'aria-label': 'y', onclick }, child…). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'style' && typeof v === 'object') {
      for (const [p, x] of Object.entries(v as Record<string, string>)) {
        if (p.startsWith('--')) el.style.setProperty(p, x);
        else (el.style as unknown as Record<string, string>)[p] = x;
      }
    }
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

// Last input modality: focus is moved for the player only after keyboard use,
// so touch and mouse play never shows focus rings.
let keyboard = false;
addEventListener('keydown', (e) => {
  if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') keyboard = true;
}, true);
addEventListener('pointerdown', () => (keyboard = false), true);

/** Moves focus to `el` when the player is using the keyboard. */
export function focusForKeys(el: HTMLElement | null | undefined) {
  if (keyboard) el?.focus({ preventScroll: true });
}

export function append(el: Element, children: Child[]) {
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
}

/** Parses trusted, authored SVG markup (icons only, never user input). */
export function svg(markup: string): SVGSVGElement {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as SVGSVGElement;
}
