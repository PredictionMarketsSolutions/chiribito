# Mesa recovery — runtime findings

Origin session: 2026-05-18 (Move 1 — partial → Move 1.5 closed).

Status: **Move 1.5 LANDED.** Mesa recovery via Colyseus `reconnectionToken`
is live for both reload-hydration and post-login paths. The pre-Move-1.5
joinById approach is retained as a fallback. The Move 5 SESSION_EXISTS
gate is untouched and continues to protect multi-tab semantics.

## Summary

The reload-in-mesa flow ("user refreshes page while in a mesa, must return
to that mesa") was thought to be a client-only fix during the static
read-only audit. The first runtime test with `scripts/e2e-browser.ts`
proved the assumption incomplete: the server's session-exclusivity gate
rejects the recovery `joinById` because the previous seat is being held by
`room.allowReconnection(client, 60)` — the very mechanism we depend on for
the seat to still be there.

Move 1.5 replaces the recovery primitive with `client.reconnect(token)`,
which bypasses `onAuth` entirely and resolves the held `allowReconnection`
promise directly. `joinById` and `openLobby` remain as ordered fallbacks.

## The failure cycle (pre-Move-1.5)

```
1. User in mesa.
2. F5 → JS state wiped, WebSocket dropped.
3. Server: ChiribitoRoom.onLeave fires with a non-consented code.
4. lifecycleManager.handleLeave → room.allowReconnection(client, 60)
   → SessionManager keeps the userId tracked, seat held for 60 s.
5. Client hydration: recoverMesaOrOpenLobby() runs.
6. Recovery calls client.joinById(roomId, { auth, name, forceReplace: false }).
7. Server: ChiribitoRoom.onAuth → AuthenticationService.authenticate
   (src/rooms/managers/AuthenticationService.ts:114-116):

      if ((hasActiveSession || isPending) && !options?.forceReplace) {
        throw new Error("SESSION_EXISTS");
      }

   hasActiveSession is true (old session being held), forceReplace is false.
   → SESSION_EXISTS thrown.
8. Client receives a Colyseus 4002 close. The current
   roomSessionController.joinRoom swallows the error inside handleJoinError
   and resolves without joining. Without the isJoined guard in
   recoverMesaOrOpenLobby, the user would land in a dead state (no overlay
   visible). With the guard, the user falls back to the lobby cleanly and
   lastRoomId is cleared.
```

## Why `joinById` is the wrong primitive for reload-recovery

`joinById` re-enters via matchmaker → `onAuth` → `onJoin`. Session exclusivity
sees the held seat and rejects. This is correct behavior for "a different
connection trying to join" but the wrong semantic for "the same user reloading
their own page".

## Why Colyseus `reconnectionToken` is the right primitive (Move 1.5)

After a successful `client.joinById` (or `joinOrCreate` / `create`), the
returned `Room` object exposes `reconnectionToken`. This is the explicit
handshake Colyseus designed for exactly this case:

- Persist `room.reconnectionToken` to client storage on join.
- On reload, call `client.reconnect(reconnectionToken)` instead of
  `client.joinById(roomId)`.
- `reconnect` resolves the same `allowReconnection` promise on the server,
  restoring the seat without going through `onAuth`'s session-exclusivity
  gate.

This:

- Uses a framework primitive that is already wired (`allowReconnection` is
  already configured with 60 s).
- Avoids touching session exclusivity, which must stay intact for Move 5
  (2 tabs same user — the second tab should be rejected politely).
- Is the same primitive Move 2 (reconnect mid-game after a WS drop) will use,
  so the foundation pays for itself.

## What landed — Move 1 (first session, 2026-05-18 — partial)

| File | Change |
|---|---|
| `frontend/src/auth/recover-or-lobby.ts` | NEW. Centralized "rejoin mesa OR open lobby" decision. Includes `isJoined` guard to prevent the dead state when `joinRoom` resolves without actually joining. |
| `frontend/src/auth/recover-or-lobby.test.ts` | NEW. 6 unit tests (no id / empty / valid+success / valid+fail / trim / resolved-without-joining). |
| `frontend/src/auth-helpers.ts` | Added `getUsernameFromInput()` — non-throwing read of `#username`. The existing throwing `getFormValues()` is kept untouched for `registerFlow`. |
| `frontend/src/main.ts` | Hydration IIFE uses `recoverMesaOrOpenLobby`. Auth overlay pre-hidden to avoid the auth flash. `roomSessionController.getFormValues` rewired to the non-throwing read. |
| `scripts/e2e-browser.ts` | Strict reload step + new "login restores mesa" step + new "stale lastRoomId → lobby fallback" step. Helpers `waitForMesaVisible` + `captureOverlayState`. |

E2E after Move 1: **16/22** Playwright (steps 5/6 × 3 runs failing as
canaries that Move 1.5 was designed to turn green; step 7 already passing).

## What landed — Move 1.5 (this session, 2026-05-18 — closed)

| Slice | Commit | What |
|---|---|---|
| A | `8333eb9` | `SecureStorage.saveReconnectionToken` / `get` / `clear`. `clearAllTokens` now drops it too. Stored in sessionStorage (matches Colyseus seat lifecycle; does not leak across tabs so Move 5 stays intact). +3 vitests, 1 extended. |
| B | `07e1d0d` | `applyPostJoinSetup` reads `joinedRoom.reconnectionToken` and persists it via a new dep. Synchronous so the join → immediate-disconnect window cannot drop the token. +2 vitests. |
| C | `d9313ae` | `recoverMesaOrOpenLobby` tries `reconnect(token)` first; on failure clears the token and falls through to the existing `joinById` path, then to lobby. Reconnect dep stubbed in `main.ts` this commit so existing behaviour is preserved; slice D wires the real call. +4 vitests. |
| D | `701bf7b` | `roomSessionController` exposes `reconnect(token)` alongside `joinRoom`. Both share a new `mountJoinedRoom` helper running `applyPostJoinSetup` + scene arm + heartbeat + all message subscriptions, so a reconnected room receives every game event a fresh join would. `main.ts` replaces the slice-C stub. **Step 5 (reload restores mesa) flips from FAIL to PASS 3/3 runs.** |
| E (refactor) | `7fddf9e` | `loginFlow.onAuthSuccess` becomes the single post-auth callback. `runAutoRejoin` + `joinRoom` deps gone (killed the race where `openLobby()` cleared `lastRoomId` before the rejoin could read it). `main.ts` hoists `buildRecoveryDeps` to module scope so hydration and login share identical deps. `login-auto-rejoin.ts` and its 9 tests deleted. |
| E (e2e) | `6c95907` | E2E step 4.5 spawns a second seated player in the same mesa so `engine.tryGameEnd → checkGameEnd` does not crown the lone player champion and dispose the room while the recovery flow is running. Step 7 also clears `chiri_reconnection_token` so its stale-lastRoomId assertion exercises the joinById-fallback path it advertises. **Step 6 (login restores mesa) flips from FAIL to PASS 3/3 runs.** Total: 25/25. |
| F | `5aa1a56` | `clearReconnectionToken` wired in `handleRoomLeave` (4011 / 4013 / tournament-ended terminal paths), `clearAuthSession`, and `openLobbyFlow.onEnterLobby`. Transient disconnect path explicitly preserves the token (regression-tested). +3 vitests. |
| G | (this commit) | Docs + memory closeout. |

E2E after Move 1.5: **25/25 steps PASS × 3 runs**, including:
- Step 5 (Reload restores mesa) ✓ × 3
- Step 6 (Login restores mesa from stored lastRoomId) ✓ × 3
- Step 7 (Stale lastRoomId falls back to lobby cleanly) ✓ × 3 (now exercises pure joinById-fallback)
- New step 4.5 (Spawn second player) ✓ × 3

Vitest: **182 / 182** (down from 189 mid-flight because 9 deleted
`login-auto-rejoin` tests were replaced by reconnect-aware coverage in
`recover-or-lobby` + `auth-flows` + `secure-storage` + `room-leave-handler`
+ `auth-session` + `join-room-lifecycle`).

## Known follow-up — single-player mesa auto-dispose

`src/rooms/game/GameEngine.ts:440` `checkGameEnd()` declares any single
chip-holder as tournament champion and disposes the room. This fires on
**every** `onLeave` (server hooks `tryGameEnd()` immediately after
`handleLeave` returns), so a single-player mesa is killed by ANY reload
or disconnect — even when the reconnection then succeeds and brings the
player back. The mesa survives only because the second player keeps
chips above 1.

The Move 1.5 E2E mitigates this with a second seated player so the
recovery primitive can be validated end-to-end. But in real production a
single-player creating a mesa to wait for friends and then refreshing
the page would still lose that mesa.

**Recommended follow-up Move:** gate `checkGameEnd` on "at least one
betting round has completed" (or any similar tournament-started signal)
so pre-game refreshes don't auto-crown anyone. This is server-side and
out of scope for Move 1.5 (no engine changes per the working rules) but
worth picking up before public beta.

## Open warning (low priority)

`@colyseus/sdk: onMessage() not registered for type 'reconnected'` and
`'gameEnded'` warnings appear on the client after each successful
reconnect. The server's `PlayerLifecycleManager.replaceSession` sends a
`reconnected` payload and `GameEngine.broadcaster` sends `gameEnded` that
the client has no handler for. Harmless — purely a log warning — but
worth wiring proper handlers (or no-op handlers if the data is
duplicated by state sync) in a polish pass.

## Key files (Move 1 + Move 1.5)

- `frontend/src/auth/recover-or-lobby.ts` — recovery decision tree
  (reconnect → joinById → lobby).
- `frontend/src/security/secure-storage.ts` — reconnect token helpers,
  `clearAllTokens` aggregation.
- `frontend/src/app/room-session-controller.ts` — `joinRoom` and
  `reconnect` methods, shared `mountJoinedRoom` for event wiring.
- `frontend/src/app/join-room-lifecycle.ts` — `applyPostJoinSetup`
  persists the token returned by Colyseus.
- `frontend/src/app/auth-flows.ts` — single `onAuthSuccess` callback,
  no separate runAutoRejoin.
- `frontend/src/main.ts` — hoisted `buildRecoveryDeps`, hydration IIFE
  and `login()` share it; `onEnterLobby` clears the reconnect token.
- `frontend/src/app/room-leave-handler.ts` — token hygiene on terminal
  leaves, kept on transient leaves.
- `frontend/src/app/auth-session.ts` — `clearAuthSession` drops the
  token alongside access/refresh tokens.
- `src/rooms/ChiribitoRoom.ts:43` — `reconnectionTimeoutSeconds = 60`
  (server side, unchanged).
- `src/rooms/managers/AuthenticationService.ts:111-116` — SESSION_EXISTS
  gate (unchanged; reconnect path bypasses it).
- `scripts/e2e-browser.ts` — steps 5 / 6 / 7 are the canaries; step 4.5
  keeps the mesa alive for them.

## Out of scope (do NOT touch in Move 1.5)

- Session exclusivity / SESSION_EXISTS semantics (Move 5).
- Multi-tab lifecycle (Move 5).
- Full logout flow (Move 3).
- Engine, managers, schemas, glossary, protocol.
- Single-player auto-dispose fix (separate follow-up Move).
- Render / Docker deploy configuration.

## What landed — Move 2 (2026-05-18 — closed)

Move 2 turns mid-game WebSocket drops into a production-grade,
client-side recovery that lives entirely inside the existing 60s
server seat window. Server-side `reconnectionTimeoutSeconds = 60`
stays intact per user direction.

| Slice | Commit | What |
|---|---|---|
| A.1 | `cb2ef08` | Red test pinning `reconnect(token)` priority in `attemptReconnect`. Extends `AttemptReconnectDeps` with `getReconnectionToken / clearReconnectionToken / reconnect / degradeToLobby`. |
| A.2 | `c4d31f7` | Green: `attemptReconnect` calls `roomSessionController.reconnect(token)` BEFORE `joinRoom(true)`. Failure clears the stale token and falls through. Max-attempts now degrades to lobby keeping the auth token alive (was `clearAuthToken`, a hard ejection). |
| A.3 | `5bdf165` | Calibrated backoff `[250, 500, 1000, 2000, 4000, 8000]ms` +-20% jitter, capped at 6 attempts. Cumulative ~16s without per-attempt timeout, ~46s worst case. Replaces exponential `1/2/4/8/16/32s` (63s, blew the 60s window). |
| A.4 | `49408c3` | Per-attempt 5s timeout via `raceWithTimeout`. `disposeOrphanRoom` dep covers the case where `client.reconnect()` resolves AFTER the timeout fired — Colyseus has no cancel. Wrapped `joinRoom` fallback in try/catch so the director loop can keep retrying. |
| A.5 | `fb30b07` | New `reconnect-director.ts`: epoch-locked idempotent loop, single canonical entry-point for the three trigger sources (`onLeave` transient, heartbeat `onTimeout`, `visibilitychange` resume). Owns terminal degradation; emits `onAttemptChange({attempt, max, phase})`. |
| A.6 | `8a44396` | `main.ts.attemptReconnect()` now delegates to the director. Removes unused `MAX_RECONNECT_ATTEMPTS` import; indicator tooltip sources max from `DEFAULT_MAX_RECONNECT_ATTEMPTS`. |
| B | `35d094e` | `bindOrphanMessageHandlers` silences SDK warnings for `reconnected` and `gameEnded`. |
| C.1 | `ac33d77` | Banner DOM + CSS. Sticky top, pulsing dot, `--hidden` start, `--degraded` red variant. `pointer-events:none` so it cannot swallow clicks. |
| C.2 | `bcc6623` | `createReconnectBanner` controller. Debounces first-show for 250ms — reconnect that succeeds inside the window NEVER shows the banner (the discreet-UX constraint). Live attempt updates once visible; instant hide on idle. |
| C.3 | `13781a0` | Banner wired into director's `onAttemptChange`. |
| D | `2cb6b85` | Heartbeat tightened: `30s/180s -> 5s/10s`. `onTimeout` now triggers reconnect (previously popped idle modal, which conflated user-idle with WS-silent). Fixed a pre-existing bug in `startClientHeartbeat`: interval was clearing the timeout every tick, so `onTimeout` could never fire when `intervalMs < timeoutMs` (always). Now the interval skips its send while a previous heartbeat is still pending; the timeout (or ack) nulls `heartbeatTimeoutId` before the next send. |
| E.1 | `66b489f` | CDP-driven helpers: `setOffline / emulateSlowNetwork / waitBannerVisible / waitBannerHidden`. |
| E.2 | `2a428f1` | E2E Step 8 (3s offline mid-game restores seat). Adds `window.__chiri.currentSessionId` E2E hook. |
| E.3 | `a5c462e` | E2E Step 9 (tab inactive + drop + resume). |
| E.4-6 | `ca9982d` | E2E Steps 10, 11, 12 (slow network, multi-retry, long-drop -> lobby). |
| F | `620d511` | Director race-condition coverage: fresh-loop-after-finish (epoch advances) + visibility-during-retry (no parallel loops). |
| E fix | `6e312c9` | Step 9 page.evaluate string-form (tsx __name workaround). Step 11 reads #log DOM textContent (main.ts log() does not hit console). |
| G | (this commit) | Docs + memory closeout. |

### Final validation

- Vitest unit: **199 / 199 PASS** (baseline 182 + Move 2 additions).
- Playwright E2E: **40 / 40 PASS x 3 runs** including the 25 Move 1.5 steps and the 5 new Move 2 steps.
- `npx tsc --noEmit` errors: 12 (all pre-existing strict-null + Timeout-type; baseline was 14, so Move 2 reduces TS noise).
- Console warnings during a full reconnect cycle: zero "onMessage() not registered" warnings (slice B). `ERR_INTERNET_DISCONNECTED` lines from CDP offline are expected and benign.

### Out of scope (do NOT touch in Move 2)

- Server-side `reconnectionTimeoutSeconds = 60` (user-locked; revisit only if real mobile-drop metrics justify it post-Move 2).
- Engine, managers, schemas, glossary, protocol.
- `SESSION_EXISTS` gate / multi-tab (Move 5).
- Auth flow, token refresh, logout (Move 3).
- Single-player mesa auto-dispose (separate follow-up).
- Ephemeral broadcast replay (state-only resync deemed sufficient; UI animations missed during the gap are forfeit by design).

### Recommended follow-ups

- `idle-timeout-modal` DOM/CSS is currently unreferenced after Slice D rewired `onTimeout`. Either delete it or wire it to a user-activity timer in a future cleanup Move — not Move 2.
- Single-player mesa auto-dispose (`GameEngine.checkGameEnd` crowning the lone chip-holder on any onLeave) remains the same recommended follow-up identified in Move 1.5. Real production single-player mesas waiting for friends still lose the mesa on refresh / disconnect.
- If real mobile-drop telemetry shows > 60s drops are common, evaluate extending `reconnectionTimeoutSeconds` in a separate Move (would touch `ChiribitoRoom.ts:43` and `PlayerLifecycleManager.ts:33` only).

### How to validate Move 2 manually

Boot the local stack and exercise the reconnect flow end-to-end. All commands run from the repo root (`chiri-app/`).

**1) Start the dev-stack** (terminal A):

