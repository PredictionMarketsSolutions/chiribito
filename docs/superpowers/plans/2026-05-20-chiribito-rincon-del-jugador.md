# El Rincón del Jugador (Slice 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a soul-first player profile ("El Rincón del Jugador") as a new overlay scene inside the vanilla-TS game client, backed by one minimal API change, with deterministic generated identity and an honest data model.

**Architecture:** New self-contained module `frontend/src/app/rincon/` (pure generators → data layer → DOM-builder components → scene controller), styled by a new scoped `rincon.css` linked from `index.html`. One API change widens `GET /api/users/me`'s `select` to expose stats columns that already exist. No DB migration. The game table / felt / gameplay / `style.css` are NOT touched.

**Tech Stack:** Frontend = TypeScript + Vite + Vitest (`happy-dom`), vanilla DOM (no framework). API = Express + TypeORM + Jest. Spec: `docs/superpowers/specs/2026-05-20-chiribito-rincon-del-jugador-design.md`.

---

## Key codebase facts (verified — do not re-discover)

- **No client `user` object exists.** Get the current player via `decodeJWT(SecureStorage.getAccessToken())` → `{ userId: number, username: string }`. `email` is NOT in the access token. Both re-exported from `frontend/src/security` (`index.ts`).
- **`userId` from the decoded JWT is a number** (matches `WinnerRankingEntry.id`).
- **Routes are in `api-server/src/index.ts`** (not `app.ts`). `GET /api/users/me` → `UserController.getProfile` (`api-server/src/controllers/UserController.ts:54`).
- **`User` entity properties are camelCase** (`gamesPlayed`, `gamesWon`, `totalChipsWon`, `lastPlayedAt`, `createdAt`); TypeORM `select: [...]` uses these camelCase names.
- **`total_chips_won` is `bigint`** → arrives as a **string** in JSON. Coerce with `Number()`.
- **CSS is loaded by `<link>` in `frontend/index.html:10`** (`/src/style.css`). No JS CSS imports exist. Add `rincon.css` the same way. **Do NOT edit `style.css`.**
- **No supertest integration tests exist.** API tests instantiate controllers directly and mock `AppDataSource.getRepository` + `req`/`res` (pattern: `api-server/src/__tests__/middleware/auth.test.ts`).
- **No frontend mirror of suits.** Inline `SUIT_CODES = ["O","C","E","B"]` in the new module (mirror of `src/rooms/game/glossary.ts`).
- **`ApiClient` auto-auth is unreliable** (gated on `AuthClient.isAuthenticated()` which the real login path may not set). Send the `Authorization` header explicitly via raw `fetch`, mirroring `winners-ranking.ts`.
- Frontend test cmd: `cd frontend && npx vitest run <file>`. API test cmd: `cd api-server && npx jest <file>`. Frontend type-check: `cd frontend && npx tsc --noEmit`.

## CSS class contract (builders ↔ rincon.css MUST agree)

Scene: `.rincon-scene`(+`.hidden`) `.rincon-scene__bg` `__vignette` `__glow`(`--gold`/`--felt`) `__grain` `__shell` · topbar `.rincon-top` `.rincon-top__back` `.rincon-top__title` · loading `.rincon-loading` · error `.rincon-error`.
Carnet: `.carnet-holder`(+`.tilt`) `.carnet-face` `.carnet-pip`(`.tl`/`.br`) `.carnet-house` `.carnet-hero` `.lacre`(+`data-tone`) `.lacre__mono` `.carnet-name` `.carnet-mote` `.carnet-rango` `.carnet-foot`.
Sections: `.rincon-sec` `.rincon-sec__t` · stats `.statg` `.stat` `.stat__v` `.stat__k` · historia `.hist__real` `.hist__ghosts` `.ghost`(+`.real`) `.hist__soon` · share `.share-quiet` · mesa `.mesa` `.mesa__seat` `.mesa__info` `.mesa__nm` `.mesa__sub`.

---

## File structure

| File | Responsibility |
|---|---|
| `api-server/src/controllers/UserController.ts` (modify) | Widen `getProfile` `select` to expose stats |
| `api-server/src/__tests__/controllers/UserController.test.ts` (create) | Test the widened `/me` response |
| `frontend/src/app/rincon/types.ts` (create) | Shared types |
| `frontend/src/app/rincon/suits.ts` (create) | `SUIT_CODES`, names, suit SVG glyphs |
| `frontend/src/app/rincon/identidad.ts` (create) | Pure deterministic generators + VM compose |
| `frontend/src/app/rincon/identidad.test.ts` (create) | Generator unit tests |
| `frontend/src/app/rincon/data.ts` (create) | `fetchMyRincon`, `fetchPuesto` |
| `frontend/src/app/rincon/data.test.ts` (create) | Data-layer tests (mocked fetch) |
| `frontend/src/app/rincon/components.ts` (create) | DOM builders (Lacre, Carnet, sections) |
| `frontend/src/app/rincon/components.test.ts` (create) | Builder render tests |
| `frontend/src/app/rincon/rincon-scene.ts` (create) | `renderRincon` + states + `openRincon` controller + visibility |
| `frontend/src/app/rincon/rincon-scene.test.ts` (create) | Render/state + visibility tests |
| `frontend/src/app/rincon/rincon.css` (create) | Scoped styles (ported from validated mockup) |
| `frontend/index.html` (modify) | `<link>` css · `#rincon-overlay` container · "Mi Rincón" button |
| `frontend/src/dom-refs.ts` (modify) | Register new refs |
| `frontend/src/main.ts` (modify) | Wire the button → `openRincon` |

---

## Task 1: API — widen `GET /api/users/me`

**Files:**
- Test: `api-server/src/__tests__/controllers/UserController.test.ts` (create)
- Modify: `api-server/src/controllers/UserController.ts:62-63`

- [ ] **Step 1: Write the failing test**

Create `api-server/src/__tests__/controllers/UserController.test.ts`:

```ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../../controllers/UserController';
import { AppDataSource } from '../../config/database';

jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('UserController.getProfile', () => {
  let controller: UserController;
  let mockUserRepository: { findOne: jest.Mock };
  let req: Partial<Request> & { user?: { userId: number } };
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = { findOne: jest.fn() };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    controller = new UserController();
    req = { user: { userId: 7 } };
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  it('selects and returns the player stats columns', async () => {
    const profile = {
      id: 7, username: 'lucia', email: 'l@x.com', createdAt: new Date('2026-03-01T00:00:00Z'),
      gamesPlayed: 142, gamesWon: 38, totalChipsWon: '18420', lastPlayedAt: new Date('2026-05-19T22:00:00Z'),
    };
    mockUserRepository.findOne.mockResolvedValue(profile);

    await controller.getProfile(req as Request, res as Response);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      select: ['id', 'username', 'email', 'createdAt', 'gamesPlayed', 'gamesWon', 'totalChipsWon', 'lastPlayedAt'],
    });
    expect(res.json).toHaveBeenCalledWith(profile);
  });

  it('401s when there is no authenticated user', async () => {
    req.user = undefined;
    await controller.getProfile(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd api-server && npx jest src/__tests__/controllers/UserController.test.ts`
Expected: FAIL — `findOne` called with the old 4-column `select`, not the 8-column one.

- [ ] **Step 3: Make the change**

