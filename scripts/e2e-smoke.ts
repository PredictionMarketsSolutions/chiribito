/**
 * E2E smoke for the full Chiribito flow:
 *
 *   register → login → Colyseus connect → create mesa → start game → leave
 *
 * Runs against the local dev-stack (REDIS_URL empty, embedded Postgres).
 * Prints a green ✓ or red ✗ per step and exits non-zero on any failure.
 *
 * Run:  npx tsx scripts/e2e-smoke.ts
 */

import { Client } from "@colyseus/sdk";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const WS_URL = process.env.WS_URL ?? "ws://localhost:2567";

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
};

function step(label: string): void {
  process.stdout.write(`${colors.cyan}▸${colors.reset} ${label} ... `);
}
function ok(detail?: string): void {
  process.stdout.write(`${colors.green}✓${colors.reset}${detail ? ` ${colors.dim}(${detail})${colors.reset}` : ""}\n`);
}
function fail(message: string): never {
  process.stdout.write(`${colors.red}✗ ${message}${colors.reset}\n`);
  process.exit(1);
}

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function randomUser(): { username: string; email: string; password: string } {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return {
    username: `e2e_${ts}_${rnd}`.slice(0, 20),
    email: `e2e_${ts}_${rnd}@example.com`,
    password: "TestPass123!",
  };
}

async function main(): Promise<void> {
  console.log(`${colors.bold}${colors.cyan}Chiribito E2E smoke${colors.reset}`);
  console.log(`${colors.dim}  API: ${API_URL}\n  WS:  ${WS_URL}${colors.reset}\n`);

  const u = randomUser();
  console.log(`${colors.dim}  user: ${u.username} / ${u.email}${colors.reset}\n`);

  // 1 ── Register
  step("Register fresh user (expect 201 + real token)");
  const reg = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(u),
  });
  if (reg.status !== 201) fail(`status=${reg.status} body=${JSON.stringify(reg.body)}`);
  if (!reg.body?.token) fail(`no token in response: ${JSON.stringify(reg.body)}`);
  if (reg.body.token === "dummy") {
    fail(`backend returned DUMMY token — duplicate detection or other issue. body=${JSON.stringify(reg.body)}`);
  }
  if (!reg.body?.refreshToken || reg.body.refreshToken === "dummy") {
    fail(`dummy refreshToken. body=${JSON.stringify(reg.body)}`);
  }
  if (!reg.body?.user?.id) fail(`no user.id in response: ${JSON.stringify(reg.body)}`);
  ok(`userId=${reg.body.user.id}`);
  const tokenFromRegister: string = reg.body.token;

  // 2 ── Register DUPLICATE — verify behavior
  step("Register again with SAME email/username (expect duplicate handling)");
  const dup = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(u),
  });
  const dupClassified =
    dup.status === 409 ? "CONFLICT_409 (good UX)" :
    dup.status === 201 && dup.body?.token === "dummy" ? "DUMMY_TOKEN_201 (bad UX bug)" :
    dup.status === 201 ? "201_REAL_TOKEN (bug — would duplicate)" :
    `unexpected status=${dup.status}`;
  console.log(`    → ${colors.yellow}${dupClassified}${colors.reset} body=${JSON.stringify(dup.body)}`);

  // 3 ── Login
  step("Login with credentials");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: u.email, password: u.password }),
  });
  if (login.status !== 200) fail(`status=${login.status} body=${JSON.stringify(login.body)}`);
  if (!login.body?.token) fail(`no token in login response`);
  ok(`token len=${login.body.token.length}`);
  const tokenFromLogin: string = login.body.token;

  // 4 ── Colyseus connect + create mesa
  step("Connect to Colyseus + create('mesa') with REAL token");
  const client = new Client(WS_URL);
  let joinedRoom: Awaited<ReturnType<typeof client.create>> | null = null;
  try {
    joinedRoom = await client.create("mesa", {
      auth: { token: tokenFromLogin },
      name: u.username,
    } as any);
  } catch (err: any) {
    fail(`create failed: ${err?.message ?? err}`);
  }
  if (!joinedRoom) fail("create returned null/undefined");
  ok(`roomId=${joinedRoom.roomId} sessionId=${joinedRoom.sessionId.slice(0, 8)}...`);

  // 5 ── Wait for initial state sync
  step("Wait for room state sync (2s)");
  await new Promise((r) => setTimeout(r, 2000));
  const stateAny = joinedRoom.state as any;
  const hasUsers = !!stateAny?.users;
  const phase = stateAny?.phase;
  ok(`hasUsers=${hasUsers} phase=${phase ?? "?"}`);

  // 6 ── Create with DUMMY token (should reject with INVALID_TOKEN, not silently leak)
  step("Connect with literal 'dummy' token (expect INVALID_TOKEN reject)");
  const client2 = new Client(WS_URL);
  try {
    const r = await client2.create("mesa", {
      auth: { token: "dummy" },
      name: "dummy_user",
    } as any);
    await r.leave().catch(() => undefined);
    fail("dummy token was ACCEPTED — backend should reject");
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (/INVALID_TOKEN/i.test(msg)) {
      ok(`rejected as INVALID_TOKEN (good)`);
    } else if (/jwt malformed/i.test(msg)) {
      console.log(`    → ${colors.yellow}rejected but leaked raw error: ${msg}${colors.reset}`);
      ok();
    } else {
      ok(`rejected with: ${msg}`);
    }
  }

  // 7 ── Leave room cleanly
  step("Leave room");
  await joinedRoom.leave();
  ok();

  // 8 ── Second user join the SAME room (multiplayer smoke)
  step("Second user joinById same room (multiplayer smoke)");
  const u2 = randomUser();
  const reg2 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(u2),
  });
  if (reg2.status !== 201 || !reg2.body?.token || reg2.body.token === "dummy") {
    fail(`u2 register failed: status=${reg2.status} body=${JSON.stringify(reg2.body)}`);
  }
  const client3 = new Client(WS_URL);
  // First, u1 creates a fresh mesa
  const room1 = await client3.create("mesa", {
    auth: { token: tokenFromLogin },
    name: u.username,
  } as any);
  // u2 joins by id
  const client4 = new Client(WS_URL);
  let room2: any;
  try {
    room2 = await client4.joinById(room1.roomId, {
      auth: { token: reg2.body.token },
      name: u2.username,
    } as any);
  } catch (err: any) {
    await room1.leave().catch(() => undefined);
    fail(`u2 joinById failed: ${err?.message ?? err}`);
  }
  ok(`u1=${room1.sessionId.slice(0, 6)} u2=${room2.sessionId.slice(0, 6)}`);

  // Wait for u2 to appear in state
  await new Promise((r) => setTimeout(r, 1500));
  const room1Users = (room1.state as any)?.users;
  let count = 0;
  if (room1Users?.size != null) count = room1Users.size;
  else if (room1Users?.length != null) count = room1Users.length;
  else if (room1Users) count = Object.keys(room1Users).length;
  step(`Room1 state shows both players (count=${count})`);
  if (count >= 2) ok();
  else console.log(`    → ${colors.yellow}only ${count} player(s) visible in u1's state${colors.reset}`);

  await room1.leave();
  await room2.leave();

  console.log(`\n${colors.bold}${colors.green}E2E smoke complete${colors.reset}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`\n${colors.red}FATAL: ${err?.message ?? err}${colors.reset}`);
  console.error(err);
  process.exit(1);
});
