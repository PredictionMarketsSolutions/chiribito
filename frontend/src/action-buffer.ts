/**
 * Action buffering and rate limiting: queue actions when offline, replay on reconnect, cooldown to prevent spam.
 */

import type { BufferedAction } from "./types";

const actionBuffer: BufferedAction[] = [];
const actionCooldowns = new Map<string, number>();

export const ACTION_COOLDOWN_MS = 200;
export const RAPID_FIRE_ACTIONS = new Set<string>(["bet", "raise", "call", "fold", "check"]);

function requireCooldown(action: string, log: (msg: string) => void): boolean {
  if (!RAPID_FIRE_ACTIONS.has(action)) return true;
  const now = Date.now();
  const lastTime = actionCooldowns.get(action) ?? 0;
  if (now - lastTime < ACTION_COOLDOWN_MS) {
    log(`⏱️ ${action} on cooldown (${(ACTION_COOLDOWN_MS - (now - lastTime)).toFixed(0)}ms)`);
    return false;
  }
  actionCooldowns.set(action, now);
  return true;
}

export type QueueActionDeps = {
  send: (action: string, data: unknown) => void;
  isConnected: () => boolean;
  log: (msg: string) => void;
  bufferStatusEl: HTMLElement;
  maxBufferSize: number;
};

export function queueAction(action: string, data: unknown, deps: QueueActionDeps): void {
  if (!requireCooldown(action, deps.log)) return;
  if (!deps.isConnected()) {
    const buffered: BufferedAction = { action, data, timestamp: Date.now() };
    if (actionBuffer.length >= deps.maxBufferSize) actionBuffer.shift();
    actionBuffer.push(buffered);
    deps.log(`⏱️ ${action} buffered (${actionBuffer.length}/${deps.maxBufferSize})`);
    deps.bufferStatusEl.textContent = `${actionBuffer.length}`;
    deps.bufferStatusEl.style.color = actionBuffer.length > 10 ? "var(--gold)" : "var(--gray-400)";
    return;
  }
  deps.send(action, data);
  deps.bufferStatusEl.textContent = "0";
  deps.bufferStatusEl.style.color = "var(--gray-400)";
}

export type ReplayBufferedActionsDeps = {
  send: (action: string, data: unknown) => void;
  isConnected: () => boolean;
  log: (msg: string) => void;
};

export function replayBufferedActions(deps: ReplayBufferedActionsDeps): void {
  if (actionBuffer.length === 0) return;
  deps.log(`↻ Replaying ${actionBuffer.length} buffered actions...`);
  const actions = [...actionBuffer];
  actionBuffer.length = 0;
  actions.forEach((item, index) => {
    setTimeout(() => {
      if (deps.isConnected()) {
        deps.send(item.action, item.data);
        deps.log(`  ✓ Replayed: ${item.action}`);
      }
    }, index * 50);
  });
}