In `api-server/src/controllers/UserController.ts`, edit the `getProfile` `findOne` call (currently lines 61-64):

```ts
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username', 'email', 'createdAt', 'gamesPlayed', 'gamesWon', 'totalChipsWon', 'lastPlayedAt'],
      });
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd api-server && npx jest src/__tests__/controllers/UserController.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add api-server/src/controllers/UserController.ts api-server/src/__tests__/controllers/UserController.test.ts
git commit -m "feat(api): expose player stats on GET /api/users/me"
```

---

## Task 2: Frontend foundation — types + suits

**Files:**
- Create: `frontend/src/app/rincon/types.ts`
- Create: `frontend/src/app/rincon/suits.ts`
- Test: `frontend/src/app/rincon/suits.test.ts` (created here, extended later)

- [ ] **Step 1: Create the types**

Create `frontend/src/app/rincon/types.ts`:

```ts
export type SuitCode = "O" | "C" | "E" | "B";
export type WaxTone = "oro" | "granate" | "bronce";

export interface Imperfection {
  rotateDeg: number; // -8..+6
  radius: string;    // irregular border-radius
}

/** Shape returned by GET /api/users/me after Task 1, normalized (bigint coerced). */
export interface MeResponse {
  id: number;
  username: string;
  email?: string;
  createdAt: string;
  gamesPlayed: number;
  gamesWon: number;
  totalChipsWon: number;
  lastPlayedAt: string | null;
}

export interface Identidad {
  userId: number;
  username: string;
  suit: SuitCode;
  monograma: string;
  waxTone: WaxTone;
  imperfection: Imperfection;
  mote: string;
  rango: string;
}

export interface RinconViewModel {
  identidad: Identidad;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number | null;
  totalChipsWon: number;
  puesto: number | null;
  socioDesde: string;
  ultimaVez: string;
  isEmpty: boolean;
}
```

- [ ] **Step 2: Write the failing test for suits**

Create `frontend/src/app/rincon/suits.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SUIT_CODES, SUIT_NAMES_ES, suitGlyph } from "./suits";

describe("suits", () => {
  it("has the 4 canonical Spanish suits in canon order", () => {
    expect(SUIT_CODES).toEqual(["O", "C", "E", "B"]);
    expect(SUIT_NAMES_ES.O).toBe("Oros");
    expect(SUIT_NAMES_ES.B).toBe("Bastos");
  });

  it("builds an svg glyph tagged with its suit", () => {
    const g = suitGlyph("E", 16);
    expect(g.getAttribute("data-suit")).toBe("E");
    expect(g.getAttribute("width")).toBe("16");
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `cd frontend && npx vitest run src/app/rincon/suits.test.ts`
Expected: FAIL — `./suits` not found.

- [ ] **Step 4: Implement suits**

Create `frontend/src/app/rincon/suits.ts`:

```ts
import type { SuitCode } from "./types";

// Mirror of src/rooms/game/glossary.ts SUIT_CODES (no frontend mirror exists; keep in sync).
export const SUIT_CODES: SuitCode[] = ["O", "C", "E", "B"];
export const SUIT_NAMES_ES: Record<SuitCode, string> = { O: "Oros", C: "Copas", E: "Espadas", B: "Bastos" };

const SUIT_PATHS: Record<SuitCode, string> = {
  O: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>`,
  C: `<path d="M7 5 H17 L15.3 11 A3.4 3.4 0 0 1 8.7 11 Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 13 V18" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 19 H15.5" stroke="currentColor" stroke-width="1.5"/>`,
  E: `<path d="M12 3 L12 14" stroke="currentColor" stroke-width="1.5"/><path d="M8.5 12.5 L15.5 12.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 14 L12 18.5" stroke="currentColor" stroke-width="1.5"/>`,
  B: `<path d="M8 19 L14.5 9" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/>`,
};

/** Inline gold-line suit glyph (uses currentColor; size in px). */
export function suitGlyph(suit: SuitCode, sizePx = 24): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(sizePx));
  svg.setAttribute("height", String(sizePx));
  svg.setAttribute("fill", "none");
  svg.setAttribute("data-suit", suit);
  svg.innerHTML = SUIT_PATHS[suit];
  return svg;
}
```

- [ ] **Step 5: Run it, verify it passes**

Run: `cd frontend && npx vitest run src/app/rincon/suits.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/rincon/types.ts frontend/src/app/rincon/suits.ts frontend/src/app/rincon/suits.test.ts
git commit -m "feat(rincon): types + Spanish-suit constants and glyphs"
```

---

## Task 3: Frontend — deterministic identity generators

**Files:**
- Create: `frontend/src/app/rincon/identidad.ts`
- Test: `frontend/src/app/rincon/identidad.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/rincon/identidad.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getSuit, getMonograma, getWaxTone, getImperfection,
  getRango, getMote, winRate, formatSocioDesde, formatUltimaVez,
  buildRinconViewModel,
} from "./identidad";
import type { MeResponse } from "./types";

