/**
 * Real-browser E2E test against the live dev-stack.
 *
 * Drives Chromium via Playwright through the actual UI:
 *   register → lobby → create mesa → table mounts → reload restores mesa
 *   → login (post token wipe) restores mesa from stored lastRoomId
 *   → stale lastRoomId falls back to lobby cleanly
 *
 * Capture per step: screenshot, console errors, network failures, key DOM/state.
 *
 * Run:  npx tsx scripts/e2e-browser.ts
 * Out:  .dev-stack/e2e-shots/ (gitignored via .dev-stack/)
 */

import { chromium, type Browser, type BrowserContext, type Page, type ConsoleMessage } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");
const SHOTS = join(ROOT, ".dev-stack", "e2e-shots");
const FRONTEND_URL = process.env.FRONTEND_URL_E2E ?? "http://localhost:5173";

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

type StepResult = { name: string; ok: boolean; detail?: string; shot?: string };
const results: StepResult[] = [];
const consoleErrors: { step: string; type: string; text: string }[] = [];
const networkFailures: { step: string; url: string; status: number }[] = [];
let currentStep = "init";

function logStep(name: string): void {
  currentStep = name;
  process.stdout.write(`${colors.cyan}▸${colors.reset} ${name} ... `);
}

function pass(detail?: string, shot?: string): void {
  results.push({ name: currentStep, ok: true, detail, shot });
  process.stdout.write(`${colors.green}✓${colors.reset}${detail ? ` ${colors.dim}(${detail})${colors.reset}` : ""}\n`);
}

function failStep(detail: string): void {
  results.push({ name: currentStep, ok: false, detail });
  process.stdout.write(`${colors.red}✗ ${detail}${colors.reset}\n`);
}

function attachListeners(page: Page, label: string): void {
  page.on("console", (msg: ConsoleMessage) => {
    const txt = msg.text();
    if (msg.type() === "error" || msg.type() === "warning" || txt.includes("[DBG") || txt.includes("[HYDRATE")) {
      consoleErrors.push({ step: `${label}:${currentStep}`, type: msg.type(), text: txt });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ step: `${label}:${currentStep}`, type: "pageerror", text: err.message });
  });
  page.on("response", (resp) => {
    const status = resp.status();
    if (status >= 400) {
      const url = resp.url();
      if (!url.includes("favicon") && !url.includes("/@vite/")) {
        networkFailures.push({ step: `${label}:${currentStep}`, url, status });
      }
    }
  });
}

