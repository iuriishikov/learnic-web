'use client';

/**
 * Tiny Web Audio helpers for short notification sounds.
 *
 * No audio files — every cue is synthesized inline with `OscillatorNode`s so
 * we don't ship audio assets and don't fight licensing. `playSound` returns a
 * stop function: one-shot cues finish on their own (the stop is a no-op);
 * looping cues (e.g. `ring`) keep going until the caller invokes it.
 *
 * The classic phone-style ring tone mixes 440 + 480 Hz on a `triangle`
 * waveform — that combination is what real PSTN/landline phones use and is
 * instantly recognizable as "your phone is ringing".
 */

type SoundCue = 'ring' | 'pop' | 'chime';

let cachedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (cachedCtx && cachedCtx.state !== 'closed') return cachedCtx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  cachedCtx = new Ctor();
  return cachedCtx;
}

type ToneSpec = {
  /** Frequency in Hz. */
  freq: number;
  /** Seconds from cycle start until the tone begins. */
  start: number;
  /** Tone length in seconds. */
  duration: number;
  /** Peak gain (0..1). */
  gain?: number;
  type?: OscillatorType;
};

type SequenceConfig = {
  tones: ToneSpec[];
  /**
   * Total cycle length in seconds (audible + trailing silence). Defaults to
   * the latest tone end. When `loop`, the next cycle starts after this.
   */
  cycle?: number;
  loop?: boolean;
};

/* Phone-style ring: two 1s warbling bursts with a short gap, then silence
 * before looping. Triangle waveform + 440/480 Hz blend = classic ringer. */
const RING: SequenceConfig = {
  tones: [
    { freq: 440, start: 0.0, duration: 0.95, gain: 0.32, type: 'triangle' },
    { freq: 480, start: 0.0, duration: 0.95, gain: 0.32, type: 'triangle' },
    { freq: 440, start: 1.15, duration: 0.95, gain: 0.32, type: 'triangle' },
    { freq: 480, start: 1.15, duration: 0.95, gain: 0.32, type: 'triangle' },
  ],
  cycle: 3.1,
  loop: true,
};

const POP: SequenceConfig = {
  tones: [
    { freq: 660, start: 0, duration: 0.08, gain: 0.14 },
    { freq: 990, start: 0.05, duration: 0.12, gain: 0.16 },
  ],
};

const CHIME: SequenceConfig = {
  tones: [
    { freq: 720, start: 0, duration: 0.18, gain: 0.16 },
    { freq: 960, start: 0.12, duration: 0.22, gain: 0.18 },
    { freq: 1200, start: 0.28, duration: 0.32, gain: 0.16 },
  ],
};

const CUES: Record<SoundCue, SequenceConfig> = {
  ring: RING,
  pop: POP,
  chime: CHIME,
};

function scheduleTone(
  ctx: AudioContext,
  destination: AudioNode,
  spec: ToneSpec,
  cycleStart: number,
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(destination);

  osc.frequency.value = spec.freq;
  osc.type = spec.type ?? 'sine';

  const startAt = cycleStart + spec.start;
  const peak = spec.gain ?? 0.18;
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.025);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + spec.duration);

  osc.start(startAt);
  osc.stop(startAt + spec.duration + 0.06);
}

const noop = () => {};

/**
 * Play a notification cue. Returns a stop function; for looping cues
 * (e.g. `ring`) call it to silence playback. Safe on the server (no-op).
 */
export function playSound(cue: SoundCue): () => void {
  const ctx = getCtx();
  if (!ctx) return noop;
  // Browsers often start the context suspended until a user gesture — the
  // notification cue is triggered from a click handler, so resume() resolves.
  if (ctx.state === 'suspended') void ctx.resume();

  const config = CUES[cue];
  if (!config) return noop;

  // Master gain we can ramp to 0 instantly to silence everything we scheduled
  // (including future-scheduled oscillators that haven't started yet).
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  const cycle =
    config.cycle ??
    Math.max(...config.tones.map((s) => s.start + s.duration));

  let stopped = false;
  let timeout: number | null = null;

  const tick = () => {
    if (stopped) return;
    const cycleStart = ctx.currentTime + 0.02;
    for (const spec of config.tones) {
      scheduleTone(ctx, master, spec, cycleStart);
    }
    if (config.loop) {
      timeout = window.setTimeout(tick, cycle * 1000);
    }
  };
  tick();

  return () => {
    if (stopped) return;
    stopped = true;
    if (timeout !== null) window.clearTimeout(timeout);
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  };
}

export type { SoundCue };