```
npm run dev:stack
```

Wait for "READY" lines in the log. The script boots embedded-postgres on :5432, api-server on :3000, game-server on :2567 and Vite on :5173. If port 5432 is held by an orphan from a previous crashed run, kill it: `taskkill /F /PID <pid>` after locating it via `netstat -ano | grep 5432`.

**2) Open two browsers** at `http://localhost:5173`, register two users, both seated in the same mesa (the second player keeps the mesa alive across the recovery path — single-player auto-dispose is a known follow-up).

**3) Discreet-UX check (fast reconnect)**

In browser A: DevTools → Network → Offline for **1 second** then back online. The banner must **NOT** appear (debounce 250 ms; recovery completes inside the window). RTT chip stays green.

**4) Visible-recovery check (slow reconnect)**

Offline for **5 seconds**, then back online. The yellow banner "Reconectando… intento N/6" must appear, then hide within ~10 seconds of restoring the network. Mesa, seats, hole cards and turn ownership must all survive the gap with no flicker, no Pixi remount, no full re-render.

**5) Tab-inactive check**

Switch away from the browser tab (or use DevTools Application → Background services to simulate). Drop the network. Bring the tab back to the foreground. The director's `visibilitychange` branch must trigger recovery; banner appears + hides cleanly.

**6) Mobile-style switch (slow network)**

DevTools → Network → "Slow 3G" preset + Offline blip 2s + back. Banner should appear under degraded throughput and recovery must still complete inside the 60 s server window.

**7) Long-drop degradation**

Offline for **>65 s**, then back online. Banner switches to red "Conexión perdida — volviendo al lobby". User lands in the lobby; the auth token in `sessionStorage` is **still valid** (user is NOT logged out). User can rejoin the same mesa from the lobby list if it still exists.

**8) Move 1.5 regression check** (must still work)

Refresh the page mid-game → mesa restores (step 5 path). Manually clear `sessionStorage` `chiri_auth_token`, log in again → mesa restores (step 6 path). Set a stale `chiri_last_room_id` in localStorage and refresh → falls back to lobby cleanly (step 7 path).

### Automated validation

```
# Unit suites
cd frontend && npm test              # expect 199/199 vitest
cd ..       && npm test              # expect 475/475 jest (game server)
cd api-server && npm test            # expect 27/27 jest

# Build sanity
cd ..       && npm run build         # tsc + api-server build clean

# Full Playwright E2E (requires dev-stack running)
npx tsx scripts/e2e-browser.ts       # expect 40/40 steps x 3 runs
```

If any of the above misses its target, halt before deploying — investigate root cause first.
