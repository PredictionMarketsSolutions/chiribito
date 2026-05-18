# Move 2 — Mid-game WS reconnect (production-grade, client-side)

> Origin session: 2026-05-18.
> Builds on Move 1.5 (closed 2026-05-18, `c438595`).
> Server-side `reconnectionTimeoutSeconds = 60` stays intact per user
> direction — robustness must be achieved inside the existing window.

## Status

DRAFT — pending user approval before transitioning to `writing-plans`.

## Why this Move

Move 1.5 shipped the `reconnectionToken` recovery primitive for
**hydration** (reload) and **post-login** paths. The mid-game WS-drop
path was scoped out and still uses the legacy `attemptReconnect` flow,
which has seven concrete defects:

| # | Defect | Evidence |
|---|--------|----------|
| 1 | `attemptReconnect` calls `joinRoom(true)` (forceReplace). Bypasses the `client.reconnect(token)` primitive landed in Move 1.5. The server-held seat (`allowReconnection(client, 60)`) is rejected, not resumed — wasting the only mechanism designed for this case. | `frontend/src/connection.ts:147` |
| 2 | Exponential backoff `1s, 2s, 4s, 8s, 16s, 32s` accumulates to **63 s by attempt 6**. The server window is 60 s. The seat expires before the client can use it. | `frontend/src/connection.ts:142-143` |
| 3 | Heartbeat is configured at `interval=30 s, timeout=180 s`. A silent network drop is not detected for up to 3 min — six full server-window expirations. | `frontend/src/main.ts:246-247` |
| 4 | Server emits `reconnected` and `gameEnded` messages with no client handler → console warnings during every successful reconnect. UX noise. | `docs/RECONNECT_FINDINGS.md` lines 138-146 |
| 5 | No visible UX during reconnect. The connection-indicator dot changes color; that is all. User cannot distinguish "lost" from "recovering". | DOM audit (negative grep) |
| 6 | Zero E2E coverage for: real WS drop, tab-inactive + drop, slow network, mobile network switch, long drop > 60 s, multiple retries. Steps 5/6/7 cover reload and post-login restore only. | `scripts/e2e-browser.ts:332-442` |
| 7 | `attemptReconnect` may fire concurrently from three sources (`onLeave` transient code, heartbeat timeout, `visibilitychange` resume). `joinInProgress` lock exists but the flows that *trigger* the reconnect are not coordinated. | `room-leave-handler.ts:67`, `connection.ts:44`, `global-lifecycle.ts:74` |

## Goal

Convert the mid-game reconnect flow into a production-grade client-side
recovery system that operates entirely inside the existing 60 s server
window. Any transient WebSocket drop must resume seat, chips, hole cards
and turn ownership via `client.reconnect(token)`. UX is visible and
discreet. No regression of Move 1.5 hydration/login paths nor of Move 5
session exclusivity.

## Implementation priorities (from user, 2026-05-18)

These bind every slice and override style choices when in tension:

1. **UX discreta en extremo.** No modales pesados, no overlays
   invasivos. El reconnect debe sentirse elegante y casi invisible
   cuando funciona rápido (< 1 s). El banner solo aparece tras 250 ms
   de `connecting` o tras el primer fallo — y desaparece al instante
   en cuanto la conexión vuelve. Sin animaciones que retengan
   atención.
2. **Cero regresión de Move 1.5.** Auth persistence, session
   consistency, login stability, reload flow y los 25 E2E existentes
   son intocables. Cada slice corre el suite completo antes de
   commitear. Si algo de Move 1.5 se ve afectado, se aborta el slice
   y se rediseña.
3. **Continuidad visual de mesa en recovery (especialmente móvil).**
   Cuando la conexión vuelve, prohibido:
   - flicker fuerte de cartas/seats/community
   - remount visual agresivo (re-render completo de la Pixi scene
     desde cero)
   - "salto" de fase visible al re-sincronizar state
   El `mountJoinedRoom` ya reusa la TableScene existente — se respeta.
   Si algún cambio fuerza un remount, el slice no se mergea.

