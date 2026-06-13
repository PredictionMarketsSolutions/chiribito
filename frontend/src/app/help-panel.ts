/**
 * help-panel.ts — Pure-DOM controller for the in-game help panel.
 *
 * Mirrors the Mi Rincón (rincon-scene.ts) deps-injection style but is
 * SYNCHRONOUS and SELF-CONTAINED: no auth, no fetch, no engine import.
 *
 * Exports:
 *   setHelpPanelVisible(overlay, visible)   — toggle .hidden + aria-hidden
 *   detectHelpContext()                     — returns "lobby" | "table" from DOM
 *   openHelpPanel(deps)                     — open, trap focus, register ESC / click-outside
 *   closeHelpPanel(deps)                    — close, remove listeners, restore focus
 *
 * Phase 1 scope: open/close + focus trap + aria only.
 * Phase 4 additions: context detection, variant modifier classes, "es tu turno" cue observer.
 * Rules/rankings content is inserted by phases 2–3 — deps.content stays empty here.
 */

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";

export interface OpenHelpPanelDeps {
  overlay: HTMLElement;
  content?: HTMLElement;
  closeButton?: HTMLElement;
  onClose?: () => void;
  /** Optional context override for unit-testability; defaults to detectHelpContext(). */
  getContext?: () => "lobby" | "table";
}

/**
 * Detect whether the panel is being opened in lobby or table context.
 * Lobby = #lobby-overlay exists and does NOT have .hidden.
 * Table = otherwise (lobby hidden or element absent).
 *
 * Pure DOM read — imports NOTHING from src/rooms, Pixi TableScene, Colyseus schema,
 * networking, or turn-timer.ts.
 */
export function detectHelpContext(): "lobby" | "table" {
  const lobbyOverlay = document.getElementById("lobby-overlay");
  if (lobbyOverlay !== null && !lobbyOverlay.classList.contains("hidden")) {
    return "lobby";
  }
  return "table";
}

// Module-level state so open/close/listeners share the same captured values.
let _capturedFocus: HTMLElement | null = null;
let _keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let _clickHandler: ((e: MouseEvent) => void) | null = null;
// The overlay the click listener was attached to at open time, so close removes
// it from the SAME element even if a different deps object is passed to close.
let _overlayRef: HTMLElement | null = null;
// Phase 4: cue observer + cue element (table variant only).
let _cueObserver: MutationObserver | null = null;
let _cueEl: HTMLElement | null = null;

/** Toggle the .hidden class and flip aria-hidden accordingly. */
export function setHelpPanelVisible(overlay: HTMLElement, visible: boolean): void {
  overlay.classList.toggle("hidden", !visible);
  overlay.setAttribute("aria-hidden", String(!visible));
}

/**
 * Sync the cue element's visibility to mirror the #your-turn-indicator.
 * Cue is visible (lacks .hidden) iff the indicator is visible (lacks .hidden).
 * Pure DOM read — no timer, no engine import.
 */
function syncCueVisibility(cueEl: HTMLElement, indicator: HTMLElement): void {
  const turnVisible = !indicator.classList.contains("hidden");
  cueEl.classList.toggle("hidden", !turnVisible);
}

function getFocusableElements(overlay: HTMLElement): HTMLElement[] {
  return Array.from(overlay.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
  );
}

/**
 * Open the help panel.
 * - Captures previously-focused element so closeHelpPanel can restore it.
 * - Removes .hidden, sets aria-hidden=false.
 * - Moves focus to the first focusable element inside the overlay (or the overlay itself).
 * - Registers a keydown handler on document for ESC (close) + Tab/Shift+Tab (focus trap).
 * - Registers a click handler on the overlay to close when clicking the backdrop.
 */
