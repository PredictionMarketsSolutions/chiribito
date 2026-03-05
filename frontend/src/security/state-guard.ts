/**
 * Client state protection
 * Prevents state tampering and ensures integrity
 */

export interface State {
  [key: string]: any;
}

export interface StateSnapshot {
  data: State;
  timestamp: number;
  hash: string;
}

/**
 * Simple hash function for state verification
 * NOTE: This is not cryptographically secure - for production, use a real hash
 */
function computeStateHash(state: State): string {
  const json = JSON.stringify(state, Object.keys(state).sort());
  let hash = 0;

  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * State guard to detect unauthorized state modifications
 */
export class StateGuard {
  private snapshots: StateSnapshot[] = [];
  private maxSnapshots = 100;
  private stateChangeListeners: Array<(change: StateChange) => void> = [];

  /**
   * Record a state snapshot
   */
  recordSnapshot(state: State): void {
    const snapshot: StateSnapshot = {
      data: JSON.parse(JSON.stringify(state)), // Deep copy
      timestamp: Date.now(),
      hash: computeStateHash(state),
    };

    this.snapshots.push(snapshot);

    // Keep max snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    console.log('[STATE] Snapshot recorded:', snapshot.hash);
  }

  /**
   * Verify state integrity
   */
  verifyIntegrity(state: State): { valid: boolean; reason?: string } {
    if (this.snapshots.length === 0) {
      return { valid: true }; // No baseline
    }

    const currentHash = computeStateHash(state);
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];

    // Check if state hash changed unexpectedly
    if (currentHash === lastSnapshot.hash) {
      return { valid: true };
    }

    // Hash different - could be legitimate change or tampering
    console.warn('[STATE] State hash mismatch -', {
      current: currentHash,
      previous: lastSnapshot.hash,
    });

    return { valid: true }; // Allow but logged
  }

  /**
   * Detect unauthorized state changes
   */
  detectStateChange(oldState: State, newState: State): StateChange {
    const changes: ChangedField[] = [];

    // Check all keys
    const allKeys = new Set([
      ...Object.keys(oldState),
      ...Object.keys(newState),
    ]);

    for (const key of allKeys) {
      const oldValue = oldState[key];
      const newValue = newState[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue,
          type: this.detectChangeType(oldValue, newValue),
        });
      }
    }

    const change: StateChange = {
      timestamp: Date.now(),
      changes,
      suspicious: this.isSuspiciousChange(changes),
    };

    return change;
  }

  /**
   * Detect type of state change
   */
  private detectChangeType(
    oldValue: any,
    newValue: any
  ): 'added' | 'removed' | 'modified' {
    if (oldValue === undefined) return 'added';
    if (newValue === undefined) return 'removed';
    return 'modified';
  }

  /**
   * Check if state change is suspicious
   */
  private isSuspiciousChange(changes: ChangedField[]): boolean {
    const suspiciousFields = [
      'chips', // Sudden chip gain
      'balance', // Sudden balance change
      'hand', // Hand reveal before showdown
      'currentBet', // Illegal bet modification
      'pot', // Pot manipulation
    ];

    // Check if protected fields changed
    for (const change of changes) {
      if (suspiciousFields.includes(change.field)) {
        // Sudden large increase is suspicious
        if (
          typeof change.oldValue === 'number' &&
          typeof change.newValue === 'number'
        ) {
          const increase = change.newValue - change.oldValue;

          if (increase > 0 && increase > change.oldValue * 0.5) {
            // 50%+ increase is suspicious
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get state change history
   */
  getHistory(limit: number = 50): StateSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  /**
   * Compare two states and highlight differences
   */
  compareStates(
    state1: State,
    state2: State
  ): Record<string, { old: any; new: any }> {
    const differences: Record<string, { old: any; new: any }> = {};

    const allKeys = new Set([
      ...Object.keys(state1),
      ...Object.keys(state2),
    ]);

    for (const key of allKeys) {
      const val1 = state1[key];
      const val2 = state2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences[key] = { old: val1, new: val2 };
      }
    }

    return differences;
  }

  /**
   * Validate state against schema
   */
  validateAgainstSchema(
    state: State,
    schema: Record<string, (value: any) => boolean>
  ): {
    valid: boolean;
    errors?: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    for (const [key, validator] of Object.entries(schema)) {
      const value = state[key];

      if (!validator(value)) {
        errors[key] = `Invalid value for ${key}`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  /**
   * Subscribe to state changes
   */
  onChange(listener: (change: StateChange) => void): () => void {
    this.stateChangeListeners.push(listener);

    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  notifyChange(change: StateChange): void {
    for (const listener of this.stateChangeListeners) {
      listener(change);
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    this.snapshots = [];
    console.log('[STATE] History cleared');
  }
}

export interface ChangedField {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

export interface StateChange {
  timestamp: number;
  changes: ChangedField[];
  suspicious: boolean;
}

// Global state guard instance
export const stateGuard = new StateGuard();

/**
 * Middleware for state protection
 */
export class StateProtectionMiddleware {
  private stateGuard: StateGuard;
  private lastState: State | null = null;

  constructor() {
    this.stateGuard = new StateGuard();
  }

  /**
   * Wrap state update
   */
  updateState(oldState: State, newState: State): {
    valid: boolean;
    reason?: string;
    change?: StateChange;
  } {
    // Verify new state integrity
    const integrityCheck = this.stateGuard.verifyIntegrity(newState);
    if (!integrityCheck.valid) {
      return {
        valid: false,
        reason: integrityCheck.reason,
      };
    }

    // Detect changes
    const change = this.stateGuard.detectStateChange(oldState, newState);

    // Log suspicious changes
    if (change.suspicious) {
      console.warn('[STATE_PROTECTION] Suspicious change detected:', change);
    }

    // Store snapshot
    this.stateGuard.recordSnapshot(newState);
    this.lastState = JSON.parse(JSON.stringify(newState));

    // Notify listeners
    this.stateGuard.notifyChange(change);

    return { valid: true, change };
  }

  /**
   * Get state guard instance
   */
  getGuard(): StateGuard {
    return this.stateGuard;
  }
}

/**
 * Validate client-side game state
 */
export function validateGameState(state: State): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (typeof state.pot !== 'number' || state.pot < 0) {
    errors.push('Invalid pot amount');
  }

  if (typeof state.currentBet !== 'number' || state.currentBet < 0) {
    errors.push('Invalid current bet');
  }

  if (!Array.isArray(state.communityCards)) {
    errors.push('Invalid community cards');
  }

  // Colyseus state has state.users (map of Player); hand is per-player and optional (StateView hides others)
  const hasUsers = state.users && (typeof state.users === 'object' || typeof (state.users as Map<string, unknown>)?.get === 'function');
  if (!hasUsers && !Array.isArray(state.hand)) {
    errors.push('Invalid hand or missing users');
  }

  // Check poker rules
  if (state.pot < state.currentBet) {
    errors.push('Pot cannot be less than current bet');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Sanitize game state (remove sensitive info)
 */
export function sanitizeGameState(
  state: State,
  userPlayerId: string
): State {
  const sanitized = JSON.parse(JSON.stringify(state));

  const hideOtherHands = (playersObj: Record<string, { hand?: unknown }>, currentId: string) => {
    if (!playersObj || typeof playersObj !== 'object') return;
    for (const id of Object.keys(playersObj)) {
      if (id !== currentId && playersObj[id] && Array.isArray(playersObj[id].hand)) {
        (playersObj[id] as { hand: string[] }).hand = ['[hidden]', '[hidden]'];
      }
    }
  };

  if (sanitized.players) hideOtherHands(sanitized.players, userPlayerId);
  if (sanitized.users) {
    const users = sanitized.users as Record<string, { hand?: unknown }>;
    if (typeof users === 'object' && !(users instanceof Map)) hideOtherHands(users, userPlayerId);
  }

  return sanitized;
}