## Out of scope

- Engine, managers, schemas, glossary, server protocol.
- `reconnectionTimeoutSeconds = 60` server-side.
- `SESSION_EXISTS` gate / multi-tab semantics (Move 5).
- Auth flow, token refresh, logout (Move 3).
- Single-player auto-dispose fix (separate follow-up Move).
- Render / Docker deploy configuration.
- Ephemeral broadcast replay (`communityCardRevealed`, `roundEnded`
  animations during the gap are forfeit; state is re-synced via Colyseus
  schema). Accepted trade-off.

## Risks & mitigations

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Three sources can trigger `attemptReconnect` concurrently. | Single canonical entry-point. `joinInProgress` + idempotent gate. Sources only mark intent; the reconnect loop owns scheduling. |
| R2 | Cumulative backoff > 60 s expires the server seat. | New schedule capped at ≤ 50 s cumulative within 6 attempts. ±20 % jitter to avoid synchronized retries across clients. |
| R3 | `client.reconnect(token)` may hang on a half-open connection. | Per-attempt `Promise.race` against a 5 s timeout. On timeout, abort and proceed to next attempt. |
| R4 | Single-player mesa dies on disconnect (`checkGameEnd` auto-dispose). | E2E uses ≥ 2 seated players (step 4.5 already exists). Real-prod fix deferred to a separate Move. Spec documents this gap explicitly. |
| R5 | Mobile network switch → WS dies silently; browser TCP timeout is minutes. | Heartbeat tightened to `interval=5 s, timeout=10 s`. Worst-case detection ≈ 15 s, leaving ≥ 45 s of the server window for retries. |
| R6 | UX banner false positives on healthy-but-slow networks. | Banner only renders after the first failed attempt or after > 250 ms in `connecting` state. Disappears on `connected`. |
| R7 | Race between successful `reconnect(token)` and a stale, later `joinRoom(true)` fallback completing too. Or a `client.reconnect` that timed-out at 5 s but actually resolves at 8 s with a real `Room`. | Reconnect loop carries a monotonically incrementing epoch. Stale results are discarded by epoch check on resolve. If a stale resolve produces an orphan `Room`, call `.leave()` on it to free the server-side seat. |
| R8 | `clearAuthToken` on max attempts kicks the user out of auth entirely, even though the token is still valid. | New terminal behaviour: drop into lobby with a clear error message, keep auth token, allow user to re-enter mesa list. |

## Design

### Reconnect decision tree

```
trigger source ─┐
                ├─ heartbeat timeout
                ├─ room.onLeave (transient code)
                └─ visibilitychange (resume + had-room)
                       │
                       ▼
              reconnectionDirector.requestReconnect()
                       │ (idempotent; locked via joinInProgress)
                       ▼
              ┌────────────────────────┐
              │ have reconnectionToken?│
              └────┬───────────────────┘
                   │
              yes  │  no
                   ▼     ▼
        client.reconnect(token)    fallback: joinRoom(true) with lastRoomId
        race vs 5 s timeout                │
                   │                       │
        success ───┤                       │
                   │                       │
        failure ───┼── attempts < 6 ──> backoff(attempt) → next attempt
                   │
                   └── attempts ≥ 6 ──> degradeToLobby(keepAuth=true)
```

### Backoff schedule

| Attempt | Delay before attempt | Cumulative | Source window |
|---------|----------------------|------------|---------------|
| 1 | 250 ms | 0.25 s | within 60 s |
| 2 | 500 ms | 0.75 s | within 60 s |
| 3 | 1 s | 1.75 s | within 60 s |
| 4 | 2 s | 3.75 s | within 60 s |
| 5 | 4 s | 7.75 s | within 60 s |
| 6 | 8 s | 15.75 s | within 60 s |
| (each with ±20 % jitter; per-attempt cap = 5 s for `client.reconnect`) | | | |
| Degradation | — | ≤ 50 s | inside window |

