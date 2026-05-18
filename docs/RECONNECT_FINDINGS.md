# Mesa recovery — runtime findings

Origin session: 2026-05-18 (Move 1 — partial).

Status: foundation landed; Colyseus `reconnectionToken` path pending (Move 1.5).

## Summary

The reload-in-mesa flow ("user refreshes page while in a mesa, must return to
that mesa") was thought to be a client-only fix during the static read-only
audit. The first runtime test with `scripts/e2e-browser.ts` proved the
assumption incomplete: the server's session-exclusivity gate rejects the
recovery `joinById` because the previous seat is being held by
`room.allowReconnection(client, 60)` — the very mechanism we depend on for
the seat to still be there.

## The failure cycle

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

## What landed this session

| File | Change |
|---|---|
| `frontend/src/auth/recover-or-lobby.ts` | NEW. Centralized "rejoin mesa OR open lobby" decision. Includes `isJoined` guard to prevent the dead state when `joinRoom` resolves without actually joining. |
| `frontend/src/auth/recover-or-lobby.test.ts` | NEW. 6 unit tests (no id / empty / valid+success / valid+fail / trim / resolved-without-joining). |
| `frontend/src/auth-helpers.ts` | Added `getUsernameFromInput()` — non-throwing read of `#username`. The existing throwing `getFormValues()` is kept untouched for `registerFlow`. |
| `frontend/src/main.ts` | Hydration IIFE uses `recoverMesaOrOpenLobby`. Auth overlay pre-hidden to avoid the auth flash. `roomSessionController.getFormValues` rewired to the non-throwing read. |
| `scripts/e2e-browser.ts` | Strict reload step + new "login restores mesa" step + new "stale lastRoomId → lobby fallback" step. Helpers `waitForMesaVisible` + `captureOverlayState`. |

Tests: **180 / 180 vitest** + **16 / 22 Playwright** (the 6 failures are
step 5 × 3 runs + step 6 × 3 runs — the canary scenarios that Move 1.5
will turn green; step 7 (stale lastRoomId fallback) already passes).

## What is pending for Move 1.5 — reconnectionToken foundation

1. **Persist `reconnectionToken` on join.** Inside `applyPostJoinSetup`
   (or a small wrapper around it), save `joinedRoom.reconnectionToken` to
   `SecureStorage` under a new key (e.g. `chiri_reconnection_token`).
2. **Prefer `client.reconnect(token)` on recovery.** Extend
   `recoverMesaOrOpenLobby` (or add a parallel branch inside
   `roomSessionController.joinRoom`) so that, when a reconnection token is
   present, we call `client.reconnect(token)` first. Fall through to the
   existing `joinById` (then lobby) on failure.
3. **Wire login into the same helper (Fix B).** The login flow still has the
   `openLobby` → `onEnterLobby` → `clearLastRoomId` race. Once the helper is
   `reconnect`-aware, replace the `onAuthSuccess` + `runAutoRejoin` callbacks
   in `main.ts` with a single call to the helper, and delete the now-redundant
   `frontend/src/auth/login-auto-rejoin.ts` + its tests.
4. **Token hygiene.** Clear `chiri_reconnection_token` on logout (Move 3 work)
   and on token-invalidated events. Audit the existing `clearAllTokens()`
   path.

Expected E2E outcome post-Move-1.5:

- Step 5 (Reload restores mesa) → PASS
- Step 6 (Login restores mesa from stored lastRoomId) → PASS
- Step 7 (Stale lastRoomId falls back to lobby cleanly) → PASS (already)
- All 22 steps × 3 runs green.

## Key files to read first when resuming

- `frontend/src/auth/recover-or-lobby.ts` — the helper to extend.
- `frontend/src/app/room-session-controller.ts:184-212` — where the join
  calls live (`joinById` / `create` / `joinOrCreate`). `client.reconnect(token)`
  will be a sibling branch in this block.
- `frontend/src/app/join-room-lifecycle.ts` — `applyPostJoinSetup` (where to
  add `saveReconnectionToken`).
- `frontend/src/security/secure-storage.ts` — add `saveReconnectionToken` /
  `getReconnectionToken` / `clearReconnectionToken` (mirror the `lastRoomId`
  helpers).
- `src/rooms/ChiribitoRoom.ts:43` — `reconnectionTimeoutSeconds = 60` (server
  side, no change in Move 1.5).
- `src/rooms/managers/AuthenticationService.ts:111-116` — the SESSION_EXISTS
  gate (do NOT change in Move 1.5; the reconnect path bypasses it because
  `client.reconnect` does not re-run `onAuth`).
- `scripts/e2e-browser.ts` — steps 5 and 6 are the canary tests that should
  turn green when Move 1.5 lands.

## Out of scope (do NOT touch in Move 1.5)

- Session exclusivity / SESSION_EXISTS semantics (Move 5).
- Multi-tab lifecycle (Move 5).
- Full logout flow (Move 3).
- Engine, managers, schemas, glossary, protocol.
- Render / Docker deploy configuration.
