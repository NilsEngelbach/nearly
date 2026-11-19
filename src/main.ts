import '@fontsource-variable/schibsted-grotesk/wght.css';
import './styles/main.css';
import { h } from './core/dom';
import { hubScreen } from './core/hub';
import { detectLang, onLang, setLang, t } from './core/i18n';
import { playScreen, type Screen } from './core/session';
import { savedLang } from './core/store';
import { gameById, games } from './games';
import { download } from './ui/icons';

setLang(savedLang() ?? detectLang());

const app = document.getElementById('app')!;

// ── Install and update plates (shown in the hub's top line) ─────────────────
const installBtn = h('button', { type: 'button', class: 'plate', hidden: true }, download(), h('span', {}));
const updateBtn = h('button', { type: 'button', class: 'plate plate--update', hidden: true }, h('span', {}));
const tools = h('div', { class: 'plates' }, updateBtn, installBtn);
onLang(() => {
  installBtn.lastElementChild!.textContent = t.install;
  updateBtn.lastElementChild!.textContent = `${t.updateReady} · ${t.reload}`;
});
installBtn.lastElementChild!.textContent = t.install;
updateBtn.lastElementChild!.textContent = `${t.updateReady} · ${t.reload}`;

// ── Router: #<game> opens a game, anything else the hub. Hard cut, no transition. ──
let current: Screen | null = null;
function route() {
  current?.close();
  const id = location.hash.replace(/^#\/?/, '');
  const game = gameById(id);
  current = game ? playScreen(game) : hubScreen(games, { tools });
  app.replaceChildren(current.el);
  document.title = game ? `${game.name} · Nearly` : `Nearly · ${t.tagline}`;
  window.scrollTo(0, 0);
  const focus = current.el.querySelector<HTMLElement>(game ? '.cue' : '.mast');
  if (focus && document.activeElement !== document.body) focus.focus({ preventScroll: true });
}
window.addEventListener('hashchange', route);
onLang(() => {
  if (!gameById(location.hash.slice(1))) document.title = `Nearly · ${t.tagline}`;
});
route();

// ── Install ──────────────────────────────────────────────────────────────────
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
}
let deferred: InstallPrompt | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as InstallPrompt;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferred) return;
  installBtn.hidden = true;
  await deferred.prompt();
  deferred = null;
});
window.addEventListener('appinstalled', () => (installBtn.hidden = true));

// ── Offline: the service worker precaches the whole build. A new version waits
// until the player taps "Update ready", so a running game is never cut off. ──
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').then((reg) => {
    const offer = () => {
      if (reg.waiting && navigator.serviceWorker.controller) updateBtn.hidden = false;
    };
    offer();
    reg.addEventListener('updatefound', () => {
      reg.installing?.addEventListener('statechange', offer);
    });
    updateBtn.addEventListener('click', () => {
      updateBtn.disabled = true;
      reg.waiting?.postMessage('skip-waiting');
    });
    // Installed apps are resumed, not reloaded: look for a new version when the
    // app comes back to the front (at most every 30 minutes).
    let last = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine || Date.now() - last < 30 * 60_000) return;
      last = Date.now();
      reg.update().catch(() => {});
    });
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!navigator.serviceWorker.controller || reloading || updateBtn.hidden) return;
    reloading = true;
    location.reload();
  });
}
