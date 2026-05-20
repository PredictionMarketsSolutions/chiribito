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
  if (ms < 0) return "ahora mismo";
  if (ms < 3600000) return "hace un rato";
  // Calendar-day distance in UTC (deterministic across timezones): an event last
  // night reads "anoche" even when fewer than 24h have elapsed.
  const lastDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((nowDay - lastDay) / 86400000);
  if (days <= 0) return "hoy";
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
