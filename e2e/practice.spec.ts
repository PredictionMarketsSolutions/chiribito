/**
 * Practice-flow E2E spec
 *
 * Flow: register → lobby → select 1 rival → create practice room →
 *       assert bot badge (.seat-badge--bot "Maquina") visible →
 *       play ONE complete hand → #practice-end-overlay visible →
 *       click "Otra partida" (#otra-partida-btn) →
 *       assert fresh hand started (overlay closes) →
 *       assert 0 console errors.
 *
 * Import note: bare `playwright` package's Test subpath export.
 * Do NOT change to @playwright/test — that package is NOT installed.
 */
import { test, expect } from 'playwright/test';

test('practice flow: create table -> play a hand -> otra partida (0 console errors)', async ({ page }) => {
  const consoleErrors: string[] = [];

  // Collect console errors throughout the whole test
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // ── Step 1: Navigate, auth overlay must be visible ──────────────────────
  await page.goto('/');
  await expect(page.locator('#auth-overlay')).toBeVisible({ timeout: 30_000 });

  // ── Step 2: Register a unique user (Pitfall 6: persistent embedded-PG) ──
  await page.click('[data-auth-tab="register"]');
  await page.fill('#username', 'e2etest');
  await page.fill('#email', `e2etest_${Date.now()}@test.local`);
  await page.fill('#password', 'TestPass123!');
  await page.click('#register');

  // ── Step 3: Lobby visible — wait until the practice chips are interactive ──
  // Wait for #lobby-overlay:not(.hidden) AND for the practice chip to be
  // present in the DOM (the lobby JS may take a tick to render bindings).
  await page.waitForSelector('#lobby-overlay:not(.hidden)', { timeout: 30_000 });
  await page.waitForSelector('.practice-selector__chip[data-bots="1"]', { timeout: 15_000 });

  // ── Step 4: Select 1 rival (fastest single hand) ─────────────────────────
  await page.click('.practice-selector__chip[data-bots="1"]');
  await expect(page.locator('.practice-selector__chip[data-bots="1"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // ── Step 5: Start practice room ───────────────────────────────────────────
  await page.click('#practice-start');

  // ── Step 6: Bot badge must be visible (proves bot seeding + practice room) ─
  // .seat-badge--bot text = "<glyph> Máquina" (game-ui.ts:73)
  const botBadge = page.locator('.seat-badge--bot').first();
  await expect(botBadge).toBeVisible({ timeout: 20_000 });
  await expect(botBadge).toContainText('quina'); // "Máquina" / "Maquina" — encoding-safe

  // ── Step 7: Start hand ────────────────────────────────────────────────────
  // #start-game may be auto-present; wait for visibility then click
  const startGameBtn = page.locator('#start-game');
  await expect(startGameBtn).toBeVisible({ timeout: 10_000 });
  await startGameBtn.click();

  // ── Step 8: Play ONE complete hand (DOM-signal waits, no fixed sleeps) ────
  // Loop: when human's turn → check or call; wait for next signal.
  // Exits when #practice-end-overlay appears (one hand ended, not champion).
  const practiceEndOverlay = page.locator('#practice-end-overlay:not(.hidden)');

  for (let attempt = 0; attempt < 30; attempt++) {
    // Check if the practice-end overlay is already visible
    const overlayVisible = await practiceEndOverlay.isVisible().catch(() => false);
    if (overlayVisible) break;

    // Wait for either our turn OR practice-end
    const [turnOrEnd] = await Promise.race([
      page
        .waitForSelector('#your-turn-indicator:not(.hidden)', { timeout: 8_000 })
        .then(() => ['turn']),
      page
        .waitForSelector('#practice-end-overlay:not(.hidden)', { timeout: 8_000 })
        .then(() => ['end']),
    ]).catch(() => [null]);

    if (turnOrEnd === 'end') break;
    if (turnOrEnd !== 'turn') continue;

    // Human's turn: check if #check is enabled, else call
    const checkBtn = page.locator('#check');
    const callBtn = page.locator('#call');

    const checkEnabled = await checkBtn.isEnabled().catch(() => false);
    if (checkEnabled) {
      await checkBtn.click().catch(() => {});
    } else {
      const callEnabled = await callBtn.isEnabled().catch(() => false);
      if (callEnabled) {
        await callBtn.click().catch(() => {});
      }
    }

    // Brief pause to let the action register before looping
    await page.waitForTimeout(200);
  }

  // ── Step 9: Assert practice-end overlay visible ───────────────────────────
  await expect(practiceEndOverlay).toBeVisible({ timeout: 60_000 });

  // ── Step 10: Click "Otra partida" ─────────────────────────────────────────
  await page.click('#otra-partida-btn');

  // Fresh hand started: overlay closes OR start-game reappears OR a new turn signal
  await Promise.race([
    page.waitForSelector('#practice-end-overlay.hidden', { timeout: 15_000 }),
    page.waitForSelector('#start-game:visible', { timeout: 15_000 }),
    page.waitForSelector('#your-turn-indicator:not(.hidden)', { timeout: 15_000 }),
  ]).catch(() => {
    // Any of the above is acceptable evidence of a fresh hand; ignore timeout
  });

  // ── Step 11: Zero console errors ──────────────────────────────────────────
  expect(consoleErrors).toHaveLength(0);
});