describe("identity generators (deterministic)", () => {
  it("maps userId to a stable suit", () => {
    expect(getSuit(0)).toBe("O");
    expect(getSuit(1)).toBe("C");
    expect(getSuit(2)).toBe("E");
    expect(getSuit(3)).toBe("B");
    expect(getSuit(7)).toBe(getSuit(7));      // stable
    expect(getSuit(7)).toBe("B");             // 7 % 4 = 3 -> B
  });

  it("derives a monogram, with a fallback", () => {
    expect(getMonograma("lucia")).toBe("L");
    expect(getMonograma("  ana")).toBe("A");
    expect(getMonograma("")).toBe("?");
  });

  it("picks a wax tone stably", () => {
    expect(getWaxTone(0)).toBe("oro");
    expect(getWaxTone(7)).toBe(getWaxTone(7));
  });

  it("produces a deterministic imperfection within bounds", () => {
    const a = getImperfection(7);
    expect(a).toEqual(getImperfection(7));
    expect(a.rotateDeg).toBeGreaterThanOrEqual(-8);
    expect(a.rotateDeg).toBeLessThanOrEqual(6);
    expect(a.radius).toMatch(/%/);
  });

  it("maps games_played to the neutral castizo ladder", () => {
    expect(getRango(0)).toBe("Cara nueva");
    expect(getRango(5)).toBe("De paso");
    expect(getRango(20)).toBe("De la parroquia");
    expect(getRango(80)).toBe("Habitual de la Casa");
    expect(getRango(200)).toBe("Veteranía de la Casa");
    expect(getRango(900)).toBe("Leyenda de la Casa");
  });

  it("derives a stable mote that can reference the suit", () => {
    expect(getMote(7, "O")).toBe(getMote(7, "O"));
    expect(typeof getMote(7, "O")).toBe("string");
    expect(getMote(7, "O").length).toBeGreaterThan(0);
  });

  it("computes win rate, null when nothing played", () => {
    expect(winRate(0, 0)).toBeNull();
    expect(winRate(142, 38)).toBe(27);
  });

  it("formats socio-desde and última-vez honestly", () => {
    expect(formatSocioDesde("2026-03-01T00:00:00Z")).toBe("marzo 2026");
    expect(formatSocioDesde("not-a-date")).toBe("—");
    const now = new Date("2026-05-20T12:00:00Z");
    expect(formatUltimaVez(null, now)).toBe("—");
    expect(formatUltimaVez("2026-05-19T20:00:00Z", now)).toBe("anoche");
    expect(formatUltimaVez("2026-05-17T12:00:00Z", now)).toBe("hace 3 días");
  });

  it("composes a full view model and flags empty", () => {
    const me: MeResponse = {
      id: 7, username: "lucia", createdAt: "2026-03-01T00:00:00Z",
      gamesPlayed: 142, gamesWon: 38, totalChipsWon: 18420, lastPlayedAt: "2026-05-19T20:00:00Z",
    };
    const vm = buildRinconViewModel(me, 7, new Date("2026-05-20T12:00:00Z"));
    expect(vm.identidad.suit).toBe("B");
    expect(vm.winRate).toBe(27);
    expect(vm.puesto).toBe(7);
    expect(vm.socioDesde).toBe("marzo 2026");
    expect(vm.isEmpty).toBe(false);

    const fresh = buildRinconViewModel({ ...me, gamesPlayed: 0, gamesWon: 0, lastPlayedAt: null }, null);
    expect(fresh.isEmpty).toBe(true);
    expect(fresh.winRate).toBeNull();
    expect(fresh.identidad.rango).toBe("Cara nueva");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/app/rincon/identidad.test.ts`
Expected: FAIL — `./identidad` not found.

- [ ] **Step 3: Implement the generators**

Create `frontend/src/app/rincon/identidad.ts`:

```ts
import { SUIT_CODES, SUIT_NAMES_ES } from "./suits";
import type { SuitCode, WaxTone, Imperfection, MeResponse, Identidad, RinconViewModel } from "./types";

const mod = (n: number, m: number) => ((Math.trunc(n) % m) + m) % m;

export function getSuit(userId: number): SuitCode {
  return SUIT_CODES[mod(userId, 4)];
}

export function getMonograma(username: string): string {
  const ch = (username ?? "").trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

const WAX_TONES: WaxTone[] = ["oro", "granate", "bronce"];
export function getWaxTone(userId: number): WaxTone {
  return WAX_TONES[mod(userId, 3)];
}

export function getImperfection(userId: number): Imperfection {
  const id = Math.abs(Math.trunc(userId));
  const rotateDeg = -8 + (id % 15); // -8..+6
  const a = 47 + (id % 6);
  const b = 100 - a;
  const c = 48 + (Math.floor(id / 4) % 5);
  const d = 100 - c;
  return { rotateDeg, radius: `${a}% ${b}% ${c}% ${d}% / ${b}% ${a}% ${d}% ${c}%` };
}

const RANGOS: Array<{ min: number; label: string }> = [
  { min: 500, label: "Leyenda de la Casa" },
  { min: 150, label: "Veteranía de la Casa" },
  { min: 50, label: "Habitual de la Casa" },
  { min: 10, label: "De la parroquia" },
  { min: 1, label: "De paso" },
  { min: 0, label: "Cara nueva" },
];
export function getRango(gamesPlayed: number): string {
  const g = Math.max(0, Math.trunc(gamesPlayed));
  return (RANGOS.find((r) => g >= r.min) ?? RANGOS[RANGOS.length - 1]).label;
}

// Curated castizo pool: humano, de baraja/bar, con personalidad, ligeramente imperfecto — NUNCA meme/cartoon.
// Cosmetic stable alias; NOT a claim about playstyle. Copy is tunable.
const MOTES: string[] = [
  "La Sota de {palo}",
  "El de la última",
  "Mano de seda",
  "Cara de farol",
  "El que no se arruga",
  "Quien parte y reparte",
  "El templao",
  "La mala uva",
  "Pies de plomo",
  "El que aguanta",
];
export function getMote(userId: number, suit: SuitCode): string {
  const raw = MOTES[mod(userId, MOTES.length)];
  return raw.replace("{palo}", SUIT_NAMES_ES[suit]);
}

export function winRate(gamesPlayed: number, gamesWon: number): number | null {
  if (gamesPlayed <= 0) return null;
  return Math.round((gamesWon / gamesPlayed) * 100);
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function formatSocioDesde(createdAt: string): string {
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return "—";
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatUltimaVez(lastPlayedAt: string | null, now: Date = new Date()): string {
  if (!lastPlayedAt) return "—";
  const d = new Date(lastPlayedAt);
  if (isNaN(d.getTime())) return "—";
  const ms = now.getTime() - d.getTime();
  const days = Math.floor(ms / 86400000);
  if (ms < 0) return "ahora mismo";
  if (ms < 3600000) return "hace un rato";
  if (days === 0) return "hoy";
  if (days === 1) return "anoche";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
  return "hace tiempo";
}

export function buildRinconViewModel(me: MeResponse, puesto: number | null, now: Date = new Date()): RinconViewModel {
  const suit = getSuit(me.id);
  const identidad: Identidad = {
    userId: me.id,
    username: me.username,
    suit,
    monograma: getMonograma(me.username),
    waxTone: getWaxTone(me.id),
    imperfection: getImperfection(me.id),
    mote: getMote(me.id, suit),
    rango: getRango(me.gamesPlayed),
  };
  return {
    identidad,
    gamesPlayed: me.gamesPlayed,
    gamesWon: me.gamesWon,
    winRate: winRate(me.gamesPlayed, me.gamesWon),
    totalChipsWon: me.totalChipsWon,
    puesto,
    socioDesde: formatSocioDesde(me.createdAt),
    ultimaVez: formatUltimaVez(me.lastPlayedAt, now),
    isEmpty: me.gamesPlayed <= 0,
  };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/identidad.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/identidad.ts frontend/src/app/rincon/identidad.test.ts
git commit -m "feat(rincon): deterministic identity + stat-derivation generators"
```

---

## Task 4: Frontend — data layer

**Files:**
- Create: `frontend/src/app/rincon/data.ts`
- Test: `frontend/src/app/rincon/data.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/rincon/data.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { fetchMyRincon, fetchPuesto, type RinconDataDeps } from "./data";

function deps(fetchFn: any): RinconDataDeps {
  return { apiUrl: "http://api", fetchFn, getToken: () => "tok.tok.tok", log: vi.fn() };
}

describe("fetchMyRincon", () => {
  it("sends the auth header and coerces the bigint chips string", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 7, username: "lucia", createdAt: "2026-03-01T00:00:00Z", gamesPlayed: 142, gamesWon: 38, totalChipsWon: "18420", lastPlayedAt: null }),
    } as Response);

    const me = await fetchMyRincon(deps(fetchFn));

    expect(fetchFn).toHaveBeenCalledWith("http://api/api/users/me", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer tok.tok.tok" }),
    }));
    expect(me.totalChipsWon).toBe(18420);  // number, not "18420"
    expect(me.id).toBe(7);
  });

  it("throws on non-ok", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(fetchMyRincon(deps(fetchFn))).rejects.toThrow("HTTP 401");
  });
});

