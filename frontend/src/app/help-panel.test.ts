/**
 * help-panel.test.ts — Vitest (happy-dom) unit tests for the help-panel controller.
 *
 * Tests open/close state, all three close paths (button, ESC, click-outside),
 * focus trapping, and focus restoration. No engine/Pixi/schema/network imports.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openHelpPanel, closeHelpPanel, setHelpPanelVisible, detectHelpContext } from "./help-panel";

// ------------------------------------------------------------------ helpers --

/** Build a minimal overlay fixture and append it to document.body. */
function buildFixture() {
  // Outer overlay (the backdrop)
  const overlay = document.createElement("div");
  overlay.id = "help-panel-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "true");
  overlay.classList.add("help-panel", "hidden");

  // Content card (inside overlay)
  const content = document.createElement("div");
  content.id = "help-panel-content";

  // Close button (inside content)
  const closeButton = document.createElement("button");
  closeButton.id = "help-panel-close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  content.appendChild(closeButton);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  return { overlay, content, closeButton };
}

/** Build a sentinel button outside the panel that can hold focus. */
function buildSentinel() {
  const sentinel = document.createElement("button");
  sentinel.id = "sentinel-focus";
  sentinel.textContent = "Sentinel";
  document.body.appendChild(sentinel);
  return sentinel;
}

// -------------------------------------------------------------------- tests --

describe("setHelpPanelVisible", () => {
  it("removes .hidden and sets aria-hidden=false when visible=true", () => {
    const ov = document.createElement("div");
    ov.classList.add("hidden");
    ov.setAttribute("aria-hidden", "true");

    setHelpPanelVisible(ov, true);

    expect(ov.classList.contains("hidden")).toBe(false);
    expect(ov.getAttribute("aria-hidden")).toBe("false");
  });

  it("adds .hidden and sets aria-hidden=true when visible=false", () => {
    const ov = document.createElement("div");

    setHelpPanelVisible(ov, false);

    expect(ov.classList.contains("hidden")).toBe(true);
    expect(ov.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("openHelpPanel", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;
  let closeButton: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    closeButton = fixture.closeButton;
  });

  afterEach(() => {
    // Clean up DOM and close any open panel to avoid listener leaks across tests.
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("removes .hidden from the overlay on open", () => {
    openHelpPanel({ overlay, content });

    expect(overlay.classList.contains("hidden")).toBe(false);
  });

  it("moves focus inside the panel on open (close button is first focusable)", () => {
    openHelpPanel({ overlay, content });

    expect(document.activeElement).toBe(closeButton);
  });

  it("sets aria-hidden=false on open", () => {
    openHelpPanel({ overlay, content });

    expect(overlay.getAttribute("aria-hidden")).toBe("false");
  });

  it("is idempotent: calling open when already open does not duplicate listeners", () => {
    openHelpPanel({ overlay, content });
    openHelpPanel({ overlay, content }); // second call should be a no-op

    // Close once — panel should hide cleanly with no errors.
    closeHelpPanel({ overlay, content, onClose: () => {} });

    expect(overlay.classList.contains("hidden")).toBe(true);
  });
});

describe("closeHelpPanel — CLOSE PATH A: direct closeHelpPanel call", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    openHelpPanel({ overlay, content });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adds .hidden back on close", () => {
    closeHelpPanel({ overlay, content, onClose: () => {} });

    expect(overlay.classList.contains("hidden")).toBe(true);
  });

  it("sets aria-hidden=true on close", () => {
    closeHelpPanel({ overlay, content, onClose: () => {} });

    expect(overlay.getAttribute("aria-hidden")).toBe("true");
  });

  it("calls the onClose callback", () => {
    const onClose = vi.fn();
    closeHelpPanel({ overlay, content, onClose });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: calling close when already closed does not throw", () => {
    closeHelpPanel({ overlay, content, onClose: () => {} });
    // second call — should be a no-op
    expect(() => closeHelpPanel({ overlay, content, onClose: () => {} })).not.toThrow();
    expect(overlay.classList.contains("hidden")).toBe(true);
  });
});

describe("closeHelpPanel — CLOSE PATH B: Escape key", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    openHelpPanel({ overlay, content });
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("closes the panel when Escape is dispatched on document", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(overlay.classList.contains("hidden")).toBe(true);
  });
});

describe("closeHelpPanel — CLOSE PATH C: click-outside", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    openHelpPanel({ overlay, content });
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("closes the panel when clicking directly on the overlay backdrop", () => {
    // Dispatch a click whose target is the overlay itself (the backdrop).
    const event = new MouseEvent("click", { bubbles: true });
    // Override the target by dispatching on overlay directly.
    overlay.dispatchEvent(event);

    expect(overlay.classList.contains("hidden")).toBe(true);
  });

  it("does NOT close the panel when clicking inside #help-panel-content", () => {
    // Dispatch a click on the content element — should NOT close.
    const event = new MouseEvent("click", { bubbles: true });
    content.dispatchEvent(event);

    expect(overlay.classList.contains("hidden")).toBe(false);
  });
});