Worst-case (every attempt waits the 5 s reconnect timeout):
0.25 + 5 + 0.5 + 5 + 1 + 5 + 2 + 5 + 4 + 5 + 8 + 5 ≈ 45.75 s — still
inside the 60 s server seat. After attempt 6 we *know* the server has
either dropped the seat or the network is unrecoverable; degrade
cleanly.

### Slices

The work is split into seven small slices. Each slice ships as one
commit and lands tests with it.

#### Slice A — Rewire `attemptReconnect`

**Files:**
- `frontend/src/connection.ts` (rewrite `attemptReconnect`)
- `frontend/src/connection.test.ts` (extend)
- `frontend/src/main.ts` (wire new deps: `getReconnectionToken`,
  `clearReconnectionToken`, `reconnect`)

**Behaviour:**
1. Read `SecureStorage.getReconnectionToken()`.
2. If present: attempt `roomSessionController.reconnect(token)` raced
   against a 5 s timeout. On success → exit, reset `reconnectAttempts`.
3. On failure or absent token: backoff per schedule above, then retry
   from step 1 (token may have been cleared mid-flight — re-read each
   loop iteration to honour terminal-leave cleanup). Note: in
   practice mid-game always has a token (preserved on transient
   leaves per Move 1.5 slice F); the no-token path is defensive
   against external clearing (e.g. another tab wiped sessionStorage)
   and exercises the same `joinRoom(true)` recovery Move 1.5 uses.
4. After max attempts (6): clear `reconnectionToken` only, NOT auth
   token. Call `degradeToLobby(message)`.

**Constants moved from `main.ts` to `connection.ts`:**
```
MAX_RECONNECT_ATTEMPTS = 6           (was 10)
RECONNECT_BACKOFF_MS = [250, 500, 1000, 2000, 4000, 8000]
RECONNECT_JITTER_PCT = 0.2
RECONNECT_PER_ATTEMPT_TIMEOUT_MS = 5000
```

`MAX_RECONNECT_ATTEMPTS = 10` (current) does not match the 60 s
window. Down to 6 with the new backoff.

**New tests in `connection.test.ts`:**
- token-present-success on first try → exits with attempt=1
- token-present-success on third try → exits with attempt=3
- token-present-timeout each → 6 attempts then degradation
- no-token → falls through to joinRoom(true) fallback
- tournament-ended → no retry
- concurrent invocation → second call is no-op (epoch lock)

#### Slice B — Silence orphan messages

**Files:**
- `frontend/src/app/room-session-controller.ts` (extend
  `bindRoomMessageHandlers`)
- new tests in `room-session-controller.test.ts` or
  `room-message-handlers.test.ts`

**Behaviour:**

Add two no-op `onMessage` handlers inside `bindRoomMessageHandlers`:
```ts
joinedRoom.onMessage("reconnected", () => {
  deps.log("Reconnected ack received from server.");
});
joinedRoom.onMessage("gameEnded", () => {
  // gameEnded is observable via state + gameResult; we ack to silence
  // the @colyseus/sdk warning without duplicating UI changes.
});
```

**Tests:**
- emit "reconnected" via mocked room → handler invoked, log fires
- emit "gameEnded" via mocked room → handler invoked, no UI side-effect

#### Slice C — UX overlay/banner

**Files:**
- `frontend/index.html` (new `<div id="reconnect-banner">`)
- `frontend/src/style.css` (sticky top, discreet, theme-consistent)
- `frontend/src/app/reconnect-banner.ts` (new controller)
- `frontend/src/app/reconnect-banner.test.ts` (new)
- `frontend/src/main.ts` (wire show/hide into reconnect lifecycle)

**States:**

