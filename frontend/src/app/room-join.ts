export type JoinMode = "joinOrCreate" | "create" | "joinById";

export type JoinValidationDeps = {
  hasToken: boolean;
  mode: JoinMode;
  roomId?: string;
  setConnectionState: (state: "disconnected" | "connecting" | "connected") => void;
  log: (message: string) => void;
};

export function validateJoinRequest(deps: JoinValidationDeps): { ok: boolean; normalizedRoomId?: string } {
  if (!deps.hasToken) {
    deps.log("No token. Login or register first.");
    deps.setConnectionState("disconnected");
    return { ok: false };
  }

  if (deps.mode === "joinById") {
    const normalizedRoomId = (deps.roomId ?? "").trim();
    if (!normalizedRoomId) {
      deps.setConnectionState("disconnected");
      deps.log("Room ID vacío.");
      return { ok: false };
    }
    return { ok: true, normalizedRoomId };
  }

  return { ok: true };
}

export type JoinErrorHandlerDeps = {
  error: unknown;
  confirmSessionReplace: () => boolean;
  onSessionReplaceConfirmed: () => Promise<void>;
  onSessionReplaceRejected: () => void;
  onInvalidToken: () => void;
  onAuthUnavailable: () => void;
  onCreateRateLimit: () => void;
  onGeneric: (message: string) => void;
};

export async function handleJoinError(deps: JoinErrorHandlerDeps): Promise<void> {
  const message = deps.error instanceof Error ? deps.error.message : String(deps.error);

  if (message.includes("SESSION_EXISTS")) {
    const shouldReplace = deps.confirmSessionReplace();
    if (shouldReplace) {
      await deps.onSessionReplaceConfirmed();
    } else {
      deps.onSessionReplaceRejected();
    }
    return;
  }

  if (message.includes("INVALID_TOKEN")) {
    deps.onInvalidToken();
    return;
  }

  if (message === "AUTH_TIMEOUT" || message === "AUTH_UNAVAILABLE") {
    deps.onAuthUnavailable();
    return;
  }

  if (message.includes("CREATE_ROOM_RATE_LIMIT")) {
    deps.onCreateRateLimit();
    return;
  }

  deps.onGeneric(message);
}
