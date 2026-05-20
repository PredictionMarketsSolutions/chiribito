/**
 * Music layer for Chiribito — long-lived looping ambient music with lobby/mesa
 * states, crossfades, ducking under "moment" SFX, and graceful fallback.
 *
 * Separate concern from audio.ts (one-shot SFX) but shares its AudioContext +
 * bus via `music.attach(ctx, destination)`. Plug-and-play: drop loops into
 * public/audio/ (see TRACKS). A missing or errored file is skipped silently
 * (console.warn) so the layer runs quiet until the assets exist.
 *
 * Swapping the definitive music later = replace the MP3s, no code change. To
 * add/remove a loop, edit TRACKS only.
 */

export type MusicState = "lobby" | "mesa" | "none";

// Asset paths, served from public/. The only place that knows file names.
const TRACKS: Record<"lobby" | "mesa", string[]> = {
  lobby: ["/audio/lobby.mp3"],
  mesa: ["/audio/mesa-1.mp3", "/audio/mesa-2.mp3"],
};

// Base mix levels per state — low by design (music accompanies gameplay). Tunable by ear.
const BASE_LEVEL: Record<"lobby" | "mesa", number> = {
  lobby: 0.15,
  mesa: 0.1,
};

const CROSSFADE_S = 2;
const DUCK_DEPTH = 0.65; // music dips to 65% under a moment SFX
const DUCK_RESTORE_S = 0.8;
const MESA_VARIETY_MS = 180_000; // rotate between mesa loops every ~3 min for variety

type Voice = {
  url: string;
  el: HTMLAudioElement;
  gain: GainNode;
  available: boolean;
};

let ctx: AudioContext | null = null;
let musicMaster: GainNode | null = null; // global music gain — ducking rides here
let enabled = true;
let state: MusicState = "none";
let current: Voice | null = null;
let mesaPos = -1;
const voices = new Map<string, Voice>();
let varietyTimer: ReturnType<typeof setInterval> | null = null;
let visibilityWired = false;

function rampTo(param: AudioParam, value: number, seconds: number): void {
  if (!ctx) return;
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + seconds);
}

// Lazily build a Voice (audio element + gain) for a url, wired into the music bus.
function getVoice(url: string): Voice | null {
  if (!ctx || !musicMaster) return null;
  const existing = voices.get(url);
  if (existing) return existing;
  try {
    const el = new Audio(url);
    el.loop = true;
    el.preload = "auto";
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const source = ctx.createMediaElementSource(el);
    source.connect(gain);
    gain.connect(musicMaster);
    const voice: Voice = { url, el, gain, available: true };
    el.addEventListener("error", () => {
      voice.available = false;
      console.warn(`[music] track unavailable, skipping: ${url}`);
    });
    voices.set(url, voice);
    return voice;
  } catch {
    return null;
  }
}

function playEl(el: HTMLAudioElement): void {
  const p = el.play?.();
  // A rejected play() is almost always a missing user gesture — not fatal, and it
  // resolves on the next interaction. Never mark the voice unavailable for it.
  if (p && typeof p.catch === "function") p.catch(() => undefined);
}

function startVoice(voice: Voice, level: number): void {
  try {
    voice.el.currentTime = 0;
  } catch {
    /* not seekable yet */
  }
  playEl(voice.el);
  rampTo(voice.gain.gain, level, CROSSFADE_S);
}

function stopVoice(voice: Voice): void {
  rampTo(voice.gain.gain, 0, CROSSFADE_S);
  const el = voice.el;
  window.setTimeout(() => {
    try {
      el.pause();
    } catch {
      /* ignore */
    }
  }, CROSSFADE_S * 1000 + 120);
}

// Choose the next available url for a target state. Mesa round-robins for variety.
function pickUrl(target: "lobby" | "mesa"): string | null {
  const list = TRACKS[target];
  if (target === "mesa") {
    for (let i = 0; i < list.length; i += 1) {
      mesaPos = (mesaPos + 1) % list.length;
      const v = getVoice(list[mesaPos]);
      if (v && v.available) return list[mesaPos];
    }
    return null;
  }
  for (const url of list) {
    const v = getVoice(url);
    if (v && v.available) return url;
  }
  return null;
}

function clearVarietyTimer(): void {
  if (varietyTimer !== null) {
    clearInterval(varietyTimer);
    varietyTimer = null;
  }
}

function availableMesaCount(): number {
  return TRACKS.mesa.filter((u) => getVoice(u)?.available).length;
}

// (Re)apply the current `state`. Used by setState, setEnabled, and visibility resume.
function applyState(): void {
  const targetVoice =
    enabled && ctx && state !== "none" ? voiceForState(state) : null;

  if (!targetVoice) {
    if (current) stopVoice(current);
    current = null;
    clearVarietyTimer();
    return;
  }

  if (current && current !== targetVoice) stopVoice(current);
  current = targetVoice;
  startVoice(targetVoice, BASE_LEVEL[state as "lobby" | "mesa"]);

  clearVarietyTimer();
  if (state === "mesa" && availableMesaCount() > 1) {
    varietyTimer = setInterval(rotateMesa, MESA_VARIETY_MS);
  }
}

function voiceForState(s: Exclude<MusicState, "none">): Voice | null {
  const url = pickUrl(s);
  return url ? getVoice(url) : null;
}

function rotateMesa(): void {
  if (state !== "mesa" || !enabled) return;
  const next = voiceForState("mesa");
  if (next && next !== current) {
    if (current) stopVoice(current);
    current = next;
    startVoice(next, BASE_LEVEL.mesa);
  }
}

export const music = {
  /** Wire into the shared AudioContext + bus (from audio.getMusicTap()). Call once. */
  attach(audioCtx: AudioContext, destination: AudioNode): void {
    if (ctx) return;
    ctx = audioCtx;
    const master = audioCtx.createGain();
    master.gain.value = 1;
    master.connect(destination);
    musicMaster = master;
    if (!visibilityWired && typeof document !== "undefined") {
      visibilityWired = true;
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (current) {
            try {
              current.el.pause();
            } catch {
              /* ignore */
            }
          }
        } else if (enabled && current) {
          playEl(current.el);
        }
      });
    }
    applyState();
  },
  /** Crossfade to a state's track(s). Remembered if called before attach. */
  setState(next: MusicState): void {
    if (next === state) return;
    state = next;
    applyState();
  },
  /** Mute/unmute the whole music layer (wired to the "Sonido" toggle). */
  setEnabled(value: boolean): void {
    if (value === enabled) return;
    enabled = value;
    applyState();
  },
  /** Briefly dip the music so a moment SFX cuts through, then restore. */
  duck(depth: number = DUCK_DEPTH, restoreS: number = DUCK_RESTORE_S): void {
    if (!ctx || !musicMaster || !enabled || !current) return;
    const now = ctx.currentTime;
    musicMaster.gain.cancelScheduledValues(now);
    musicMaster.gain.setValueAtTime(musicMaster.gain.value, now);
    musicMaster.gain.linearRampToValueAtTime(depth, now + 0.06);
    musicMaster.gain.linearRampToValueAtTime(1, now + 0.06 + restoreS);
  },
  /** Live level tuning (used by the runtime knob): set a state's base level now. */
  setBaseLevel(s: "lobby" | "mesa", value: number): void {
    BASE_LEVEL[s] = Math.max(0, Math.min(1, value));
    if (current && state === s) rampTo(current.gain.gain, BASE_LEVEL[s], 0.3);
  },
};
