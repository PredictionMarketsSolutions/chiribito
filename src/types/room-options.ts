/**
 * Tipos para opciones de sala y autenticación (MyRoom onCreate, requestJoin, onAuth, onJoin).
 * Evita el uso de `any` en las firmas.
 */

/** Opciones al crear la sala (client.create). */
export interface RoomOptions {
  tableName?: string;
}

/** Usuario autenticado (JWT decoded). */
export interface AuthUser {
  userId: number;
  username?: string;
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
