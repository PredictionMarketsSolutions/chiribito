/**
 * Real-browser E2E test against the live dev-stack.
 *
 * Drives Chromium via Playwright through the actual UI:
 *   register → lobby → create mesa → table mounts → reload → 2 tabs → logout
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

  // 5 reload during table session — must auto-restore the session and NOT
  // bounce back to auth. Wait for a settled state (exactly one of auth/lobby
  // visible) before evaluating, since hydration is async.
  logStep("Reload page during session");
  await page.reload({ waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      () => {
        const a = document.getElementById("auth-overlay");
        const l = document.getElementById("lobby-overlay");
        if (!a || !l) return false;
        const authHidden = a.classList.contains("hidden");
        const lobbyHidden = l.classList.contains("hidden");
        // Settled when one is visible and the other is hidden (XOR)
        return authHidden !== lobbyHidden;
      },
      { timeout: 8000 },
    );
  } catch {
    /* timeout — capture the unsettled state below */
  }
  const afterReload = await page.evaluate(() => {
    const auth = document.getElementById("auth-overlay");
    const lobby = document.getElementById("lobby-overlay");
    return {
      authHidden: auth?.classList.contains("hidden") ?? false,
      authClass: auth?.className ?? null,
      lobbyHidden: lobby?.classList.contains("hidden") ?? false,
      lobbyClass: lobby?.className ?? null,
      roomStatus: document.getElementById("room-status")?.textContent ?? null,
      hasAccessToken: !!sessionStorage.getItem("chiri_auth_token"),
      hasRefreshToken: !!localStorage.getItem("chiri_refresh_token"),
      lastLogLines: (document.getElementById("log")?.textContent ?? "").split("\n").slice(-6).join(" || "),
    };
  });
  const hasAnyToken = afterReload.hasAccessToken || afterReload.hasRefreshToken;
  if (!hasAnyToken) {
    failStep(`tokens vanished after reload. state=${JSON.stringify(afterReload)}`);
    await shot(page, `${scenarioName}_05_FAIL_no_token`);
  } else if (!afterReload.authHidden) {
    failStep(`tokens present but auth shown (no hydration). state=${JSON.stringify(afterReload)}`);
    await shot(page, `${scenarioName}_05_FAIL_no_hydration`);
  } else {
    pass(
      `session survived (access=${afterReload.hasAccessToken} refresh=${afterReload.hasRefreshToken} lobbyHidden=${afterReload.lobbyHidden})`,
      await shot(page, `${scenarioName}_05_reload_ok`),
    );
  }

  await page.close();
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
