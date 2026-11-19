// The games' sounds. Tones and clicks are synthesised; the piano is recorded
// (Salamander Grand Piano by Alexander Holm, CC-BY 3.0), bundled and cached
// for offline play like everything else.
import { audio } from './engine';
import pianoC3 from './piano/C3.mp3?url';
import pianoDs3 from './piano/Ds3.mp3?url';
import pianoFs3 from './piano/Fs3.mp3?url';
import pianoA3 from './piano/A3.mp3?url';
import pianoC4 from './piano/C4.mp3?url';
import pianoDs4 from './piano/Ds4.mp3?url';
import pianoFs4 from './piano/Fs4.mp3?url';
import pianoA4 from './piano/A4.mp3?url';
import pianoC5 from './piano/C5.mp3?url';
import pianoDs5 from './piano/Ds5.mp3?url';
import pianoFs5 from './piano/Fs5.mp3?url';
import pianoA5 from './piano/A5.mp3?url';

let master: GainNode | null = null;

async function out(): Promise<{ ctx: AudioContext; dest: AudioNode }> {
  const ctx = await audio();
  if (!master || master.context !== ctx) {
    // A gentle limiter so stacked piano notes never clip on phone speakers.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
  }
  return { ctx, dest: master };
}

/** Wakes the audio context inside a user gesture (iOS needs this). */
export async function unlock() {
  await out();
}

// A soft organ stop: clear pitch, audible on small speakers, not harsh.
const ORGAN = [0, 1, 0.5, 0.28, 0.16, 0.09, 0.05];
let organWave: PeriodicWave | null = null;
function organ(ctx: AudioContext): PeriodicWave {
  if (!organWave) organWave = ctx.createPeriodicWave(new Float32Array(ORGAN.length), Float32Array.from(ORGAN));
  return organWave;
}

export interface Voice {
  setFreq(f: number): void;
  /** Fades out over `release` seconds and frees the voice. */
  stop(release?: number): void;
}

/** A held tone whose pitch can glide; for the pitch dial. */
export async function sustain(freq: number, level = 0.22): Promise<Voice> {
  const { ctx, dest } = await out();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.setPeriodicWave(organ(ctx));
  osc.frequency.value = freq;
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.03);
  osc.connect(g).connect(dest);
  osc.start();
  let stopped = false;
  return {
    setFreq(f) {
      if (!stopped) osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.012);
    },
    stop(release = 0.08) {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + release);
      osc.stop(now + release + 0.02);
    },
  };
}

/** One tone of `dur` seconds starting at AudioContext time `at` (default: now). */
export async function tone(freq: number, dur: number, at?: number, level = 0.22) {
  const { ctx, dest } = await out();
  const t = Math.max(at ?? 0, ctx.currentTime);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.setPeriodicWave(organ(ctx));
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.03);
  g.gain.setValueAtTime(level, t + dur - 0.08);
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ── Piano: one recording every three semitones ───────────────────────────────
// The notes between are the nearest recording played slightly faster or slower.
// Until the recordings have loaded (or if they cannot be decoded) a synthesised
// piano stands in.
const PIANO: [number, string][] = [
  [48, pianoC3],
  [51, pianoDs3],
  [54, pianoFs3],
  [57, pianoA3],
  [60, pianoC4],
  [63, pianoDs4],
  [66, pianoFs4],
  [69, pianoA4],
  [72, pianoC5],
  [75, pianoDs5],
  [78, pianoFs5],
  [81, pianoA5],
];
let bank: Promise<Map<number, AudioBuffer>> | null = null;

/** Loads and decodes the piano recordings once. */
export function loadPiano(): Promise<Map<number, AudioBuffer>> {
  bank ??= audio()
    .then((ctx) =>
      Promise.all(
        PIANO.map(async ([m, url]) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(String(r.status));
          return [m, await ctx.decodeAudioData(await r.arrayBuffer())] as const;
        }),
      ),
    )
    .then((list) => new Map(list))
    .catch(() => {
      bank = null; // try again next time
      return new Map<number, AudioBuffer>();
    });
  return bank;
}

const midiFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Plays a piano note (MIDI number) at AudioContext time `at` (default: now). */
export async function pianoNote(midi: number, at?: number, level = 0.9) {
  const [{ ctx, dest }, samples] = await Promise.all([out(), loadPiano()]);
  let base = PIANO[0][0];
  for (const [m] of PIANO) if (Math.abs(m - midi) < Math.abs(base - midi)) base = m;
  const buf = samples.get(base);
  if (!buf) return pianoSynth(midiFreq(midi), at);
  const t = Math.max(at ?? 0, ctx.currentTime);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = Math.pow(2, (midi - base) / 12);
  const g = ctx.createGain();
  // Ring like a held key for a while, then damp as the key comes up.
  const hold = 2.4;
  g.gain.setValueAtTime(level, t);
  g.gain.setValueAtTime(level, t + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + hold + 0.5);
  src.connect(g).connect(dest);
  src.start(t);
  src.stop(t + hold + 0.55);
}

