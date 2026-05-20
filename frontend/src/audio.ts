/**
 * Sound design for Chiribito — procedural WebAudio (no asset files needed).
 * Each effect is a tiny envelope sculpted to feel "castizo elegant" rather than
 * arcade. Volumes deliberately low — sounds layer with gameplay, not over it.
 *
 * Add new effects in two places:
 *   1. SoundEffect union in types.ts
 *   2. simpleProfiles below OR a complexEffects entry for chord/sweep
 */
import type { SoundEffect } from "./types";

type SimpleProfile = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  volume: number;
  /** Optional pitch glide target — adds expressive movement (rise = escalate, fall = release). */
  glideTo?: number;
  /** Optional lowpass cutoff override (Hz). Defaults to ~3.5× the highest pitch. */
  cutoff?: number;
  /** Add a quiet sub-oscillator an octave down for warm body. Skip for short UI ticks. */
  body?: boolean;
};

// No square / sawtooth anywhere — those raw waveforms are the "arcade barato" timbre.
// Triangle + sine through a warm lowpass, with octave-down body and pitch glides that
// mirror the emotion of each move (call settles, raise climbs, fold sighs down).
const simpleProfiles: Partial<Record<SoundEffect, SimpleProfile>> = {
  bet: { frequency: 440, durationMs: 130, type: "triangle", volume: 0.08, body: true },
  call: { frequency: 392, durationMs: 130, type: "triangle", volume: 0.08, body: true },
  raise: { frequency: 587, durationMs: 170, type: "triangle", volume: 0.1, body: true, glideTo: 622 },
  check: { frequency: 330, durationMs: 100, type: "sine", volume: 0.06, body: true },
  fold: { frequency: 247, durationMs: 200, type: "triangle", volume: 0.07, glideTo: 165 },
  allIn: { frequency: 523, durationMs: 260, type: "triangle", volume: 0.11, body: true, glideTo: 784 },
  click: { frequency: 600, durationMs: 32, type: "triangle", volume: 0.045, cutoff: 1600 },
  hover: { frequency: 1100, durationMs: 18, type: "sine", volume: 0.015 },
  tick: { frequency: 420, durationMs: 38, type: "triangle", volume: 0.05, cutoff: 1400 },
};

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let enabled = true;
let masterVolume = 1;

function ensureContext(): AudioContext | null {
  if (!enabled) return null;
  if (!audioContext) return null;
  if (audioContext.state !== "running") return null;
  return audioContext;
}

// Every voice connects here, never straight to ctx.destination — so the master
// gain (volume) and compressor (glue + clip protection) sit on the whole mix.
function busOut(ctx: AudioContext): AudioNode {
  return masterGain ?? ctx.destination;
}

// Decaying noise impulse → an intimate room tail (reservado, not a cathedral).
// Short duration + fast decay keeps it close and warm rather than washy.
function buildRoomImpulse(ctx: AudioContext, durationSec: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * durationSec));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function playSimple(profile: SimpleProfile): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const duration = profile.durationMs / 1000;
  const top = Math.max(profile.frequency, profile.glideTo ?? profile.frequency);

  // Warm lowpass strips the harsh upper harmonics that read as "cheap synth".
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = profile.cutoff ?? top * 3.5;
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  // Tiny attack + decay envelope to avoid clicks
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(profile.volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const osc = ctx.createOscillator();
  osc.type = profile.type;
  osc.frequency.setValueAtTime(profile.frequency, now);
  if (profile.glideTo) {
    osc.frequency.exponentialRampToValueAtTime(profile.glideTo, now + duration * 0.9);
  }
  osc.connect(filter);
  osc.start(now);
  osc.stop(now + duration + 0.02);

  // Octave-down sine gives warm body without muddying short UI ticks.
  if (profile.body) {
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = profile.frequency / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.45;
    sub.connect(subGain);
    subGain.connect(filter);
    sub.start(now);
    sub.stop(now + duration + 0.02);
  }

  filter.connect(gain);
  gain.connect(busOut(ctx));
}

function playChord(freqs: number[], durationMs: number, type: OscillatorType, volume: number): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const duration = durationMs / 1000;
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;
    const delay = i * 0.04;
    const startVol = (volume / Math.sqrt(freqs.length));
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(startVol, now + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
    osc.connect(gain);
    gain.connect(busOut(ctx));
    osc.start(now + delay);
    osc.stop(now + delay + duration + 0.02);
  });
}

