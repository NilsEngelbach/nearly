// Microphone pitch for the singing game. The detector (AudioWorklet + Rust/WASM
// MPM, with a TypeScript fallback) and the band choice are the Tactus tuner's;
// this keeps only what a game needs: a stream of pitches, or null for silence.
import { choosePitch, type BandReading } from './band';
import { audio, holdScreen, loadWorklet, setAudioSession } from './engine';
import { freqToMidi } from './notes';
import workletUrl from './pitch.worklet.ts?worker&url';
import wasmUrl from './pitch.wasm?url';

export type MicError = 'denied' | 'no-mic' | 'insecure' | 'unsupported' | 'failed';

type PitchFrame = { t: 'pitch'; full: BandReading; high: BandReading; time: number } | { t: 'engine'; engine: 'wasm' | 'js' };

let wasmModule: Promise<WebAssembly.Module | null> | null = null;
function loadWasm(): Promise<WebAssembly.Module | null> {
  wasmModule ??= fetch(wasmUrl)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((b) => WebAssembly.compile(b))
    .catch(() => null);
  return wasmModule;
}

export class Listener {
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private history: number[] = [];
  /** Called about 90 times a second: MIDI pitch (fractional, A4 = 69) or null. */
  onPitch: (midi: number | null) => void = () => {};

  get running() {
    return this.node !== null;
  }

  /** Starts the microphone; resolves with null on success or the reason it failed. */
  async start(): Promise<MicError | null> {
    if (this.node) return null;
    if (!window.isSecureContext) return 'insecure';
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') return 'unsupported';
    setAudioSession('play-and-record');
    try {
      const [ctx, module] = await Promise.all([audio(), loadWasm()]);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      await loadWorklet(ctx, workletUrl);
      const node = new AudioWorkletNode(ctx, 'nearly-pitch', { numberOfInputs: 1, numberOfOutputs: 1 });
      node.port.onmessage = (e: MessageEvent<PitchFrame>) => {
        if (e.data.t === 'pitch') this.frame(e.data.full, e.data.high);
      };
      if (module) node.port.postMessage({ t: 'wasm', module });
      const source = ctx.createMediaStreamSource(stream);
      source.connect(node);
      // The worklet writes silence; the connection keeps it pulled by the graph.
      node.connect(ctx.destination);
      this.stream = stream;
      this.source = source;
      this.node = node;
      holdScreen('listen', true);
      return null;
    } catch (err) {
      this.stop();
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
      if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no-mic';
      return 'failed';
    }
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source?.disconnect();
    this.node?.disconnect();
    if (this.node) this.node.port.onmessage = null;
    this.stream = this.source = this.node = null;
    this.history = [];
    holdScreen('listen', false);
    setAudioSession('playback');
  }

  private frame(full: BandReading, high: BandReading) {
    const pick = choosePitch(full, high);
    if (!pick) {
      this.history = [];
      this.onPitch(null);
      return;
    }
    // A short median steadies single-frame octave slips.
    this.history.push(freqToMidi(pick.freq, 440));
    if (this.history.length > 5) this.history.shift();
    const sorted = [...this.history].sort((a, b) => a - b);
    this.onPitch(sorted[sorted.length >> 1]);
  }
}