| State | Trigger | Copy (ES) | Action |
|-------|---------|-----------|--------|
| hidden | normal connected | — | display:none |
| recovering | attempt ≥ 1 OR `connecting` > 250 ms | "Reconectando… intento `<n>`/6" | yellow chip |
| degraded | attempts exhausted | "Conexión perdida — volviendo al lobby" | red chip, auto-hide after lobby load |

**Visibility:**

Banner pre-attempt threshold (250 ms in `connecting` without success)
prevents flicker on healthy networks where `client.reconnect` returns
in < 100 ms.

**Tests:**
- shows on attempt=1 after 250 ms
- updates text on attempt=2
- hides on `connected`
- degraded text on attempt > 6 → hides on lobby render

#### Slice D — Heartbeat hardening

**Files:**
- `frontend/src/main.ts` (constants)
- `frontend/src/connection.ts` (no API change; document new defaults)
- `frontend/src/connection.test.ts` (extend timeout test)

**Change:**
```
HEARTBEAT_INTERVAL_MS: 30000 → 5000
HEARTBEAT_TIMEOUT_MS:  180000 → 10000
```

Rationale: silent network drop must be detected within ≤ 15 s so that
≥ 45 s of the 60 s server window remain for retries.

**Server-side check:** `ChiribitoRoom` already responds to `heartbeat`
with `heartbeat_ack` synchronously inside `onMessage` (verify in slice
work; no change expected). Slice is purely client constants + test.

**`onTimeout` behaviour change:** must call
`setConnectionState("disconnected")` before invoking
`attemptReconnect()` so the banner sees a consistent state.

**Tests:**
- heartbeat fires every 5 s
- no-ack within 10 s → onTimeout, state=disconnected, reconnect
  triggered
- ack arrives → no timeout, RTT recorded

#### Slice E — E2E Playwright

**File:**
- `scripts/e2e-browser.ts` (add 5 new steps)

Each new step adds Playwright + CDP control flows. The dev-stack
already runs api-server + game-server + frontend, so all of this
exercises the real binary.

**New steps:**

