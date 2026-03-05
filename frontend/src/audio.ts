/**
 * Sound effects for game actions (no DOM dependency)
 */
import type { SoundEffect } from "./types";

const soundProfiles: Record<
  SoundEffect,
  { frequency: number; durationMs: number; type: OscillatorType; volume: number }
> = {
  bet: { frequency: 440, durationMs: 120, type: "sine", volume: 0.08 },
  call: { frequency: 520, durationMs: 120, type: "triangle", volume: 0.08 },
  raise: { frequency: 620, durationMs: 160, type: "triangle", volume: 0.1 },
  check: { frequency: 360, durationMs: 90, type: "sine", volume: 0.06 },
  fold: { frequency: 220, durationMs: 140, type: "sawtooth", volume: 0.08 },
  allIn: { frequency: 740, durationMs: 220, type: "square", volume: 0.1 },
  win: { frequency: 880, durationMs: 260, type: "triangle", volume: 0.12 },
};

let audioContext: AudioContext | null = null;
let unlocked = false;
let enabled = true;

export const audio = {
  setEnabled(value: boolean) {
    enabled = value;
  },
  isUnlocked: () => unlocked,
  init() {
    if (!enabled || audioContext) return;
    audioContext = new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    unlocked = true;
  },
  playEffect(effect: SoundEffect) {
    if (!enabled || !audioContext || audioContext.state !== "running") return;
    const profile = soundProfiles[effect];
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = profile.type;
    osc.frequency.value = profile.frequency;
    gain.gain.value = profile.volume;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    const now = audioContext.currentTime;
    osc.start(now);
    osc.stop(now + profile.durationMs / 1000);
  },
  playActionSound(action: string) {
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
