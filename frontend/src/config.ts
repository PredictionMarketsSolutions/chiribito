/**
 * Frontend config and constants
 */
export const API_URL = import.meta.env.VITE_API_URL || "https://chiri-backend.onrender.com";
export const WS_URL = import.meta.env.VITE_WS_URL || "wss://chiri-backend-colyseus.onrender.com";
export const TURN_TIMEOUT_MS = 30000;
export const MAX_HAND_HISTORY = 20;
export const ACTION_BUFFER_MAX_SIZE = 50;
/** Max reconnection attempts before asking user to refresh. Higher value improves resilience on unstable connections. */
export const MAX_RECONNECT_ATTEMPTS = 10;