| # | Name | Mechanism | Pass criteria |
|---|------|-----------|---------------|
| 8 | WS drop mid-game restores seat | CDP `Network.emulateNetworkConditions(offline:true)` for 3 s, then offline:false. Mesa has ≥ 2 seated players. | Banner appears; state intact post-recovery (same `currentSessionId` slot, chips unchanged); zero unhandled console errors |
| 9 | Tab inactive + drop + resume | `page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")))` with `document.hidden=true`; drop network; restore network; restore visibility | Recovery completes within 15 s of visibility restore; banner shown/hidden correctly |
| 10 | Slow network reconnect | CDP `Network.emulateNetworkConditions({downloadThroughput:50_000, uploadThroughput:20_000, latency:500})` | Reconnect completes inside 60 s window; degraded RTT shown |
| 11 | Multiple retries before success | CDP offline ON, wait through 2 attempts (~750 ms with 250+500 backoff), then CDP offline OFF before attempt 3 schedules. Verify via console-log capture that attempts 1 + 2 fired and 3 succeeded. (Playwright's `page.route` does not intercept WebSocket frames; CDP offline toggling is the mechanism used by all WS-drop steps.) | Recovery on attempt 3; banner reflects attempts 1, 2 then disappears on attempt 3 |
| 12 | Long drop > 65 s degrades to lobby | CDP offline for 65 s | After max attempts banner shows degraded text; user lands in lobby; auth token still valid; mesa-list loads |

**Mesa-alive precondition:** all new steps reuse the step 4.5 spawn
of a second seated player so `checkGameEnd` does not dispose the mesa
during the gap.

**Target:** 30 / 30 steps × 3 runs (existing 25 + 5 new).

#### Slice F — Race-condition audit

**Files:**
- `frontend/src/connection.ts` (epoch lock implementation)
- `frontend/src/main.ts` (verify all callers go through the director)
- `frontend/src/connection.test.ts` (race tests)

**Behaviour:**

The `reconnectionDirector` (logical name for the rewritten
`attemptReconnect`) carries a `currentEpoch` counter. Each new request
starts a fresh epoch and captures it locally. Async resolutions check
that their captured epoch is still current before mutating state. A
stale resolution is logged and discarded.

**Tests:**
- two concurrent calls → only first runs; second is no-op
- visibilitychange fires while heartbeat-timeout retry is in flight
  → second invocation is no-op
- stale `joinRoom` resolves after the retry already succeeded → state
  not mutated, no spurious "joined" log

#### Slice G — Docs + memory closeout

**Files:**
- `docs/RECONNECT_FINDINGS.md` (append "Move 2" section)
- `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\project_chiribito.md` (status flip)
- `C:\Users\Usuario\.claude\projects\C--Users-Usuario\memory\MEMORY.md` (refresh hook)

Pure documentation. No code or tests.

### File inventory (full list)

**New:**
- `docs/superpowers/specs/2026-05-18-chiribito-move-2-design.md` (this file)
- `frontend/src/app/reconnect-banner.ts`
- `frontend/src/app/reconnect-banner.test.ts`

**Modified:**
- `frontend/src/connection.ts`
- `frontend/src/connection.test.ts`
- `frontend/src/main.ts`
- `frontend/src/app/room-session-controller.ts`
- `frontend/src/app/room-session-controller.test.ts` (if exists; else add)
- `frontend/index.html`
- `frontend/src/style.css`
- `scripts/e2e-browser.ts`
- `docs/RECONNECT_FINDINGS.md`

**Server-side:** zero changes.

### Acceptance criteria

| Gate | Target |
|------|--------|
| Vitest | ≥ 195 / 0 fail (currently 182) |
| Playwright E2E | 30 / 30 × 3 runs |
| `npm run build` (root + frontend + api-server) | clean |
| `npm run lint` | clean |
| Console warnings during full reconnect cycle | 0 |
| Move 1.5 steps 5 / 6 / 7 still pass | yes |

### Manual smoke (before declaring Move 2 closed)

In a single dev-stack run:

1. `npm run dev:stack`
2. Open two browser tabs as two users; both seated in same mesa.
3. In tab 1, DevTools → Network → Offline for 5 s, then back online.
4. Confirm: banner showed, recovery succeeded, hole cards still
   visible, turn restored if applicable.
5. Repeat with tab 1 backgrounded during the drop.
6. Repeat with throttled network ("Slow 3G").
7. Repeat with > 65 s offline → user degrades to lobby cleanly,
   re-enters mesa list, can rejoin same mesa from there.

## Open follow-ups (NOT in Move 2)

- Single-player mesa auto-dispose on `onLeave` → tracked separately;
  recommended pre-public-beta.
- Ephemeral broadcast replay buffer (server-side; would let UI animate
  missed `communityCardRevealed` events post-recovery). Defer until UX
  feedback says state-only resync is insufficient.
- Server window extension (60 s → 90 / 120 s) only if real mobile-drop
  metrics justify it after Move 2 lands.
- Telemetry: structured analytics event on every reconnect attempt
  + outcome. Useful for the metrics that would inform the previous
  bullet. Deferred.

## Why this design is correct

- Reuses Move 1.5 primitives exactly (`reconnect(token)`,
  `mountJoinedRoom`, `applyPostJoinSetup`). No duplication.
- Stays inside server's 60 s window — no engine/manager change.
- Surfaces failures honestly (degradation to lobby with auth intact),
  not silently (the current `clearAuthToken` ejection).
- Adds zero new abstractions: no state-machine library, no observable
  framework. Just a tighter loop, an epoch counter and a banner.
- Test-first per slice; nothing relies on cross-slice trust.
- E2E exercises real browser + real WS + real CDP throttling, matching
  Chiribito's existing E2E-first discipline.
