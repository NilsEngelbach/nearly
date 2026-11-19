import type { BandReading } from './band';

/** One analysis frame from the pitch worklet: the same window, full band and band-passed. */
export interface PitchFrame {
  t: 'pitch';
  full: BandReading;
  high: BandReading;
  time: number;
}