async function shot(page: Page, name: string): Promise<string> {
  const file = join(SHOTS, `${String(results.length + 1).padStart(2, "0")}_${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

/** Move 2 — CDP-driven network controls for the WS-drop E2E steps. */
async function setOffline(page: Page, offline: boolean): Promise<void> {
  await page.context().setOffline(offline);
}

async function emulateSlowNetwork(page: Page, enable: boolean): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  if (enable) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 500,
      downloadThroughput: 50_000,
      uploadThroughput: 20_000,
    });
  } else {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  }
}

async function waitBannerVisible(page: Page, timeoutMs = 5000): Promise<boolean> {
  return page
    .waitForFunction(
      () => {
        const el = document.getElementById("reconnect-banner");
        return !!el && !el.classList.contains("reconnect-banner--hidden");
      },
      undefined,
      { timeout: timeoutMs }
    )
    .then(() => true, () => false);
}

async function waitBannerHidden(page: Page, timeoutMs = 10000): Promise<boolean> {
  return page
    .waitForFunction(
      () => {
        const el = document.getElementById("reconnect-banner");
        return !!el && el.classList.contains("reconnect-banner--hidden");
      },
      undefined,
      { timeout: timeoutMs }
    )
    .then(() => true, () => false);
}

async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function waitForInitialAuthState(page: Page, timeoutMs = 8000): Promise<void> {
  // Wait for the *fully correct* initial state: auth visible, lobby + tournament
  // overlays hidden. Without this, a still-in-flight hydration from a previous
  // page can leave the lobby visible and intercept clicks on the auth screen.
  await page.waitForFunction(
    () => {
      const auth = document.getElementById("auth-overlay");
      const lobby = document.getElementById("lobby-overlay");
      const tournament = document.getElementById("tournament-result-overlay");
      return !!(
        auth && !auth.classList.contains("hidden") &&
        lobby && lobby.classList.contains("hidden") &&
        tournament && tournament.classList.contains("hidden")
      );
    },
    { timeout: timeoutMs },
  );
}

function uniqueUser(): { username: string; email: string; password: string } {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return {
    username: `bot_${ts}_${rnd}`.slice(0, 20),
    email: `bot_${ts}_${rnd}@e2e.local`,
    password: "TestPass123!",
  };
}

// ----- Test scenarios -----

async function fillRegister(page: Page, u: { username: string; email: string; password: string }): Promise<void> {
  // Switch to "Crear cuenta" tab so register fields are visible
  await page.click("[data-auth-tab='register']");
  await page.fill("#username", u.username);
  await page.fill("#email", u.email);
  await page.fill("#password", u.password);
}

async function fillLogin(page: Page, u: { email: string; password: string }): Promise<void> {
  await page.click("[data-auth-tab='login']");
  await page.fill("#email", u.email);
  await page.fill("#password", u.password);
}

async function waitOverlay(page: Page, id: string, visible: boolean, timeoutMs = 8000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isHidden = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return true;
      return el.classList.contains("hidden");
    }, id);
    if (visible && !isHidden) return true;
    if (!visible && isHidden) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/**
 * Wait until the UI is in the "mesa visible" state: auth overlay hidden,
 * lobby overlay hidden, and room-status indicates a real mesa (not the
 * empty "sin mesa" / "not joined" sentinels).
 */
async function waitForMesaVisible(page: Page, timeoutMs = 10000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const a = document.getElementById("auth-overlay");
        const l = document.getElementById("lobby-overlay");
        const status = document.getElementById("room-status")?.textContent ?? "";
        if (!a || !l) return false;
        const authHidden = a.classList.contains("hidden");
        const lobbyHidden = l.classList.contains("hidden");
        const trimmed = status.trim();
        const inMesa = !!trimmed && trimmed !== "sin mesa" && trimmed !== "not joined";
        return authHidden && lobbyHidden && inMesa;
      },
      { timeout: timeoutMs },
    );
    return true;
  } catch {
    return false;
  }
}

async function captureOverlayState(page: Page) {
  return page.evaluate(() => ({
    authHidden: document.getElementById("auth-overlay")?.classList.contains("hidden") ?? false,
    lobbyHidden: document.getElementById("lobby-overlay")?.classList.contains("hidden") ?? false,
    roomStatus: document.getElementById("room-status")?.textContent ?? null,
    hasAccessToken: !!sessionStorage.getItem("chiri_auth_token"),
    hasRefreshToken: !!localStorage.getItem("chiri_refresh_token"),
    lastRoomId: localStorage.getItem("chiri_last_room_id"),
    lastLogLines: (document.getElementById("log")?.textContent ?? "").split("\n").slice(-8).join(" || "),
  }));
}

async function runScenario(ctx: BrowserContext, scenarioName: string): Promise<void> {
  console.log(`\n${colors.bold}${colors.yellow}── ${scenarioName} ──${colors.reset}`);
  const page = await ctx.newPage();
  attachListeners(page, scenarioName);

  // 1 navigate fresh
  logStep("Navigate + clear storage");
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(page);
  pass("auth shown", await shot(page, `${scenarioName}_01_auth`));

  // 2 register
  const u = uniqueUser();
  logStep(`Register ${u.username}`);
  await fillRegister(page, u);
  await page.click("#register");
  const lobbyShown = await waitOverlay(page, "lobby-overlay", true, 10000);
  if (!lobbyShown) {
    failStep("lobby never appeared after register");
    await shot(page, `${scenarioName}_02_FAIL_lobby_not_shown`);
    await page.close();
    return;
  }
  // also confirm auth hidden
  const authHidden = await waitOverlay(page, "auth-overlay", false, 2000);
  if (!authHidden) failStep("auth-overlay still visible after register");
  else pass("lobby visible + auth hidden", await shot(page, `${scenarioName}_02_lobby`));

  // 3 duplicate register attempt — in a *separate browser context* (otherwise
  // it would share localStorage with the original session and our new startup
  // hydration would correctly send it to the lobby, not show register).
  logStep("Duplicate register (must show error toast)");
  const dupCtx = await ctx.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  const dupPage = await dupCtx.newPage();
  attachListeners(dupPage, scenarioName + "_dup");
  await dupPage.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(dupPage);
  await fillRegister(dupPage, u);
  await dupPage.click("#register");
  await new Promise((r) => setTimeout(r, 1500));
  const dupAuthMsg = await dupPage.evaluate(() => {
    const el = document.getElementById("auth-message");
    return el ? { text: el.textContent ?? "", visible: el.classList.contains("visible"), type: el.className } : null;
  });
  const dupLobbyShown = await dupPage.evaluate(() => {
    const el = document.getElementById("lobby-overlay");
    return el ? !el.classList.contains("hidden") : false;
  });
  if (dupLobbyShown) {
    failStep(`duplicate register WRONGLY entered lobby. authMsg=${JSON.stringify(dupAuthMsg)}`);
  } else if (!dupAuthMsg?.visible || !/ya existe|existe ya|already exists|duplicate/i.test(dupAuthMsg.text)) {
    failStep(`duplicate register did NOT show a clear error. authMsg=${JSON.stringify(dupAuthMsg)}`);
    await shot(dupPage, `${scenarioName}_03_FAIL_dup_no_error`);
  } else {
    pass(`error shown: "${dupAuthMsg.text}"`, await shot(dupPage, `${scenarioName}_03_dup_error`));
  }
  await dupCtx.close();

  // 4 create mesa
  logStep("Create mesa (must enter table)");
  await page.fill("#table-name", `Mesa de ${u.username}`);
  await page.click("#create-table");
  const lobbyHidden = await waitOverlay(page, "lobby-overlay", false, 10000);
  if (!lobbyHidden) {
    failStep("lobby never hidden after create-table");
    await shot(page, `${scenarioName}_04_FAIL_lobby_stuck`);
    await page.close();
    return;
  }
  // Check table is visible (the #app/#table is always in DOM, but should not be covered)
  const tableVisible = await page.evaluate(() => {
    const t = document.querySelector("#table .table-surface");
    const auth = document.getElementById("auth-overlay");
    const lobby = document.getElementById("lobby-overlay");
    return {
      tableExists: !!t,
      authHidden: auth?.classList.contains("hidden") ?? false,
      lobbyHidden: lobby?.classList.contains("hidden") ?? false,
      roomStatus: document.getElementById("room-status")?.textContent ?? null,
    };
  });
  if (!tableVisible.tableExists) failStep("table-surface not in DOM");
  else if (!tableVisible.authHidden || !tableVisible.lobbyHidden) {
    failStep(`overlays not hidden: ${JSON.stringify(tableVisible)}`);
    await shot(page, `${scenarioName}_04_FAIL_overlays_visible`);
  } else if (tableVisible.roomStatus === "sin mesa" || tableVisible.roomStatus === "not joined") {
    failStep(`room-status still "${tableVisible.roomStatus}" — join didn't complete`);
    await shot(page, `${scenarioName}_04_FAIL_room_status`);
  } else {
    pass(`entered table room=${tableVisible.roomStatus}`, await shot(page, `${scenarioName}_04_table`));
  }

  // 4.5 spawn a second player who joins the SAME mesa via joinById. Without
  //     this, the engine's checkGameEnd considers a single player with chips
  //     as the tournament champion and disposes the room on any onLeave —
  //     including the brief onLeave that fires during a reload+reconnect.
  //     That race kills the mesa between step 5's reconnect-success and
  //     step 6's login-recovery, masking what Move 1.5 is actually
  //     validating (client recovery primitive). A second seated player
  //     keeps tryGameEnd from crowning anyone, so the mesa survives the
  //     full reload/login cycle.
  logStep("Spawn second player to keep mesa alive across recovery");
  const realRoomId = (tableVisible.roomStatus ?? "").trim();
  const player2 = uniqueUser();
  let player2Ctx: BrowserContext | null = null;
  let player2KeptAlive = false;
  try {
    player2Ctx = await ctx.browser()!.newContext({ viewport: { width: 1024, height: 768 } });
    const p2 = await player2Ctx.newPage();
    attachListeners(p2, `${scenarioName}_p2`);
    await p2.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
    await waitForInitialAuthState(p2);
    await fillRegister(p2, player2);
    await p2.click("#register");
    const p2LobbyShown = await waitOverlay(p2, "lobby-overlay", true, 10000);
    if (!p2LobbyShown) {
      failStep("player2 never reached lobby — cannot keep mesa alive");
    } else {
      // #join-room-id lives inside a <details> that is closed by default —
      // open it programmatically so the input becomes visible to fill().
      await p2.evaluate(() => {
        const details = document.querySelector<HTMLDetailsElement>("details.lobby-hero__advanced");
        if (details) details.open = true;
      });
      await p2.fill("#join-room-id", realRoomId);
      await p2.click("#join-by-id");
      const p2InMesa = await waitForMesaVisible(p2, 10000);
      if (!p2InMesa) {
        const p2State = await captureOverlayState(p2);
        failStep(`player2 did NOT enter mesa ${realRoomId}. state=${JSON.stringify(p2State)}`);
      } else {
        player2KeptAlive = true;
        pass(`player2 (${player2.username}) seated in mesa ${realRoomId}`);
      }
    }
  } catch (err: any) {
    failStep(`player2 setup error: ${err?.message ?? err}`);
  }

  // 5 reload during table session — must auto-restore the MESA (not just hide
  // auth). The previous lenient assertion (any state with auth hidden counted
  // as ok) hid the real bug: hydration was bouncing the user to a lobby where
  // onEnterLobby() cleared lastRoomId, making the mesa unreachable.
  logStep("Reload restores mesa (not lobby)");
  const lastRoomIdBeforeReload = await page.evaluate(() =>
    localStorage.getItem("chiri_last_room_id"),
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  if (!(await waitForMesaVisible(page))) {
    const state = await captureOverlayState(page);
    failStep(`mesa NOT restored after reload. state=${JSON.stringify(state)}`);
    await shot(page, `${scenarioName}_05_FAIL_no_mesa_restore`);
  } else {
    const after = await captureOverlayState(page);
    if (after.lastRoomId !== lastRoomIdBeforeReload) {
      failStep(
        `lastRoomId changed across reload: before=${lastRoomIdBeforeReload} after=${after.lastRoomId}`,
      );
      await shot(page, `${scenarioName}_05_FAIL_lastRoomId_changed`);
    } else {
      pass(
        `mesa restored (room=${after.roomStatus})`,
        await shot(page, `${scenarioName}_05_reload_mesa`),
      );
    }
  }

  // 6 login restores mesa from previous session — Fix B coverage.
  //   Simulate "tokens expired but lastRoomId preserved": clear access +
  //   refresh tokens (keep lastRoomId), reload (auth screen appears since no
  //   token to hydrate), login as same user. Without the fix, openLobby() runs
  //   first and onEnterLobby() clears lastRoomId before runAutoRejoin reads
  //   it, so the user lands in the lobby instead of their mesa. With the fix,
  //   the post-login decision is centralized and reads lastRoomId BEFORE any
  //   lobby transition.
  logStep("Login restores mesa from stored lastRoomId");
  await page.evaluate(() => {
    sessionStorage.removeItem("chiri_auth_token");
    sessionStorage.removeItem("chiri_token_expiry");
    localStorage.removeItem("chiri_refresh_token");
    // keep chiri_last_room_id intentionally
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(page);
  await fillLogin(page, { email: u.email, password: u.password });
  await page.click("#login");
  if (!(await waitForMesaVisible(page))) {
    const state = await captureOverlayState(page);
    failStep(`mesa NOT restored after login. state=${JSON.stringify(state)}`);
    await shot(page, `${scenarioName}_06_FAIL_no_mesa_after_login`);
  } else {
    pass(`mesa restored after login`, await shot(page, `${scenarioName}_06_login_mesa`));
  }

  // 8 Mid-game WebSocket drop must restore the seat via the reconnect
  //   director without taking the user out of the mesa. The mesa still has
  //   player2 seated so checkGameEnd does not crown a champion during the
  //   ~3s drop (single-player auto-dispose is a known follow-up).
  logStep("Mid-game WS drop restores seat (3s offline)");
  {
    const sidBefore = await page.evaluate(() => (window as any).__chiri?.currentSessionId ?? null);
    await setOffline(page, true);
    await new Promise((r) => setTimeout(r, 3000));
    const bannerShown = await waitBannerVisible(page, 6000);
    if (!bannerShown) failStep("banner never appeared during offline");
    await setOffline(page, false);
    const bannerHidden = await waitBannerHidden(page, 15000);
    if (!bannerHidden) failStep("banner never hid after coming back online");
    const tableStill = await page.evaluate(() => {
      const t = document.querySelector("#table .table-surface") as HTMLElement | null;
      return !!t && t.offsetWidth > 0;
    });
    const sidAfter = await page.evaluate(() => (window as any).__chiri?.currentSessionId ?? null);
    if (tableStill && bannerShown && bannerHidden) {
      pass(
        sidAfter && sidAfter !== sidBefore
          ? `seat restored (new sid ${String(sidAfter).slice(0, 6)}…)`
          : "seat restored (sid unchanged)",
        await shot(page, `${scenarioName}_08_ws_drop`)
      );
    } else {
      failStep(
        `mesa lost: tableStill=${tableStill} bannerShown=${bannerShown} bannerHidden=${bannerHidden}`
      );
    }
  }

  // 9 Tab inactive + drop + resume restores the mesa via the
  //   global-lifecycle visibilitychange handler which fans into the same
  //   director.requestReconnect path used by step 8. Heartbeat was paused
  //   while hidden; on resume it restarts and the director recovers.
  //
  //   Note: we pass the evaluate body as a string instead of a closure
  //   because tsx wraps nested function literals with `__name(...)` which
  //   is undefined in the page context.
  logStep("Tab inactive + drop + resume restores mesa");
  {
    await page.evaluate(
      `Object.defineProperty(document, "hidden", { configurable: true, get: function () { return true; } });
       document.dispatchEvent(new Event("visibilitychange"));`
    );
    await setOffline(page, true);
    await new Promise((r) => setTimeout(r, 4000));
    await setOffline(page, false);
    await page.evaluate(
      `Object.defineProperty(document, "hidden", { configurable: true, get: function () { return false; } });
       document.dispatchEvent(new Event("visibilitychange"));`
    );
    const recovered = await waitBannerHidden(page, 20000);
    const tableStill = await page.evaluate(() => {
      const t = document.querySelector("#table .table-surface") as HTMLElement | null;
      return !!t && t.offsetWidth > 0;
    });
    if (recovered && tableStill) {
      pass("recovered after tab-inactive drop", await shot(page, `${scenarioName}_09_tab_inactive`));
    } else {
      failStep(`tab-inactive recovery FAILED: recovered=${recovered} tableStill=${tableStill}`);
    }
  }

  // 10 Slow network recovery must still complete inside the 60s server seat
  //    window. Emulates mobile 3G-grade conditions (50 kB/s, 500 ms latency)
  //    plus a 2s offline blip. Director should retry via reconnect(token)
  //    and succeed without falling all the way through to degradeToLobby.
  logStep("Slow network reconnect stays inside server window");
  {
    await emulateSlowNetwork(page, true);
    await setOffline(page, true);
    await new Promise((r) => setTimeout(r, 2000));
    await setOffline(page, false);
    const hidden = await waitBannerHidden(page, 30000);
    await emulateSlowNetwork(page, false);
    const tableStill = await page.evaluate(() => {
      const t = document.querySelector("#table .table-surface") as HTMLElement | null;
      return !!t && t.offsetWidth > 0;
    });
    if (hidden && tableStill) {
      pass("recovery on slow network", await shot(page, `${scenarioName}_10_slow`));
    } else {
      failStep(`slow-network recovery FAILED: hidden=${hidden} tableStill=${tableStill}`);
    }
  }

  // 11 Multiple-retry path. Offline window long enough to force >=2 attempts
  //     to fail at the WS-open stage, then come back online and let a later
  //     attempt succeed. Verified by scraping the in-page #log textarea
  //     (main.ts log() writes there, not to console) for "Reconnect attempt
  //     N/" lines emitted by attemptReconnect.
  logStep("Multiple retries before reconnect success");
  {
    // Read raw textContent and do the regex match in Node-land — embedding
    // a regex literal inside page.evaluate's string body confuses the
    // implicit `return (...)` wrapper Playwright builds.
    const ATTEMPT_RX = /Reconnect attempt \d+\//g;
    const beforeText: string = await page.evaluate(
      `document.getElementById("log")?.textContent ?? ""`
    );
    const beforeAttempts = (beforeText.match(ATTEMPT_RX) ?? []).length;
    await setOffline(page, true);
    await new Promise((r) => setTimeout(r, 4000));
    await setOffline(page, false);
    const hidden = await waitBannerHidden(page, 20000);
    const afterText: string = await page.evaluate(
      `document.getElementById("log")?.textContent ?? ""`
    );
    const newAttempts = ((afterText.match(ATTEMPT_RX) ?? []).length) - beforeAttempts;
    if (hidden && newAttempts >= 2) {
      pass(
        `recovered after ${newAttempts} attempts logged in this step`,
        await shot(page, `${scenarioName}_11_multi`)
      );
    } else {
      failStep(
        `multi-retry FAILED: hidden=${hidden} newAttempts=${newAttempts} (before=${beforeAttempts})`
      );
    }
  }

  // 12 Long drop > 65s exhausts all attempts inside the 60s server window.
  //     Director must transition to degraded state, clearReconnectionToken
  //     + degradeToLobby, and leave the auth token intact so the user can
  //     re-enter the lobby and rejoin manually.
  logStep("Long drop > 65s degrades to lobby with auth intact");
  {
    await setOffline(page, true);
    await new Promise((r) => setTimeout(r, 65_000));
    await setOffline(page, false);
    const lobbyShown = await page.waitForFunction(
      () => {
        const l = document.getElementById("lobby-overlay");
        return !!l && !l.classList.contains("hidden");
      },
      undefined,
      { timeout: 30000 }
    ).then(() => true, () => false);
    const stillAuth = await page.evaluate(() => !!sessionStorage.getItem("chiri_auth_token"));
    if (lobbyShown && stillAuth) {
      pass("graceful degradation to lobby with auth", await shot(page, `${scenarioName}_12_long_drop`));
    } else {
      failStep(`long-drop degradation FAILED: lobbyShown=${lobbyShown} stillAuth=${stillAuth}`);
    }
  }

  // 7 stale lastRoomId must NOT trap the user — fall back to lobby cleanly
  //   and clear the stale id so subsequent reloads behave normally. Tests the
  //   robustness of the new recovery path: if joinRoom rejects, recover.ts
  //   must clearLastRoomId and openLobby.
  //
  //   Move 1.5: also clear the reconnection token so this step exercises the
  //   pure joinById-fallback path. Otherwise the token from the real (still
  //   alive, thanks to player2) mesa would reconnect us back into the mesa
  //   and step 7 would assert the wrong path.
  logStep("Stale lastRoomId falls back to lobby cleanly");
  await page.evaluate(() => {
    sessionStorage.removeItem("chiri_reconnection_token");
    localStorage.setItem("chiri_last_room_id", "stale-nonexistent-room-id-xyz");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      () => {
        const a = document.getElementById("auth-overlay");
        const l = document.getElementById("lobby-overlay");
        if (!a || !l) return false;
        return a.classList.contains("hidden") && !l.classList.contains("hidden");
      },
      { timeout: 10000 },
    );
    const after = await captureOverlayState(page);
    if (after.lastRoomId === "stale-nonexistent-room-id-xyz") {
      failStep(`stale lastRoomId NOT cleared on fallback. still=${after.lastRoomId}`);
      await shot(page, `${scenarioName}_07_FAIL_stale_not_cleared`);
    } else {
      pass(
        `lobby fallback + stale id cleared (now=${after.lastRoomId ?? "null"})`,
        await shot(page, `${scenarioName}_07_stale_fallback`),
      );
    }
  } catch {
    const state = await captureOverlayState(page);
    failStep(`stale lastRoomId did NOT fall back to lobby. state=${JSON.stringify(state)}`);
    await shot(page, `${scenarioName}_07_FAIL_no_fallback`);
  }

  await page.close();
  if (player2Ctx) {
    try { await player2Ctx.close(); } catch { /* ignore */ }
  }
  if (player2KeptAlive) {
    process.stdout.write(`${colors.dim}  (player2 ${player2.username} cleanup ok)${colors.reset}\n`);
  }
}

async function runDuplicateLoginErrorTest(ctx: BrowserContext): Promise<void> {
  console.log(`\n${colors.bold}${colors.yellow}── Invalid login feedback ──${colors.reset}`);
  const page = await ctx.newPage();
  attachListeners(page, "invalid_login");
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await clearStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(page);

  logStep("Login with WRONG credentials (real wrong, not too-short)");
  // Password must pass client-side validation (>=8 chars) so the request
  // actually reaches the server and we observe its "invalid credentials" path.
  await fillLogin(page, { email: "nobody@e2e.local", password: "WrongPass123!" });
  await page.click("#login");
  await new Promise((r) => setTimeout(r, 1500));
  const msg = await page.evaluate(() => {
    const el = document.getElementById("auth-message");
    return el ? { text: el.textContent ?? "", visible: el.classList.contains("visible"), classes: el.className } : null;
  });
  if (!msg?.visible || !msg.text.trim()) {
    failStep(`no visible error after bad login. msg=${JSON.stringify(msg)}`);
    await shot(page, "X_invalid_login_FAIL_no_msg");
  } else {
    pass(`error shown: "${msg.text}"`, await shot(page, "X_invalid_login_msg"));
  }
  await page.close();
}

// ----- Main -----

async function main(): Promise<void> {
  console.log(`${colors.bold}${colors.cyan}Chiribito browser E2E${colors.reset}`);
  console.log(`${colors.dim}  URL:    ${FRONTEND_URL}\n  Shots:  ${SHOTS}${colors.reset}`);
  mkdirSync(SHOTS, { recursive: true });

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    // Run 3 consecutive happy-path scenarios + 1 invalid-login test
    // Use a fresh BrowserContext per scenario so storage (localStorage +
    // cookies) is fully isolated and hydration from a previous run cannot leak.
    for (const name of ["Run1", "Run2", "Run3"] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        await runScenario(ctx, name);
      } finally {
        await ctx.close();
      }
    }
    const ctxLogin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await runDuplicateLoginErrorTest(ctxLogin);
    } finally {
      await ctxLogin.close();
    }
  } finally {
    if (browser) await browser.close();
  }

  // Summary
  console.log(`\n${colors.bold}── Summary ──${colors.reset}`);
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`Steps:    ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.dim}${failed} failed${colors.reset}`);
  console.log(`Console:  ${consoleErrors.length} error/warn entries`);
  console.log(`Network:  ${networkFailures.length} HTTP 4xx/5xx`);

  if (failed > 0) {
    console.log(`\n${colors.bold}${colors.red}FAILED steps:${colors.reset}`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ✗ ${r.name} — ${r.detail}`));
  }
  if (consoleErrors.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}Console issues:${colors.reset}`);
    consoleErrors.slice(0, 20).forEach((e) => console.log(`  [${e.step}] ${e.type}: ${e.text.slice(0, 200)}`));
    if (consoleErrors.length > 20) console.log(`  ... and ${consoleErrors.length - 20} more`);
  }
  if (networkFailures.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}Network failures:${colors.reset}`);
    networkFailures.slice(0, 20).forEach((n) => console.log(`  [${n.step}] ${n.status} ${n.url}`));
  }

  // Dump JSON for record
  writeFileSync(
    join(SHOTS, "_results.json"),
    JSON.stringify({ results, consoleErrors, networkFailures }, null, 2),
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
