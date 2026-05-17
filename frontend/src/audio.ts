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

type SimpleProfile = { frequency: number; durationMs: number; type: OscillatorType; volume: number };

const simpleProfiles: Partial<Record<SoundEffect, SimpleProfile>> = {
  bet: { frequency: 440, durationMs: 120, type: "sine", volume: 0.08 },
  call: { frequency: 520, durationMs: 120, type: "triangle", volume: 0.08 },
  raise: { frequency: 620, durationMs: 160, type: "triangle", volume: 0.1 },
  check: { frequency: 360, durationMs: 90, type: "sine", volume: 0.06 },
  fold: { frequency: 220, durationMs: 140, type: "sawtooth", volume: 0.08 },
  allIn: { frequency: 740, durationMs: 220, type: "square", volume: 0.1 },
  click: { frequency: 880, durationMs: 28, type: "square", volume: 0.04 },
  hover: { frequency: 1320, durationMs: 18, type: "sine", volume: 0.015 },
};

let audioContext: AudioContext | null = null;
let unlocked = false;
let enabled = true;
let masterVolume = 1;

function ensureContext(): AudioContext | null {
  if (!enabled) return null;
  if (!audioContext) return null;
  if (audioContext.state !== "running") return null;
  return audioContext;
}

function playSimple(profile: SimpleProfile): void {
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = profile.type;
  osc.frequency.value = profile.frequency;
  const now = ctx.currentTime;
  const duration = profile.durationMs / 1000;
  // Tiny attack + decay envelope to avoid clicks
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(profile.volume * masterVolume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
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
    const startVol = (volume / Math.sqrt(freqs.length)) * masterVolume;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(startVol, now + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
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
  gain.gain.linearRampToValueAtTime(volume * masterVolume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + durationMs / 1000 + 0.02);
}

function playComplex(effect: SoundEffect): boolean {
  switch (effect) {
    case "win":
      // Triumphant chord: I → V → I octave
      playChord([523.25, 659.25, 783.99, 1046.5], 420, "triangle", 0.12);
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
  },
  isUnlocked: (): boolean => unlocked,
  init(): void {
    if (!enabled || audioContext) return;
    try {
      audioContext = new AudioContext();
      if (audioContext.state === "suspended") void audioContext.resume();
      unlocked = true;
    } catch {
      audioContext = null;
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