/** The stand-in: slightly stretched partials, each decaying at its own rate. */
async function pianoSynth(freq: number, at?: number, level = 0.3) {
  const { ctx, dest } = await out();
  const t = Math.max(at ?? 0, ctx.currentTime);
  const bus = ctx.createGain();
  bus.gain.value = level;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(9000, freq * 10);
  bus.connect(lp).connect(dest);
  const partials = [1, 0.55, 0.32, 0.2, 0.12, 0.08];
  const length = 2.6 * Math.pow(261.6 / freq, 0.35);
  partials.forEach((amp, i) => {
    const n = i + 1;
    const osc = ctx.createOscillator();
    osc.frequency.value = freq * n * Math.sqrt(1 + 0.0004 * n * n);
    const g = ctx.createGain();
    const decay = length / (1 + i * 0.9);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.004);
    g.gain.exponentialRampToValueAtTime(amp * 0.25, t + decay * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  });
}

// ── Metronome voices, as in Tactus: click, wood, beep, claves ────────────────
export const VOICE_COUNT = 4;
let voiceBufs: { rate: number; bufs: AudioBuffer[][] } | null = null;

/** Synthesises the click buffers once per sample rate: [voice][accent, beat]. */
function voices(ctx: AudioContext): AudioBuffer[][] {
  if (voiceBufs && voiceBufs.rate === ctx.sampleRate) return voiceBufs.bufs;
  const sr = ctx.sampleRate;
  const tau = Math.PI * 2;
  let seed = 12345;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x3fffffff - 1;
  };
  const fadeEnd = (b: Float32Array) => {
    const fade = Math.round(0.004 * sr);
    for (let i = 0; i < fade; i++) b[b.length - 1 - i] *= i / fade;
    return b;
  };
  const make = (fn: (t: number) => number, length = 0.09) => {
    const b = new Float32Array(Math.round(length * sr));
    for (let i = 0; i < b.length; i++) b[i] = fn(i / sr);
    return fadeEnd(b);
  };
  // Brings a buffer to a common loudness without clipping.
  const level = (b: Float32Array, target: number) => {
    const m = Math.min(b.length, Math.round(0.04 * sr));
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < m; i++) sum += b[i] * b[i];
    for (let i = 0; i < b.length; i++) peak = Math.max(peak, Math.abs(b[i]));
    const g = Math.min(target / Math.sqrt(sum / m), 0.95 / peak);
    for (let i = 0; i < b.length; i++) b[i] *= g;
    return fadeEnd(b);
  };
  // Click: a bright sine ping with a 1 ms noise transient.
  const clk = (f: number) =>
    make((t) => Math.sin(tau * f * t) * Math.exp(-t / 0.012) * 0.8 + (t < 0.001 ? noise() * 0.5 * (1 - t / 0.001) : 0));
  // Wood: two inharmonic damped partials, like a wood block.
  const wood = (f: number) =>
    make(
      (t) =>
        (Math.sin(tau * f * t) * Math.exp(-t / 0.025) * 0.75 +
          Math.sin(tau * f * 2.76 * t) * Math.exp(-t / 0.009) * 0.35 +
          (t < 0.0007 ? noise() * 0.4 : 0)) *
        0.9,
    );
  // Beep: a steady sine with soft edges, the classic digital metronome.
  const beep = (f: number) =>
    make((t) => {
      const env = t < 0.002 ? t / 0.002 : t < 0.05 ? 1 : Math.max(0, 1 - (t - 0.05) / 0.012);
      return Math.sin(tau * f * t) * env * 0.55;
    });
  // Claves: a struck hardwood rod; one clear, ringing pitch.
  const claves = () => {
    const f = 2350;
    return level(
      make(
        (t) =>
          (t < 0.00025 ? t / 0.00025 : 1) *
          (Math.sin(tau * f * t) * Math.exp(-t / 0.055) +
            Math.sin(tau * f * 2.756 * t) * Math.exp(-t / 0.012) * 0.2 +
            Math.sin(tau * f * 5.404 * t) * Math.exp(-t / 0.004) * 0.05),
        0.22,
      ),
      0.26,
    );
  };
  const raw = [
    [clk(2093), clk(1568)],
    [wood(1250), wood(940)],
    [beep(1760), beep(880)],
    [claves(), claves()],
  ];
  const bufs = raw.map((pair) =>
    pair.map((data) => {
      const b = ctx.createBuffer(1, data.length, sr);
      b.getChannelData(0).set(data);
      return b;
    }),
  );
  voiceBufs = { rate: sr, bufs };
  return bufs;
}

/** One metronome click at AudioContext time `at` in `voice` (0–3); `accent` for the downbeat. */
export async function click(at: number, accent = false, voice = 1) {
  const { ctx, dest } = await out();
  const t = Math.max(at, ctx.currentTime);
  const src = ctx.createBufferSource();
  src.buffer = voices(ctx)[Math.min(VOICE_COUNT - 1, Math.max(0, voice))][accent ? 0 : 1];
  const g = ctx.createGain();
  g.gain.value = accent ? 1 : 0.72;
  src.connect(g).connect(dest);
  src.start(t);
}
