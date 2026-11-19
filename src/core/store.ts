// Everything lives on this device (localStorage). Every read tolerates missing,
// old or broken data, and private windows without storage.
import type { Lang } from './i18n';

interface Data {
  lang: Lang | null;
  /** Best total per game id, 0–50. */
  best: Record<string, number>;
  /** Games finished per game id. */
  played: Record<string, number>;
  /** Metronome sound for the beat games: 0 click, 1 wood, 2 beep, 3 claves. */
  voice: number;
}

const KEY = 'nearly:v1';

function read(): Data {
  let raw: Partial<Data> = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {};
  } catch {
    /* no storage */
  }
  const nums = (o: unknown, max: number) =>
    Object.fromEntries(
      Object.entries(typeof o === 'object' && o ? o : {}).filter(
        ([, v]) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max,
      ),
    ) as Record<string, number>;
  return {
    lang: raw.lang === 'de' || raw.lang === 'en' ? raw.lang : null,
    best: nums(raw.best, 50),
    played: nums(raw.played, 1e9),
    voice: typeof raw.voice === 'number' && [0, 1, 2, 3].includes(raw.voice) ? raw.voice : 1,
  };
}

const data = read();

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* no storage: scores last for this visit */
  }
}

export const savedLang = () => data.lang;
export function saveLang(l: Lang) {
  data.lang = l;
  write();
}

export const savedVoice = () => data.voice;
export function saveVoice(v: number) {
  data.voice = v;
  write();
}

export const best = (id: string): number | null => data.best[id] ?? null;

/** Records a finished game; returns the previous best (null when there was none). */
export function record(id: string, total: number): number | null {
  const prev = best(id);
  if (prev === null || total > prev) data.best[id] = total;
  data.played[id] = (data.played[id] ?? 0) + 1;
  write();
  return prev;
}
