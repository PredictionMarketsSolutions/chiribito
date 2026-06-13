/**
 * Tipos para opciones de sala y autenticación (ChiribitoRoom onCreate, requestJoin, onAuth, onJoin).
 * Evita el uso de `any` en las firmas.
 */

/** Opciones al crear la sala (client.create). */
export interface RoomOptions {
  tableName?: string;
  /** Modo de sala: "practice" activa bots, modo sin stats, y exclusión del lobby. */
  mode?: "practice";
  /** Número de bots a sembrar en modo práctica (clamped a [1,5]). */
  botCount?: number;
}

/** Usuario autenticado (JWT decoded). */
export interface AuthUser {
  userId: number;
  username?: string;
  /** Monotonic counter incremented on login / refresh / reset. */
  tokenVersion?: number;
  [key: string]: unknown;
}

/** Opciones que envía el cliente al hacer requestJoin (token para JWT). */
export interface JoinOptionsFromClient {
  token?: string;
  auth?: { token?: string };
  headers?: { authorization?: string };
  forceReplace?: boolean;
}

/** Opciones en onJoin: JoinOptionsFromClient + campos inyectados por onAuth. */
export interface JoinOptionsWithAuth extends JoinOptionsFromClient {
  authUser?: AuthUser;
  replaceSessionId?: string;
}
