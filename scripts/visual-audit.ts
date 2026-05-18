/**
 * Visual audit — Move 2 build snapshot for the upcoming Visual/Mobile Polish move.
 *
 * Drives Chromium across three viewports (desktop / tablet / mobile portrait)
 * and captures key flow states + CSS measurements for honest evaluation.
 *
 * Run: npx tsx scripts/visual-audit.ts
 * Output: .dev-stack/visual-audit/ (gitignored under .dev-stack/)
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");
const OUT = join(ROOT, ".dev-stack", "visual-audit");
const FRONTEND_URL = process.env.FRONTEND_URL_E2E ?? "http://localhost:5173";

type Viewport = { name: string; width: number; height: number; mobile: boolean };
const VIEWPORTS: Viewport[] = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "tablet-768",   width: 768,  height: 1024, mobile: false },
  { name: "mobile-375",   width: 375,  height: 812,  mobile: true },
];

mkdirSync(OUT, { recursive: true });

function uniqueUser() {
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `vau_${stamp}`,
    email: `vau_${stamp}@test.local`,
    password: "ValidPass123!",
  };
}

async function shot(page: Page, viewport: string, step: string, note: string): Promise<void> {
  const file = join(OUT, `${viewport}__${step}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${viewport}/${step} — ${note}`);
}

async function fullShot(page: Page, viewport: string, step: string, note: string): Promise<void> {
  const file = join(OUT, `${viewport}__${step}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${viewport}/${step} (full) — ${note}`);
}

async function measure(page: Page): Promise<Record<string, unknown>> {
  return await page.evaluate(`(function(){
    var root = getComputedStyle(document.documentElement);
    var token = function(name) { return root.getPropertyValue(name).trim(); };
    var buttons = Array.prototype.slice.call(document.querySelectorAll("button"))
      .filter(function(b) { return b.offsetParent !== null; })
      .slice(0, 30)
      .map(function(b) {
        var r = b.getBoundingClientRect();
        return { id: b.id || "", w: Math.round(r.width), h: Math.round(r.height), text: (b.textContent || "").trim().slice(0, 28) };
      });
    var cards = Array.prototype.slice.call(document.querySelectorAll("img[src*='card'], img[src*='Card']")).slice(0, 8).map(function(c) {
      var r = c.getBoundingClientRect();
      return { src: (c.src || "").split("/").pop(), w: Math.round(r.width), h: Math.round(r.height), natural: c.naturalWidth + "x" + c.naturalHeight };
    });
    return {
      tokens: {
        felt:   token("--felt-main"),
        gold:   token("--gold"),
        cardBg: token("--card-back"),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        font:   getComputedStyle(document.body).fontFamily
      },
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      buttons: buttons,
      cards: cards,
      scrollH: document.documentElement.scrollHeight,
      bodyH: document.body.scrollHeight
    };
  })()`);
}

async function fillRegister(page: Page, u: ReturnType<typeof uniqueUser>) {
  await page.click("[data-auth-tab='register']");
  await page.fill("#username", u.username);
  await page.fill("#email", u.email);
  await page.fill("#password", u.password);
}

async function fillLogin(page: Page, u: { email: string; password: string }) {
  await page.click("[data-auth-tab='login']");
  await page.fill("#email", u.email);
  await page.fill("#password", u.password);
}

async function waitForOverlay(page: Page, id: string, visible: boolean, timeoutMs = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isHidden = await page.evaluate(`(function(){var el = document.getElementById("${id}"); return el ? el.classList.contains("hidden") : true;})()`) as boolean;
    if (visible && !isHidden) return true;
    if (!visible && isHidden) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function waitForInitialAuthState(page: Page) {
  await page.waitForFunction(`(function(){
    var a = document.getElementById("auth-overlay");
    var l = document.getElementById("lobby-overlay");
    if (!a || !l) return false;
    return !a.classList.contains("hidden") && l.classList.contains("hidden");
  })()`, undefined, { timeout: 10000 });
  // Give the layout a moment to settle visually
  await new Promise((r) => setTimeout(r, 600));
}

async function spawnPlayer2(browser: Browser, mesaCode: string): Promise<BrowserContext> {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p2 = await ctx.newPage();
  await p2.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(p2);
  const u2 = uniqueUser();
  await fillRegister(p2, u2);
  await p2.click("#register");
  const lobbyShown = await waitForOverlay(p2, "lobby-overlay", true, 12000);
  if (!lobbyShown) throw new Error("player2 never reached lobby");
  await p2.evaluate(`(function(){var d = document.querySelector("details.lobby-hero__advanced"); if (d) d.open = true;})()`);
  await p2.fill("#join-room-id", mesaCode);
  await p2.click("#join-by-id");
  await waitForOverlay(p2, "lobby-overlay", false, 12000);
  return ctx;
}

async function runFlow(browser: Browser, viewport: Viewport): Promise<Record<string, unknown>> {
  console.log(`\n🖼  ${viewport.name} (${viewport.width}x${viewport.height})`);
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
  });
  const page = await ctx.newPage();
  const findings: Record<string, unknown> = {};

  // 1. Fresh storage → auth (login tab default)
  await page.goto(FRONTEND_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForInitialAuthState(page);
  await shot(page, viewport.name, "01_auth_login", "auth scene — login tab default");

  // 2. Register tab
  await page.click("[data-auth-tab='register']");
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, viewport.name, "02_auth_register", "auth scene — register tab active");
  findings.authMetrics = await measure(page);

  // 3. Register → lobby
  const u = uniqueUser();
  await page.fill("#username", u.username);
  await page.fill("#email", u.email);
  await page.fill("#password", u.password);
  await page.click("#register");
  if (!(await waitForOverlay(page, "lobby-overlay", true, 12000))) {
    console.log("  ❌ lobby never appeared");
    await shot(page, viewport.name, "03_FAIL_no_lobby", "lobby never appeared after register");
    await ctx.close();
    return findings;
  }
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, viewport.name, "03_lobby_empty", "lobby — right after register");
  findings.lobbyMetrics = await measure(page);

  // 3b. Lobby — advanced "Unirme por código" section opened
  await page.evaluate(`(function(){var d = document.querySelector("details.lobby-hero__advanced"); if (d) d.open = true;})()`);
  await new Promise((r) => setTimeout(r, 300));
  await shot(page, viewport.name, "03b_lobby_advanced", "lobby — advanced details opened");

  // 4. Create mesa
  await page.fill("#table-name", `Mesa ${u.username}`);
  await page.click("#create-table");
  if (!(await waitForOverlay(page, "lobby-overlay", false, 12000))) {
    console.log("  ❌ mesa never opened");
    await ctx.close();
    return findings;
  }
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, viewport.name, "04_mesa_alone", "mesa — solo creator seated");

  // 5. Spawn player 2 (best-effort — keeps mesa alive during reconnect)
  const roomCode = await page.evaluate(`(document.getElementById("room-status")||{}).textContent || ""`) as string;
  const code = roomCode.trim().split(/\s+/).pop() ?? "";
  console.log(`  → roomCode for player2: "${code}"`);
  let p2Ctx: BrowserContext | null = null;
  if (code && code.length > 3) {
    try {
      p2Ctx = await spawnPlayer2(browser, code);
      await new Promise((r) => setTimeout(r, 2000));
      await shot(page, viewport.name, "05_mesa_2players", "mesa — 2 seated players");
    } catch (err) {
      console.log(`  ⚠ player2 spawn failed: ${String(err).slice(0, 100)}`);
    }
  }

  findings.mesaMetrics = await measure(page);

  // 6. Action panel + winners ranking (sidebar bottom)
  await shot(page, viewport.name, "06_mesa_full", "mesa — full view (sidebar + felt + actions)");

  // 7. Reconnect banner visible (offline 2.5s)
  await ctx.setOffline(true);
  await new Promise((r) => setTimeout(r, 2500));
  await shot(page, viewport.name, "07_reconnect_banner", "banner visible — 2.5s into offline");
  await ctx.setOffline(false);
  await new Promise((r) => setTimeout(r, 6000));
  await shot(page, viewport.name, "08_after_recovery", "post-recovery — banner hidden");

  // 8. Degraded banner (long offline 65s)
  // — too slow for the audit run, skip; we already see degraded state in E2E suite
  //   and degraded copy is rendered identically (only class differs).

  // 9. Full-page scroll capture (mobile + tablet)
  if (viewport.mobile || viewport.width < 1024) {
    await fullShot(page, viewport.name, "09_fullpage_scroll", "full-page scrollable view");
  }

  // 10. Lobby snapshot post-mesa-close (go back to lobby)
  const backBtn = page.locator("#back-to-auth");
  if (await backBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    // Skip — opens auth scene; not what we want here
  }

  if (p2Ctx) { try { await p2Ctx.close(); } catch { /* ignore */ } }
  await ctx.close();
  return findings;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const allFindings: Record<string, unknown> = {};
  try {
    for (const v of VIEWPORTS) {
      try {
        allFindings[v.name] = await runFlow(browser, v);
      } catch (err) {
        console.log(`\n❌ ${v.name} flow crashed: ${String(err).slice(0, 300)}`);
        allFindings[v.name] = { error: String(err).slice(0, 500) };
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(OUT, "measurements.json"), JSON.stringify(allFindings, null, 2));
  console.log(`\n✅ Audit done. Output: ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