describe("focus restore", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;
  let sentinel: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    sentinel = buildSentinel();
    sentinel.focus();
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("restores focus to the previously-focused element on close", () => {
    // Sentinel has focus before we open.
    expect(document.activeElement).toBe(sentinel);

    openHelpPanel({ overlay, content });

    // Focus should now be inside the panel.
    expect(document.activeElement).not.toBe(sentinel);

    closeHelpPanel({ overlay, content, onClose: () => {} });

    // Focus should be restored to the sentinel.
    expect(document.activeElement).toBe(sentinel);
  });
});

describe("focus trap — Tab wrapping", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;
  let closeButton: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;
    closeButton = fixture.closeButton;
    openHelpPanel({ overlay, content });
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("Tab from the last focusable element wraps to the first", () => {
    // Only one focusable element (closeButton) is first AND last.
    // Focus it, then Tab — it should stay on it (wrap from last → first = same).
    closeButton.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, shiftKey: false })
    );

    // focus should still be on closeButton (only focusable element wraps to itself)
    expect(document.activeElement).toBe(closeButton);
  });

  it("Shift+Tab from the first focusable element wraps to the last", () => {
    closeButton.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, shiftKey: true })
    );

    expect(document.activeElement).toBe(closeButton);
  });
});

// ----------------------------------------------------------------- Task 1: Context detection + variant --

describe("context detection + variant", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;
  let lobbyOverlay: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;

    // Add #lobby-overlay to simulate the real DOM structure.
    lobbyOverlay = document.createElement("div");
    lobbyOverlay.id = "lobby-overlay";
    document.body.appendChild(lobbyOverlay);
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("detectHelpContext returns 'lobby' when #lobby-overlay exists and lacks .hidden", () => {
    // lobbyOverlay has no .hidden class by default.
    expect(detectHelpContext()).toBe("lobby");
  });

  it("detectHelpContext returns 'table' when #lobby-overlay has .hidden", () => {
    lobbyOverlay.classList.add("hidden");
    expect(detectHelpContext()).toBe("table");
  });

  it("detectHelpContext returns 'table' when #lobby-overlay is absent", () => {
    lobbyOverlay.remove();
    expect(detectHelpContext()).toBe("table");
  });

  it("opening with #lobby-overlay visible adds .help-panel--lobby and not .help-panel--drawer", () => {
    // lobbyOverlay is visible (no .hidden).
    openHelpPanel({ overlay, content });

    expect(overlay.classList.contains("help-panel--lobby")).toBe(true);
    expect(overlay.classList.contains("help-panel--drawer")).toBe(false);
  });

  it("opening with #lobby-overlay .hidden adds .help-panel--drawer and not .help-panel--lobby", () => {
    lobbyOverlay.classList.add("hidden");
    openHelpPanel({ overlay, content });

    expect(overlay.classList.contains("help-panel--drawer")).toBe(true);
    expect(overlay.classList.contains("help-panel--lobby")).toBe(false);
  });

  it("re-opening in the other context swaps the modifier — only one variant class present", () => {
    // Open in lobby context.
    openHelpPanel({ overlay, content });
    expect(overlay.classList.contains("help-panel--lobby")).toBe(true);

    // Close, switch to table context.
    closeHelpPanel({ overlay, content, onClose: () => {} });
    lobbyOverlay.classList.add("hidden");

    // Re-open in table context.
    openHelpPanel({ overlay, content });
    expect(overlay.classList.contains("help-panel--drawer")).toBe(true);
    expect(overlay.classList.contains("help-panel--lobby")).toBe(false);
  });

  it("injected getContext override takes precedence over DOM check", () => {
    // DOM says lobby (lobbyOverlay visible), but override says table.
    openHelpPanel({ overlay, content, getContext: () => "table" });

    expect(overlay.classList.contains("help-panel--drawer")).toBe(true);
    expect(overlay.classList.contains("help-panel--lobby")).toBe(false);
  });
});

// ----------------------------------------------------------------- Task 2: "es tu turno" cue observer --

