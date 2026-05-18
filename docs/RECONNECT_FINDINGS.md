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