export function openHelpPanel(deps: OpenHelpPanelDeps): void {
  // Idempotent: if already open (no .hidden) skip re-opening.
  if (!deps.overlay.classList.contains("hidden")) return;

  // Capture element that had focus before we opened the panel.
  _capturedFocus = document.activeElement as HTMLElement | null;

  // Phase 4: detect context and apply exactly one variant modifier class.
  const context = deps.getContext?.() ?? detectHelpContext();
  if (context === "lobby") {
    deps.overlay.classList.remove("help-panel--drawer");
    deps.overlay.classList.add("help-panel--lobby");
  } else {
    deps.overlay.classList.remove("help-panel--lobby");
    deps.overlay.classList.add("help-panel--drawer");
  }

  // Phase 4: mount "es tu turno" cue observer in table (drawer) context only.
  if (context === "table") {
    const cueEl = document.createElement("div");
    cueEl.className = "help-panel__turn-cue";
    cueEl.setAttribute("role", "status");
    cueEl.setAttribute("aria-live", "polite");
    cueEl.textContent = "Es tu turno";
    // Start hidden; syncCueVisibility will reveal it if indicator is visible.
    cueEl.classList.add("hidden");

    // Insert as the FIRST child so the sticky cue pins to the top of the
    // scrollable body (appended last, it would sit below the rules/rankings).
    const container = deps.content ?? deps.overlay;
    container.insertBefore(cueEl, container.firstChild);
    _cueEl = cueEl;

    const indicator = document.getElementById("your-turn-indicator");
    if (indicator !== null) {
      // Sync once at mount.
      syncCueVisibility(cueEl, indicator);

      // Observe class mutations on the indicator to keep cue in sync.
      _cueObserver = new MutationObserver(() => {
        syncCueVisibility(cueEl, indicator);
      });
      _cueObserver.observe(indicator, { attributes: true, attributeFilter: ["class"] });
    }
  }

  setHelpPanelVisible(deps.overlay, true);

  // Focus the first focusable element inside the overlay.
  const focusables = getFocusableElements(deps.overlay);
  if (focusables.length > 0) {
    focusables[0].focus();
  } else {
    // Fallback: make overlay itself focusable and focus it.
    if (!deps.overlay.hasAttribute("tabindex")) {
      deps.overlay.setAttribute("tabindex", "-1");
    }
    deps.overlay.focus();
  }

  // Keydown handler: ESC closes; Tab/Shift+Tab trap focus.
  _keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeHelpPanel(deps);
      return;
    }

    if (e.key === "Tab") {
      const focusableEls = getFocusableElements(deps.overlay);
      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last.
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first.
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  // Click-outside handler: close only when clicking the backdrop (the overlay itself,
  // not its children inside #help-panel-content).
  _clickHandler = (e: MouseEvent) => {
    if (e.target === deps.overlay) {
      closeHelpPanel(deps);
    }
  };

  _overlayRef = deps.overlay;
  document.addEventListener("keydown", _keydownHandler);
  deps.overlay.addEventListener("click", _clickHandler);
}

/**
 * Close the help panel.
 * - Adds .hidden, sets aria-hidden=true.
 * - Removes the keydown + overlay-click listeners (no listener leaks).
 * - Restores focus to the element captured at open time (if still in the DOM).
 * - Calls deps.onClose?.() callback.
 */
export function closeHelpPanel(deps: OpenHelpPanelDeps): void {
  // Idempotent: if already hidden, skip.
  if (deps.overlay.classList.contains("hidden")) return;

  setHelpPanelVisible(deps.overlay, false);

  // Remove registered listeners.
  if (_keydownHandler !== null) {
    document.removeEventListener("keydown", _keydownHandler);
    _keydownHandler = null;
  }
  if (_clickHandler !== null) {
    // Remove from the overlay the listener was attached to at open time.
    (_overlayRef ?? deps.overlay).removeEventListener("click", _clickHandler);
    _clickHandler = null;
  }
  _overlayRef = null;

  // Phase 4: tear down cue observer + remove cue element (no leak).
  if (_cueObserver !== null) {
    _cueObserver.disconnect();
    _cueObserver = null;
  }
  if (_cueEl !== null) {
    _cueEl.remove();
    _cueEl = null;
  }

  // Restore previously-focused element if it is still in the document.
  if (_capturedFocus !== null && _capturedFocus.isConnected) {
    _capturedFocus.focus();
  }
  _capturedFocus = null;

  deps.onClose?.();
}