function playSwoosh(durationMs: number, volume: number): void {
  const ctx = ensureContext();
  if (!ctx) return;
  // Filtered noise burst for card-deal swoosh
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * (durationMs / 1000));
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 2;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(busOut(ctx));
  noise.start(now);
  noise.stop(now + durationMs / 1000 + 0.02);
}

// A single warm tone gliding downward — a resigned "se acabó" sigh, with an
// octave-down body and a lowpass so it stays soft and never punishing.
function playFall(fromHz: number, toHz: number, durationMs: number, volume: number): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const dur = durationMs / 1000;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = fromHz * 3.5;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(fromHz, now);
  osc.frequency.exponentialRampToValueAtTime(toHz, now + dur * 0.9);
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(fromHz / 2, now);
  sub.frequency.exponentialRampToValueAtTime(toHz / 2, now + dur * 0.9);
  const subGain = ctx.createGain();
  subGain.gain.value = 0.5;
  osc.connect(filter);
  sub.connect(subGain);
  subGain.connect(filter);
  filter.connect(gain);
  gain.connect(busOut(ctx));
  osc.start(now);
  sub.start(now);
  osc.stop(now + dur + 0.02);
  sub.stop(now + dur + 0.02);
}

function playComplex(effect: SoundEffect): boolean {
  switch (effect) {
    case "win":
      // Triumphant chord: I → V → I octave
      playChord([523.25, 659.25, 783.99, 1046.5], 420, "triangle", 0.12);
      return true;
    case "lose":
      // Quiet descending fifth — the counterpoint to win's rising chord.
      playFall(392, 261.63, 440, 0.07);
      return true;
    case "deal":
      playSwoosh(180, 0.08);
      return true;
    case "reveal":
      // Quick ascending arpeggio: C maj
      playChord([523.25, 659.25, 783.99], 220, "triangle", 0.08);
      return true;
    case "yourTurn":
      // Two-note "attention" ding (perfect 4th up)
      playChord([880, 1174.66], 240, "sine", 0.08);
      return true;
    case "perlaArrive":
      // Bell-like chord, longer sustain (legendary feel)
      playChord([1318.51, 1567.98, 1975.53, 2637.02], 700, "sine", 0.14);
      return true;
    default:
      return false;
  }
}

export const audio = {
  setEnabled(value: boolean): void {
    enabled = value;
  },
  setMasterVolume(value: number): void {
    masterVolume = Math.max(0, Math.min(1, value));
    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(masterVolume, audioContext.currentTime, 0.04);
    }
  },
  isUnlocked: (): boolean => unlocked,
  init(): void {
    if (!enabled || audioContext) return;
    try {
      const ctx = new AudioContext();
      // Master bus: master gain → gentle compressor → speakers. The compressor
      // glues simultaneous voices together and stops peaks from clipping.
      const master = ctx.createGain();
      master.gain.value = masterVolume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.003;
      comp.release.value = 0.18;
      // Dry path: master → compressor → speakers.
      master.connect(comp);
      // Wet path (parallel): master → convolver → warm lowpass → wet trim → comp.
      // A short, dark reverb places every voice in the same small room.
      const convolver = ctx.createConvolver();
      convolver.buffer = buildRoomImpulse(ctx, 0.8, 3);
      const wetFilter = ctx.createBiquadFilter();
      wetFilter.type = "lowpass";
      wetFilter.frequency.value = 3200;
      const wet = ctx.createGain();
      wet.gain.value = 0.16;
      master.connect(convolver);
      convolver.connect(wetFilter);
      wetFilter.connect(wet);
      wet.connect(comp);
      comp.connect(ctx.destination);
      audioContext = ctx;
      masterGain = master;
      if (ctx.state === "suspended") void ctx.resume();
      unlocked = true;
    } catch {
      audioContext = null;
      masterGain = null;
    }
  },
  playEffect(effect: SoundEffect): void {
    if (!enabled) return;
    if (playComplex(effect)) return;
    const profile = simpleProfiles[effect];
    if (profile) playSimple(profile);
  },
  playActionSound(action: string): void {
    if (!action) return;
    const map: Record<string, SoundEffect> = {
      bet: "bet",
      call: "call",
      raise: "raise",
      check: "check",
      fold: "fold",
      allIn: "allIn",
    };
    const effect = map[action];
    if (effect) this.playEffect(effect);
  },
};
