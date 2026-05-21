export type SuitCode = "O" | "C" | "E" | "B";
export type WaxTone = "oro" | "granate" | "bronce";

/** Count-up format keys: how rincon-scene formats an animated stat value. */
export type CountupFormat = "int" | "pct" | "chips" | "rank";

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
