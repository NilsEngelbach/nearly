// Note names, transposition and tempo terms.
import type { Lang } from '../core/i18n';

export type Accidental = 'sharp' | 'flat' | null;
export interface NoteName {
  base: string;
  acc: Accidental;
  octave: number;
}

// The spellings players read most: C♯, E♭, F♯, A♭, B♭.
const EN: [string, Accidental][] = [
  ['C', null], ['C', 'sharp'], ['D', null], ['E', 'flat'], ['E', null], ['F', null],
  ['F', 'sharp'], ['G', null], ['A', 'flat'], ['A', null], ['B', 'flat'], ['B', null],
];
// German names: Cis, Es, Fis, As, B (= B♭) and H.
const DE = ['C', 'Cis', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'];

export function noteName(midi: number, lang: Lang): NoteName {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  if (lang === 'de') return { base: DE[pc], acc: null, octave };
  const [base, acc] = EN[pc];
  return { base, acc, octave };
}

export function noteText(n: NoteName): string {
  return n.base + (n.acc === 'sharp' ? '♯' : n.acc === 'flat' ? '♭' : '');
}

export function midiToFreq(midi: number, a4: number): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq: number, a4: number): number {
  return 69 + 12 * Math.log2(freq / a4);
}