describe("fetchPuesto", () => {
  it("returns 1-based position when the user is in the ranking", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 3 }, { id: 7 }, { id: 9 }],
    } as Response);
    expect(await fetchPuesto(deps(fetchFn), 7)).toBe(2);
  });

  it("returns null when the user is not in the ranking", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 3 }] } as Response);
    expect(await fetchPuesto(deps(fetchFn), 7)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/app/rincon/data.test.ts`
Expected: FAIL — `./data` not found.

- [ ] **Step 3: Implement the data layer**

Create `frontend/src/app/rincon/data.ts`:

```ts
import type { MeResponse } from "./types";
import type { WinnerRankingEntry } from "../winners-ranking";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RinconDataDeps {
  apiUrl: string;
  fetchFn: FetchLike;
  getToken: () => string | null;
  log: (msg: string) => void;
}

export async function fetchMyRincon(deps: RinconDataDeps): Promise<MeResponse> {
  const token = deps.getToken();
  const res = await deps.fetchFn(`${deps.apiUrl}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: any = await res.json();
  return {
    id: Number(raw.id),
    username: String(raw.username ?? ""),
    email: raw.email,
    createdAt: String(raw.createdAt ?? ""),
    gamesPlayed: Number(raw.gamesPlayed ?? 0),
    gamesWon: Number(raw.gamesWon ?? 0),
    totalChipsWon: Number(raw.totalChipsWon ?? 0), // bigint arrives as string
    lastPlayedAt: raw.lastPlayedAt ?? null,
  };
}

/** Resolve "puesto" by finding the user in the public top-winners list. null = outside the top. */
export async function fetchPuesto(deps: RinconDataDeps, userId: number): Promise<number | null> {
  try {
    const res = await deps.fetchFn(`${deps.apiUrl}/api/ranking/top-winners`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const list = (await res.json()) as WinnerRankingEntry[];
    if (!Array.isArray(list)) return null;
    const idx = list.findIndex((e) => Number(e.id) === Number(userId));
    return idx >= 0 ? idx + 1 : null;
  } catch (e) {
    deps.log(`Puesto error: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/data.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/data.ts frontend/src/app/rincon/data.test.ts
git commit -m "feat(rincon): data layer for /me + puesto (explicit auth, bigint coercion)"
```

---

## Task 5: Frontend — identity-hero components (Lacre + Carnet)

**Files:**
- Create: `frontend/src/app/rincon/components.ts`
- Test: `frontend/src/app/rincon/components.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/rincon/components.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { LacrePersonal, CarnetVivo } from "./components";
import type { Identidad } from "./types";

const identidad: Identidad = {
  userId: 7, username: "lucia", suit: "O", monograma: "L", waxTone: "oro",
  imperfection: { rotateDeg: -7, radius: "49% 51% 52% 48% / 51% 49% 52% 48%" },
  mote: "La Sota de Oros", rango: "Veteranía de la Casa",
};

describe("LacrePersonal", () => {
  it("renders a seal with tone, monogram and a suit glyph", () => {
    const el = LacrePersonal({ identidad, sizePx: 74 });
    expect(el.classList.contains("lacre")).toBe(true);
    expect(el.getAttribute("data-tone")).toBe("oro");
    expect(el.querySelector(".lacre__mono")?.textContent).toBe("L");
    expect(el.querySelector('[data-suit="O"]')).not.toBeNull();
  });
});

describe("CarnetVivo", () => {
  it("renders name, mote and rango", () => {
    const el = CarnetVivo({ identidad, ultimaVez: "anoche" });
    expect(el.querySelector(".carnet-name")?.textContent).toBe("lucia");
    expect(el.querySelector(".carnet-mote")?.textContent).toContain("La Sota de Oros");
    expect(el.querySelector(".carnet-rango")?.textContent).toBe("Veteranía de la Casa");
    expect(el.querySelector(".carnet-foot")?.textContent).toContain("anoche");
    expect(el.querySelector(".lacre")).not.toBeNull(); // contains the seal
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: FAIL — `./components` not found.

- [ ] **Step 3: Implement the DOM helper + Lacre + Carnet**

Create `frontend/src/app/rincon/components.ts`:

```ts
import { suitGlyph } from "./suits";
import type { Identidad } from "./types";

/** Tiny DOM helper. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function LacrePersonal(props: { identidad: Identidad; sizePx?: number }): HTMLElement {
  const { identidad, sizePx = 74 } = props;
  const seal = el("div", "lacre");
  seal.setAttribute("data-tone", identidad.waxTone);
  seal.style.width = `${sizePx}px`;
  seal.style.height = `${sizePx}px`;
  seal.style.transform = `rotate(${identidad.imperfection.rotateDeg}deg)`;
  seal.style.borderRadius = identidad.imperfection.radius;
  const glyph = suitGlyph(identidad.suit, Math.round(sizePx * 0.34));
  glyph.classList.add("lacre__glyph");
  seal.appendChild(glyph);
  seal.appendChild(el("span", "lacre__mono", identidad.monograma));
  return seal;
}

export function CarnetVivo(props: { identidad: Identidad; ultimaVez: string; socioNumero?: string }): HTMLElement {
  const { identidad, ultimaVez } = props;
  const socioNumero = props.socioNumero ?? String(1000 + (identidad.userId % 9000)); // cosmetic, stable
  const holder = el("div", "carnet-holder tilt");
  const face = el("div", "carnet-face");

  for (const pos of ["tl", "br"] as const) {
    const pip = el("div", `carnet-pip ${pos}`);
    pip.appendChild(suitGlyph(identidad.suit, 12));
    face.appendChild(pip);
  }

  face.appendChild(el("div", "carnet-house", `Casa Chiribito · Socio nº ${socioNumero}`));

  const hero = el("div", "carnet-hero");
  hero.appendChild(LacrePersonal({ identidad }));
  hero.appendChild(el("div", "carnet-name", identidad.username));
  hero.appendChild(el("div", "carnet-mote", `«${identidad.mote}»`));
  hero.appendChild(el("div", "carnet-rango", identidad.rango));
  face.appendChild(hero);

  const foot = el("div", "carnet-foot");
  foot.appendChild(el("span", "carnet-foot__pres", `Última vez en la mesa · ${ultimaVez}`));
  face.appendChild(foot);

  holder.appendChild(face);
  return holder;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/components.ts frontend/src/app/rincon/components.test.ts
git commit -m "feat(rincon): Lacre + Carnet identity-hero components"
```

---

## Task 6: Frontend — section components (stats, historia, compartir, mesa)

**Files:**
- Modify: `frontend/src/app/rincon/components.ts` (append builders)
- Modify: `frontend/src/app/rincon/components.test.ts` (append tests)

- [ ] **Step 1: Append failing tests**

Append to `frontend/src/app/rincon/components.test.ts`:

```ts
import { StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa } from "./components";
import type { RinconViewModel } from "./types";

const vm: RinconViewModel = {
  identidad,
  gamesPlayed: 142, gamesWon: 38, winRate: 27, totalChipsWon: 18420, puesto: 7,
  socioDesde: "marzo 2026", ultimaVez: "anoche", isEmpty: false,
};

describe("StatMarks", () => {
  it("shows real stats; shows '—' for null puesto/winrate", () => {
    expect(StatMarks(vm).textContent).toContain("142");
    expect(StatMarks(vm).textContent).toContain("#7");
    const empty = StatMarks({ ...vm, gamesPlayed: 0, gamesWon: 0, winRate: null, puesto: null });
    expect(empty.textContent).toContain("—");
  });
});

describe("HistoriaStrip", () => {
  it("shows real recency + a future teaser, never fake entries", () => {
    const h = HistoriaStrip(vm);
    expect(h.textContent).toContain("marzo 2026");
    expect(h.textContent?.toLowerCase()).toContain("pronto");
  });
  it("shows the day-one invitation when empty", () => {
    expect(HistoriaStrip({ ...vm, isEmpty: true }).textContent).toContain("por escribirse");
  });
});

describe("CompartirRincon", () => {
  it("builds a quiet affordance with a non-personal blurb", () => {
    const c = CompartirRincon({ identidad, gameUrl: "https://play.chiribito.com" });
    expect(c.classList.contains("share-quiet")).toBe(true);
    expect(c.dataset.blurb).toContain("La Sota de Oros");
    expect(c.dataset.blurb).toContain("https://play.chiribito.com");
  });
});

describe("PresenciaMesa", () => {
  it("previews the seat mark with name + mote", () => {
    const m = PresenciaMesa({ identidad });
    expect(m.querySelector(".mesa__nm")?.textContent).toContain("lucia");
    expect(m.querySelector(".lacre")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: FAIL — `StatMarks` etc. not exported.

- [ ] **Step 3: Append the builders**

Append to `frontend/src/app/rincon/components.ts` (after the existing exports; reuse the module-local `el` and the imports already present — add `RinconViewModel` to the type import line at top: `import type { Identidad, RinconViewModel } from "./types";`):

```ts
function statTile(value: string, label: string): HTMLElement {
  const t = el("div", "stat");
  t.appendChild(el("div", "stat__v", value));
  t.appendChild(el("div", "stat__k", label));
  return t;
}

export function StatMarks(vm: RinconViewModel): HTMLElement {
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "La hoja del socio"));
  const grid = el("div", "statg");
  grid.appendChild(statTile(String(vm.gamesPlayed), "Manos"));
  grid.appendChild(statTile(String(vm.gamesWon), "Ganadas"));
  grid.appendChild(statTile(vm.winRate == null ? "—" : `${vm.winRate}%`, "Victorias"));
  grid.appendChild(statTile(formatChips(vm.totalChipsWon), "Fichas"));
  grid.appendChild(statTile(vm.puesto == null ? "—" : `#${vm.puesto}`, vm.puesto == null ? "Sin clasificar" : "En la casa"));
  sec.appendChild(grid);
  return sec;
}

function formatChips(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function HistoriaStrip(vm: RinconViewModel): HTMLElement {
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "Tu historia"));
  if (vm.isEmpty) {
    sec.appendChild(el("p", "hist__real", "Tu historia está por escribirse. Siéntate a una mesa."));
  } else {
    const real = el("p", "hist__real");
    real.innerHTML = `Socio desde <b>${vm.socioDesde}</b> · última mesa <b>${vm.ultimaVez}</b>`;
    sec.appendChild(real);
  }
  const ghosts = el("div", "hist__ghosts");
  const first = el("div", "ghost real", "★");
  ghosts.appendChild(first);
  for (let i = 0; i < 3; i++) ghosts.appendChild(el("div", "ghost", "·"));
  ghosts.appendChild(el("span", "hist__soon", "rachas y manos memorables, pronto…"));
  sec.appendChild(ghosts);
  return sec;
}

export function CompartirRincon(props: { identidad: Identidad; gameUrl: string }): HTMLElement {
  const { identidad, gameUrl } = props;
  const blurb = `Soy «${identidad.mote}», ${identidad.rango} en Chiribito. Échate una mano: ${gameUrl}`;
  const btn = el("button", "share-quiet", "⤴ compartir mi rincón");
  btn.type = "button";
  btn.dataset.blurb = blurb;
  btn.addEventListener("click", async () => {
    try {
      const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
      if (nav.share) await nav.share({ text: blurb });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(blurb);
        btn.textContent = "copiado ✓";
        setTimeout(() => { btn.textContent = "⤴ compartir mi rincón"; }, 1800);
      }
    } catch {
      /* user dismissed share sheet — no-op */
    }
  });
  return btn;
}

export function PresenciaMesa(props: { identidad: Identidad }): HTMLElement {
  const { identidad } = props;
  const sec = el("div", "rincon-sec");
  sec.appendChild(el("div", "rincon-sec__t", "En la mesa apareces así"));
  const mesa = el("div", "mesa");
  const seat = el("div", "mesa__seat");
  seat.appendChild(LacrePersonal({ identidad, sizePx: 44 }));
  mesa.appendChild(seat);
  const info = el("div", "mesa__info");
  info.appendChild(el("div", "mesa__nm", identidad.username));
  info.appendChild(el("div", "mesa__sub", `«${identidad.mote}»`));
  mesa.appendChild(info);
  sec.appendChild(mesa);
  return sec;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/components.test.ts`
Expected: PASS (all builder tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/components.ts frontend/src/app/rincon/components.test.ts
git commit -m "feat(rincon): stats, historia (honest teaser), compartir, presencia components"
```

---

## Task 7: Frontend — scene render + states

**Files:**
- Create: `frontend/src/app/rincon/rincon-scene.ts`
- Test: `frontend/src/app/rincon/rincon-scene.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/rincon/rincon-scene.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { renderRincon, renderRinconLoading, renderRinconError, setRinconOverlayVisible } from "./rincon-scene";
import type { RinconViewModel } from "./types";

const vm: RinconViewModel = {
  identidad: { userId: 7, username: "lucia", suit: "O", monograma: "L", waxTone: "oro",
    imperfection: { rotateDeg: -7, radius: "49% 51% 52% 48% / 51% 49% 52% 48%" }, mote: "La Sota de Oros", rango: "Veteranía de la Casa" },
  gamesPlayed: 142, gamesWon: 38, winRate: 27, totalChipsWon: 18420, puesto: 7,
  socioDesde: "marzo 2026", ultimaVez: "anoche", isEmpty: false,
};

describe("rincon scene", () => {
  it("toggles overlay visibility via the hidden class", () => {
    const ov = document.createElement("div");
    ov.classList.add("hidden");
    setRinconOverlayVisible(ov, true);
    expect(ov.classList.contains("hidden")).toBe(false);
    setRinconOverlayVisible(ov, false);
    expect(ov.classList.contains("hidden")).toBe(true);
  });

  it("renders the full rincon (carnet + stats + historia + compartir + mesa)", () => {
    const c = document.createElement("div");
    renderRincon(c, vm, { gameUrl: "https://play.chiribito.com", onClose: vi.fn() });
    expect(c.querySelector(".carnet-name")?.textContent).toBe("lucia");
    expect(c.textContent).toContain("La hoja del socio");
    expect(c.textContent).toContain("Tu historia");
    expect(c.querySelector(".share-quiet")).not.toBeNull();
    expect(c.textContent).toContain("En la mesa apareces así");
  });

  it("renders loading and error with a retry", () => {
    const c = document.createElement("div");
    renderRinconLoading(c);
    expect(c.querySelector(".rincon-loading")).not.toBeNull();
    const onRetry = vi.fn();
    renderRinconError(c, onRetry);
    (c.querySelector(".rincon-error button") as HTMLButtonElement).click();
    expect(onRetry).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/app/rincon/rincon-scene.test.ts`
Expected: FAIL — `./rincon-scene` not found.

- [ ] **Step 3: Implement render + states + controller**

Create `frontend/src/app/rincon/rincon-scene.ts`:

```ts
import { decodeJWT, SecureStorage } from "../../security";
import { CarnetVivo, StatMarks, HistoriaStrip, CompartirRincon, PresenciaMesa } from "./components";
import { fetchMyRincon, fetchPuesto, type FetchLike } from "./data";
import { buildRinconViewModel } from "./identidad";
import type { RinconViewModel } from "./types";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function setRinconOverlayVisible(overlay: HTMLElement, visible: boolean): void {
  overlay.classList.toggle("hidden", !visible);
}

function topbar(onClose: () => void): HTMLElement {
  const top = el("header", "rincon-top");
  const back = el("button", "rincon-top__back", "‹");
  back.type = "button";
  back.setAttribute("aria-label", "Volver al lobby");
  back.addEventListener("click", onClose);
  top.appendChild(back);
  top.appendChild(el("div", "rincon-top__title", "Mi Rincón"));
  top.appendChild(el("div", "rincon-top__spacer"));
  return top;
}

export function renderRincon(container: HTMLElement, vm: RinconViewModel, opts: { gameUrl: string; onClose: () => void }): void {
  container.innerHTML = "";
  container.appendChild(topbar(opts.onClose));
  container.appendChild(CarnetVivo({ identidad: vm.identidad, ultimaVez: vm.ultimaVez }));
  container.appendChild(StatMarks(vm));
  container.appendChild(HistoriaStrip(vm));
  container.appendChild(CompartirRincon({ identidad: vm.identidad, gameUrl: opts.gameUrl }));
  container.appendChild(PresenciaMesa({ identidad: vm.identidad }));
}

export function renderRinconLoading(container: HTMLElement): void {
  container.innerHTML = "";
  const wrap = el("div", "rincon-loading");
  wrap.appendChild(el("div", "rincon-loading__seal"));
  wrap.appendChild(el("p", "rincon-loading__txt", "Abriendo tu rincón…"));
  container.appendChild(wrap);
}

export function renderRinconError(container: HTMLElement, onRetry: () => void): void {
  container.innerHTML = "";
  const wrap = el("div", "rincon-error");
  wrap.appendChild(el("p", undefined, "No pudimos cargar tus marcas."));
  const btn = el("button", undefined, "Reintentar");
  btn.type = "button";
  btn.addEventListener("click", onRetry);
  wrap.appendChild(btn);
  container.appendChild(wrap);
}

export interface OpenRinconDeps {
  overlay: HTMLElement;
  content: HTMLElement;
  apiUrl: string;
  fetchFn: FetchLike;
  gameUrl: string;
  log: (msg: string) => void;
  onClose: () => void; // hide rincon + show lobby
}

/** Open the scene, fetch data, render. Identity is client-derived so it never fully fails. */
export async function openRincon(deps: OpenRinconDeps): Promise<void> {
  setRinconOverlayVisible(deps.overlay, true);
  renderRinconLoading(deps.content);

  const token = SecureStorage.getAccessToken();
  const payload = token ? decodeJWT(token) : null;
  const userId = Number(payload?.userId);
  if (!token || !payload || Number.isNaN(userId)) {
    renderRinconError(deps.content, () => void openRincon(deps));
    return;
  }

  const dataDeps = { apiUrl: deps.apiUrl, fetchFn: deps.fetchFn, getToken: () => token, log: deps.log };
  try {
    const [me, puesto] = await Promise.all([fetchMyRincon(dataDeps), fetchPuesto(dataDeps, userId)]);
    const vm = buildRinconViewModel(me, puesto);
    renderRincon(deps.content, vm, { gameUrl: deps.gameUrl, onClose: deps.onClose });
  } catch (e) {
    deps.log(`Rincón error: ${e instanceof Error ? e.message : String(e)}`);
    renderRinconError(deps.content, () => void openRincon(deps));
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/app/rincon/rincon-scene.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rincon/rincon-scene.ts frontend/src/app/rincon/rincon-scene.test.ts
git commit -m "feat(rincon): scene render, states, and openRincon controller"
```

---

## Task 8: Frontend — scoped styles (`rincon.css`)

**Files:**
- Create: `frontend/src/app/rincon/rincon.css`

This is ported verbatim-in-spirit from the validated companion mockup (`rincon-full.html`), scoped under `.rincon-scene`, reusing existing tokens. The class names match the contract used by the builders. No `style.css` edit.

- [ ] **Step 1: Create the stylesheet**

Create `frontend/src/app/rincon/rincon.css`:

```css
/* El Rincón del Jugador — scoped. Reuses style.css tokens (felt/gold/wood) where present;
   redeclares the few it needs so it is self-contained. Do NOT edit style.css. */
.rincon-scene {
  --r-felt-dark: #0b4d3c; --r-felt-main: #0d5f4a; --r-felt-light: #10745c;
  --r-gold: #f4c430; --r-gold-soft: #f6d365; --r-gold-deep: #b8881e;
  --r-ivory: #f4ecd8; --r-ivory-dim: #d8cdb3;
  --r-wood-dark: #2b1a12; --r-wood-mid: #4a2f1a; --r-wood-light: #6b4022;
  --r-bg-dark: #0a0f1a; --r-bg-darker: #050810; --r-bg-deepest: #02050c;
  --r-ease: cubic-bezier(.19, 1, .22, 1);
  position: fixed; inset: 0; z-index: 1100; overflow-y: auto;
  font-family: "Manrope", "Segoe UI", sans-serif; color: var(--r-ivory);
  background: radial-gradient(1200px 600px at 18% -8%, rgba(244, 196, 48, .08), transparent 60%),
    radial-gradient(900px 520px at 82% 6%, rgba(13, 95, 74, .22), transparent 55%),
    linear-gradient(160deg, var(--r-bg-darker), var(--r-bg-dark));
  animation: rincon-in 460ms var(--r-ease) both;
}
.rincon-scene.hidden { display: none; }
@keyframes rincon-in { from { opacity: 0 } to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .rincon-scene, .rincon-scene * { animation: none !important; } }

.rincon-scene__bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.rincon-scene__vignette { position: absolute; inset: 0; background: radial-gradient(ellipse 100% 100% at 50% 44%, transparent 42%, rgba(0, 0, 0, .62) 100%); }
.rincon-scene__glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; }
.rincon-scene__glow--gold { width: 420px; height: 420px; top: -140px; left: -120px; background: radial-gradient(circle, rgba(244, 196, 48, .4), transparent 70%); animation: r-drift 18s ease-in-out infinite alternate; }
.rincon-scene__glow--felt { width: 520px; height: 520px; bottom: -180px; right: -160px; background: radial-gradient(circle, rgba(16, 116, 92, .52), transparent 70%); animation: r-drift 22s ease-in-out infinite alternate-reverse; }
@keyframes r-drift { from { transform: translate(0, 0) scale(1) } to { transform: translate(36px, -26px) scale(1.1) } }
.rincon-scene__grain { position: absolute; inset: 0; opacity: .05; mix-blend-mode: overlay; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>"); }

/* content column — mobile first */
#rincon-content { position: relative; z-index: 2; max-width: 460px; margin: 0 auto; padding: 14px 16px 40px; display: flex; flex-direction: column; gap: 16px; }

.rincon-top { display: flex; align-items: center; gap: 8px; padding: 6px 2px; }
.rincon-top__back { width: 34px; height: 34px; border-radius: 50%; background: transparent; color: var(--r-ivory-dim); border: 1px solid rgba(244, 196, 48, .22); font-size: 17px; cursor: pointer; }
.rincon-top__title { flex: 1; text-align: center; font-family: "Cinzel", serif; font-weight: 800; font-size: 13px; letter-spacing: .16em; text-transform: uppercase; }
.rincon-top__spacer { width: 34px; }

/* carnet */
.carnet-holder { position: relative; padding: 5px; border-radius: 18px; background: linear-gradient(150deg, var(--r-wood-light), var(--r-wood-mid) 38%, var(--r-wood-dark)); box-shadow: 0 22px 46px rgba(0, 0, 0, .6), inset 0 1px 0 rgba(255, 255, 255, .1), inset 0 -2px 6px rgba(0, 0, 0, .5); }
.carnet-holder.tilt { transform: rotate(-1.4deg); }
.carnet-holder::before { content: ""; position: absolute; inset: 0; border-radius: 18px; pointer-events: none; box-shadow: inset 0 0 60px rgba(0, 0, 0, .55); }
.carnet-face { position: relative; border-radius: 14px; padding: 18px; overflow: hidden; background: linear-gradient(158deg, var(--r-felt-light), var(--r-felt-main) 44%, var(--r-felt-dark)); box-shadow: inset 0 0 46px rgba(0, 0, 0, .5); }
.carnet-face::before { content: ""; position: absolute; inset: 7px; border-radius: 9px; pointer-events: none; border: 1px solid rgba(244, 196, 48, .45); box-shadow: inset 0 0 0 3px rgba(244, 196, 48, .13); }
.carnet-pip { position: absolute; z-index: 3; color: var(--r-gold-soft); }
.carnet-pip.tl { top: 12px; left: 12px; } .carnet-pip.br { bottom: 12px; right: 12px; transform: rotate(180deg); }
.carnet-house { position: relative; z-index: 3; text-align: center; font-family: "Cinzel", serif; font-size: 9px; letter-spacing: .24em; color: var(--r-gold-soft); font-weight: 800; text-transform: uppercase; }
.carnet-hero { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
.carnet-name { font-family: "Cinzel", serif; font-weight: 800; font-size: 23px; text-shadow: 0 2px 10px rgba(0, 0, 0, .55); margin-top: 4px; }
.carnet-mote { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 16px; color: #fff3cf; margin-top: 2px; }
.carnet-rango { margin-top: 8px; font-size: 8.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--r-bg-deepest); font-weight: 800; background: linear-gradient(135deg, var(--r-gold-soft), var(--r-gold) 60%, var(--r-gold-deep)); padding: 3px 11px; border-radius: 999px; }
.carnet-foot { position: relative; z-index: 3; text-align: center; margin-top: 14px; font-size: 10.5px; color: rgba(244, 236, 216, .82); }

/* lacre */
.lacre { display: grid; place-items: center; position: relative; box-shadow: 0 9px 18px rgba(0, 0, 0, .55), inset 0 3px 6px rgba(255, 255, 255, .45), inset 0 -6px 11px rgba(0, 0, 0, .4); }
.lacre[data-tone="oro"] { background: radial-gradient(circle at 35% 28%, #ffe49a, var(--r-gold) 46%, var(--r-gold-deep)); }
.lacre[data-tone="granate"] { background: radial-gradient(circle at 35% 28%, #c0584a, #8a2a22 46%, #4e140f); }
.lacre[data-tone="bronce"] { background: radial-gradient(circle at 35% 28%, #d9b87a, #9c7430 46%, #5c4117); }
.lacre__glyph { color: rgba(74, 47, 5, .8); margin-top: -4px; }
.lacre[data-tone="granate"] .lacre__glyph { color: rgba(40, 8, 5, .82); }
.lacre__mono { position: absolute; bottom: 12%; font-family: "Cinzel", serif; font-weight: 900; font-size: 13px; color: rgba(74, 47, 5, .85); }
.lacre[data-tone="granate"] .lacre__mono { color: rgba(40, 8, 5, .85); }

/* sections */
.rincon-sec { border-radius: 14px; padding: 13px 14px; background: linear-gradient(180deg, rgba(20, 16, 11, .7), rgba(8, 6, 4, .78)); border: 1px solid rgba(244, 196, 48, .13); }
.rincon-sec__t { font-family: "Cinzel", serif; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--r-gold-soft); font-weight: 800; margin-bottom: 11px; display: flex; align-items: center; gap: 8px; }
.rincon-sec__t::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(244, 196, 48, .35), transparent); }
.statg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 6px; }
.stat { text-align: center; }
.stat__v { font-family: "Cinzel", serif; font-weight: 700; font-size: 19px; text-shadow: 0 1px 0 rgba(0, 0, 0, .6); }
.stat__k { font-size: 8px; letter-spacing: .13em; text-transform: uppercase; color: var(--r-ivory-dim); font-weight: 700; margin-top: 3px; opacity: .85; }
.hist__real { font-size: 11.5px; color: var(--r-ivory-dim); line-height: 1.6; margin-bottom: 10px; }
.hist__real b { color: var(--r-ivory); }
.hist__ghosts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ghost { width: 34px; height: 34px; border-radius: 8px; border: 1px dashed rgba(244, 196, 48, .28); display: grid; place-items: center; color: rgba(244, 196, 48, .3); font-size: 13px; }
.ghost.real { border-style: solid; border-color: rgba(244, 196, 48, .4); background: radial-gradient(circle at 40% 30%, rgba(244, 196, 48, .22), rgba(244, 196, 48, .05)); color: var(--r-gold-soft); }
.hist__soon { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 12px; color: var(--r-ivory-dim); margin-left: 4px; }

/* compartir — DISCREET (locked tweak): quiet text affordance, never a big gold button */
.share-quiet { align-self: center; background: transparent; border: none; color: var(--r-gold-soft); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; opacity: .8; cursor: pointer; padding: 4px 8px; }
.share-quiet:hover { opacity: 1; text-decoration: underline; }

/* presencia en mesa */
.mesa { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 12px; background: radial-gradient(120% 130% at 80% 0%, rgba(13, 95, 74, .4), rgba(2, 5, 12, .6)); border: 1px solid rgba(244, 196, 48, .16); }
.mesa__seat { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; flex: none; background: radial-gradient(circle at 38% 30%, var(--r-felt-light), var(--r-felt-main) 55%, var(--r-felt-dark)); box-shadow: 0 6px 14px rgba(0, 0, 0, .5), inset 0 0 0 2px rgba(244, 196, 48, .6); }
.mesa__nm { font-family: "Cinzel", serif; font-weight: 700; font-size: 13px; }
.mesa__sub { font-family: "Cormorant Garamond", serif; font-style: italic; font-size: 12px; color: var(--r-gold-soft); }

/* loading / error */
.rincon-loading, .rincon-error { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 80px 20px; text-align: center; color: var(--r-ivory-dim); }
.rincon-loading__seal { width: 58px; height: 58px; border-radius: 50% 52% 48% 50%; background: radial-gradient(circle at 35% 28%, #ffe49a, var(--r-gold) 46%, var(--r-gold-deep)); box-shadow: 0 8px 18px rgba(0, 0, 0, .5); animation: r-pulse 1.6s ease-in-out infinite; }
@keyframes r-pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: .55; transform: scale(.92) } }
.rincon-error button { background: transparent; border: 1px solid rgba(244, 196, 48, .4); color: var(--r-gold-soft); padding: 8px 18px; border-radius: 999px; cursor: pointer; font-family: "Cinzel", serif; letter-spacing: .1em; }

/* desktop scale-up */
@media (min-width: 760px) {
  #rincon-content { max-width: 720px; display: grid; grid-template-columns: 320px 1fr; grid-template-areas: "top top" "carnet stats" "carnet historia" "carnet compartir" "mesa mesa"; gap: 16px 22px; align-items: start; padding-top: 30px; }
  .rincon-top { grid-area: top; }
  .carnet-holder { grid-area: carnet; }
  #rincon-content > .rincon-sec:nth-of-type(1) { grid-area: stats; }
  #rincon-content > .rincon-sec:nth-of-type(2) { grid-area: historia; }
  .share-quiet { grid-area: compartir; justify-self: center; }
  #rincon-content > .rincon-sec:nth-of-type(3) { grid-area: mesa; }
}
```

- [ ] **Step 2: Commit** (visual verification happens in Task 9 with the dev server)

```bash
git add frontend/src/app/rincon/rincon.css
git commit -m "style(rincon): scoped Carnet Vivo styling (ported from validated mockup)"
```

---

## Task 9: Integration wiring + manual verification

**Files:**
- Modify: `frontend/index.html` (link, button, overlay container)
- Modify: `frontend/src/dom-refs.ts`
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: Add the stylesheet link**

In `frontend/index.html`, immediately after line 10 (`<link rel="stylesheet" href="/src/style.css" />`), add:

```html
    <link rel="stylesheet" href="/src/app/rincon/rincon.css" />
```

- [ ] **Step 2: Add the "Mi Rincón" button to the lobby header**

In `frontend/index.html`, inside `.lobby-top__actions` (before the `#back-to-auth` button, ~line 150), add:

```html
            <button id="mi-rincon" type="button" class="lobby-icon-btn" title="Mi Rincón">
              <span class="lobby-icon-btn__label">Mi Rincón</span>
            </button>
```

- [ ] **Step 3: Add the overlay container**

In `frontend/index.html`, add a sibling of `#lobby-overlay` (after its closing `</div>` at ~line 226), starting hidden:

```html
    <div id="rincon-overlay" class="rincon-scene hidden">
      <div class="rincon-scene__bg" aria-hidden="true">
        <div class="rincon-scene__vignette"></div>
        <div class="rincon-scene__glow rincon-scene__glow--gold"></div>
        <div class="rincon-scene__glow rincon-scene__glow--felt"></div>
        <div class="rincon-scene__grain"></div>
      </div>
      <div id="rincon-content"></div>
    </div>
```

- [ ] **Step 4: Register DOM refs**

In `frontend/src/dom-refs.ts`, add inside the `dom` object (alongside the other overlay refs):

```ts
  rinconOverlay: getRef<HTMLDivElement>("#rincon-overlay"),
  rinconContent: getRef<HTMLDivElement>("#rincon-content"),
  miRinconButton: getRef<HTMLButtonElement>("#mi-rincon"),
```

- [ ] **Step 5: Wire the button in `main.ts`**

In `frontend/src/main.ts`:

(a) add the import near the other `app/` imports (e.g. after the winners-ranking import, ~line 76):
```ts
import { openRincon, setRinconOverlayVisible } from "./app/rincon/rincon-scene";
```

(b) resolve refs near the other `const X = dom.Y!;` lines (~line 148):
```ts
const rinconOverlay = dom.rinconOverlay!;
const rinconContent = dom.rinconContent!;
const miRinconButton = dom.miRinconButton;
```

(c) bind the button next to the other lobby-header bindings (near the `backToAuthButton` listener, ~line 1055):
```ts
if (miRinconButton) {
  miRinconButton.addEventListener("click", () => {
    void openRincon({
      overlay: rinconOverlay,
      content: rinconContent,
      apiUrl: API_URL,
      fetchFn: fetch.bind(window),
      gameUrl: "https://play.chiribito.com",
      log,
      onClose: () => {
        setRinconOverlayVisible(rinconOverlay, false);
        setLobbyOverlayVisible(true);
      },
    });
  });
}
```

- [ ] **Step 6: Type-check the whole frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. (Fixes any import/type mismatch before runtime.)

- [ ] **Step 7: Run the full frontend + api test suites (no regressions)**

Run: `cd frontend && npx vitest run`
Run: `cd api-server && npx jest`
Expected: all green (existing suites + the new rincon/UserController tests).

- [ ] **Step 8: Manual verification (dev server) — the real proof**

Run: `cd frontend && npm run dev`. Then in the browser:

1. Log in (or use guest). In the lobby, confirm a **"Mi Rincón"** button sits next to Sonido/Salir.
2. Click it → the Rincón opens: **Carnet** with the wax **Lacre** (your suit + initial), name, mote, rango; **La hoja del socio** stats; **Tu historia** (real "socio desde / última vez" + the "pronto…" teaser); a **discreet** "compartir mi rincón" text; **En la mesa apareces así**.
3. Confirm **no fake data**: if you're outside the top-10 the puesto reads "—"; there is no "online now" dot and no racha number.
4. Click **‹ back** → returns to the lobby.
5. Confirm **empty state** with a fresh account (0 manos): carnet still shows the seal + "Cara nueva", stats show 0/—, historia shows "…por escribirse. Siéntate a una mesa."
6. Toggle device toolbar to a phone width (≈390px) → mobile-first single column reads cleanly; widen to desktop → the grid scale-up applies.
7. Confirm the **table/felt/lobby are visually unchanged**.

- [ ] **Step 9: Commit**

```bash
git add frontend/index.html frontend/src/dom-refs.ts frontend/src/main.ts
git commit -m "feat(rincon): wire Mi Rincón scene into the lobby"
```

---

## Self-review (completed by plan author)

- **Spec coverage:** §3 scope items 1–10 → Tasks: RinconScene/states (7), CarnetVivo (5), LacrePersonal (5), StatMarks/HistoriaStrip/CompartirRincon/PresenciaMesa (6), backend `/me` (1), lobby entry (9), empty state (6/7/9). §5 generation → Task 3. §6 honesty matrix → Tasks 3/4/6 (winRate null, puesto null="—", racha as teaser-only text, última-vez real, no online dot). §8 architecture/files → all tasks. §9 PresenciaMesa preview-only → Task 6 (no TableScene edit). §10 motion/reduced-motion → Task 8. §11 mobile-first/desktop → Task 8 + verify 9.8. No spec requirement left without a task.
- **Placeholder scan:** none — every code step contains complete code; every run step has an exact command + expected result.
- **Type consistency:** `MeResponse`/`Identidad`/`RinconViewModel` defined in Task 2 and used unchanged in 3/4/5/6/7. `RinconDataDeps`/`FetchLike` defined in Task 4, reused in Task 7. `WinnerRankingEntry` imported from the existing `../winners-ranking`. Builder fn names (`LacrePersonal`, `CarnetVivo`, `StatMarks`, `HistoriaStrip`, `CompartirRincon`, `PresenciaMesa`) and CSS classes match the contract section and Task 8.

## Out of scope (deferred — do NOT build)

Avatar upload, achievements, real activity/per-hand history, public web profile, live presence/online, streak backend, friend graph, user-editable mote/suit, any `TableScene`/felt/`style.css`/`web/`/PMS/PT change. (See spec §4.)
