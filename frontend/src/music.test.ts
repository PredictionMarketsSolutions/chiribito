import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Minimal Web Audio + Audio mocks (music.ts gets ctx injected via attach) ---

function fakeParam(value = 0) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

class FakeGain {
  gain = fakeParam(0);
  connect = vi.fn();
}

class FakeCtx {
  currentTime = 0;
  gains: FakeGain[] = [];
  createGain() {
    const g = new FakeGain();
    this.gains.push(g);
    return g as unknown as GainNode;
  }
  createMediaElementSource() {
    return { connect: vi.fn() } as unknown as MediaElementAudioSourceNode;
  }
}

const audios: FakeAudio[] = [];
class FakeAudio {
  src: string;
  loop = false;
  preload = "";
  currentTime = 0;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  private handlers: Record<string, Array<() => void>> = {};
  constructor(src: string) {
    this.src = src;
    audios.push(this);
  }
  addEventListener(type: string, fn: () => void) {
    (this.handlers[type] ||= []).push(fn);
  }
  emit(type: string) {
    (this.handlers[type] || []).forEach((fn) => fn());
  }
}

const DEST = {} as unknown as AudioNode;

let music: typeof import("./music").music;
let ctx: FakeCtx;

beforeEach(async () => {
  vi.resetModules();
  audios.length = 0;
  (globalThis as unknown as { Audio: typeof FakeAudio }).Audio = FakeAudio;
  ctx = new FakeCtx();
  ({ music } = await import("./music"));
});

function lobbyAudio() {
  return audios.find((a) => a.src.includes("lobby"));
}
function mesaAudios() {
  return audios.filter((a) => a.src.includes("mesa"));
}

describe("music layer", () => {
  it("does nothing and never throws before attach", () => {
    expect(() => {
      music.setState("mesa");
      music.setEnabled(false);
      music.setEnabled(true);
      music.duck();
    }).not.toThrow();
    expect(audios.length).toBe(0);
  });

  it("remembers a state set before attach and plays it once attached", () => {
    music.setState("lobby");
    expect(audios.length).toBe(0);
    music.attach(ctx as unknown as AudioContext, DEST);
    expect(lobbyAudio()).toBeTruthy();
    expect(lobbyAudio()!.play).toHaveBeenCalled();
  });

  it("crossfades lobby → mesa", () => {
    music.attach(ctx as unknown as AudioContext, DEST);
    music.setState("lobby");
    expect(lobbyAudio()!.play).toHaveBeenCalled();
    music.setState("mesa");
    const playing = mesaAudios().filter((a) => a.play.mock.calls.length > 0);
    expect(playing.length).toBe(1);
  });

  it("duck dips the music master then restores", () => {
    music.attach(ctx as unknown as AudioContext, DEST);
    music.setState("lobby");
    const master = ctx.gains[0]; // first gain created is the music master
    music.duck();
    expect(master.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.65, expect.any(Number));
    expect(master.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it("setEnabled(false) fades the current voice to zero, (true) replays it", () => {
    music.attach(ctx as unknown as AudioContext, DEST);
    music.setState("lobby");
    const voiceGain = ctx.gains[1]; // gain created when the lobby voice was built
    const playsBefore = lobbyAudio()!.play.mock.calls.length;
    music.setEnabled(false);
    expect(voiceGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    music.setEnabled(true);
    expect(lobbyAudio()!.play.mock.calls.length).toBeGreaterThan(playsBefore);
  });

  it("warns and stays silent when a track errors", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    music.attach(ctx as unknown as AudioContext, DEST);
    music.setState("mesa");
    mesaAudios()[0].emit("error");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