describe("es tu turno cue", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;
  let indicator: HTMLElement;

  beforeEach(() => {
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;

    // Add #your-turn-indicator (starts hidden, like the real DOM).
    indicator = document.createElement("div");
    indicator.id = "your-turn-indicator";
    indicator.classList.add("hidden");
    document.body.appendChild(indicator);
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    document.body.innerHTML = "";
  });

  it("mounts a cue element with correct role/aria-live inside content when in table context", () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });

    const cue = content.querySelector(".help-panel__turn-cue");
    expect(cue).not.toBeNull();
    expect(cue?.getAttribute("role")).toBe("status");
    expect(cue?.getAttribute("aria-live")).toBe("polite");
  });

  it("cue text is 'Es tu turno' (sentence case)", () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });

    const cue = content.querySelector(".help-panel__turn-cue");
    expect(cue?.textContent).toBe("Es tu turno");
  });

  it("cue is hidden while #your-turn-indicator has .hidden", () => {
    // indicator starts with .hidden
    openHelpPanel({ overlay, content, getContext: () => "table" });

    const cue = content.querySelector(".help-panel__turn-cue") as HTMLElement;
    expect(cue.classList.contains("hidden")).toBe(true);
  });

  it("cue becomes visible when #your-turn-indicator loses .hidden", async () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });

    // Simulate turn start: remove .hidden from indicator.
    indicator.classList.remove("hidden");

    // MutationObserver fires asynchronously — wait a microtask.
    await Promise.resolve();

    const cue = content.querySelector(".help-panel__turn-cue") as HTMLElement;
    expect(cue.classList.contains("hidden")).toBe(false);
  });

  it("cue hides again when #your-turn-indicator regains .hidden", async () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });

    // Show then hide the indicator.
    indicator.classList.remove("hidden");
    await Promise.resolve();
    indicator.classList.add("hidden");
    await Promise.resolve();

    const cue = content.querySelector(".help-panel__turn-cue") as HTMLElement;
    expect(cue.classList.contains("hidden")).toBe(true);
  });

  it("cue is NOT mounted in lobby context", () => {
    openHelpPanel({ overlay, content, getContext: () => "lobby" });

    const cue = content.querySelector(".help-panel__turn-cue");
    expect(cue).toBeNull();
  });

  it("after close, toggling #your-turn-indicator no longer affects any cue", async () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });
    closeHelpPanel({ overlay, content, onClose: () => {} });

    // Cue element should be removed.
    const cue = content.querySelector(".help-panel__turn-cue");
    expect(cue).toBeNull();

    // Toggling indicator after close does not recreate cue or throw.
    indicator.classList.remove("hidden");
    await Promise.resolve();

    expect(content.querySelector(".help-panel__turn-cue")).toBeNull();
  });

  it("re-opening does not accumulate cue elements or observers", () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });
    closeHelpPanel({ overlay, content, onClose: () => {} });
    openHelpPanel({ overlay, content, getContext: () => "table" });

    const cues = content.querySelectorAll(".help-panel__turn-cue");
    expect(cues.length).toBe(1);
  });

  it("focus trap still works in the drawer variant (Tab stays within panel)", () => {
    openHelpPanel({ overlay, content, getContext: () => "table" });

    // The close button should have focus.
    const closeBtn = overlay.querySelector("button") as HTMLElement;
    closeBtn.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, shiftKey: false })
    );

    // focus should stay within the panel (only focusable is the close button).
    expect(overlay.contains(document.activeElement)).toBe(true);
  });
});

// ----------------------------------------------------------------- Task 2: no timer pause --

describe("no timer pause", () => {
  let overlay: HTMLElement;
  let content: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    const fixture = buildFixture();
    overlay = fixture.overlay;
    content = fixture.content;

    // Add #your-turn-indicator so table context works.
    const indicator = document.createElement("div");
    indicator.id = "your-turn-indicator";
    indicator.classList.add("hidden");
    document.body.appendChild(indicator);
  });

  afterEach(() => {
    if (!overlay.classList.contains("hidden")) {
      closeHelpPanel({ overlay, content, onClose: () => {} });
    }
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("open+close in table context calls no setInterval/clearInterval/setTimeout/clearTimeout", () => {
    const spySetInterval = vi.spyOn(globalThis, "setInterval");
    const spyClearInterval = vi.spyOn(globalThis, "clearInterval");
    const spySetTimeout = vi.spyOn(globalThis, "setTimeout");
    const spyClearTimeout = vi.spyOn(globalThis, "clearTimeout");

    openHelpPanel({ overlay, content, getContext: () => "table" });
    closeHelpPanel({ overlay, content, onClose: () => {} });

    expect(spySetInterval).not.toHaveBeenCalled();
    expect(spyClearInterval).not.toHaveBeenCalled();
    expect(spySetTimeout).not.toHaveBeenCalled();
    expect(spyClearTimeout).not.toHaveBeenCalled();

    spySetInterval.mockRestore();
    spyClearInterval.mockRestore();
    spySetTimeout.mockRestore();
    spyClearTimeout.mockRestore();
  });
});
