import logger from '../config/logger';

/**
 * Game action validation and enforcement
 */

export interface GameAction {
  playerId: string;
  type: 'fold' | 'check' | 'call' | 'raise' | 'all_in' | 'sit_out' | 'rejoin';
  amount?: number;
  timestamp: number;
}

export interface GameValidationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

/**
 * Validate a poker action is legal
 */
export function validatePokerAction(
  action: GameAction,
  gameState: {
    roundStarted: boolean;
    currentPlayerIndex: number;
    players: Array<{ id: string; stack: number; folded: boolean; position: number }>;
    minBet: number;
    maxBet: number;
    currentBet: number;
  }
): GameValidationResult {
  // Check 1: Game is active
  if (!gameState.roundStarted) {
    return { valid: false, error: 'Round not started', reason: 'round_not_started' };
  }

  // Check 2: Find player
  const player = gameState.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found', reason: 'player_not_found' };
  }

  // Check 3: Player is not folded
  if (player.folded && action.type !== 'rejoin') {
    return { valid: false, error: 'Player already folded', reason: 'already_folded' };
  }

  // Check 4: Validate action-specific rules
  switch (action.type) {
    case 'fold':
      return { valid: true };

    case 'check':
      if (gameState.currentBet > 0) {
        return { valid: false, error: 'Cannot check when bet is pending', reason: 'cannot_check_with_bet' };
      }
      return { valid: true };

    case 'call':
      if (gameState.currentBet === 0) {
        return { valid: false, error: 'Cannot call with zero bet', reason: 'cannot_call_zero' };
      }
      if (player.stack < gameState.currentBet) {
        return { valid: true }; // All-in call is allowed
      }
      return { valid: true };

    case 'raise':
      if (!action.amount) {
        return { valid: false, error: 'Raise amount required', reason: 'raise_amount_missing' };
      }
      if (action.amount < gameState.minBet) {
        return { valid: false, error: `Raise must be at least ${gameState.minBet}`, reason: 'raise_too_small' };
      }
      if (action.amount > gameState.maxBet && gameState.maxBet > 0) {
        return { valid: false, error: `Raise exceeds maximum ${gameState.maxBet}`, reason: 'raise_too_large' };
      }
      if (action.amount > player.stack) {
        return { valid: false, error: 'Raise amount exceeds player stack', reason: 'insufficient_chips' };
      }
      return { valid: true };

    case 'all_in':
      if (player.stack <= 0) {
        return { valid: false, error: 'Player has no chips', reason: 'no_chips' };
      }
      return { valid: true };

    case 'sit_out':
      return { valid: true };

    case 'rejoin':
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown action type', reason: 'unknown_action' };
  }
}

/**
 * Validate bet amount is reasonable
 */
export function validateBetAmount(
  amount: number,
  playerStack: number,
  minBet: number,
  maxBet: number
): GameValidationResult {
  if (amount <= 0) {
    return { valid: false, error: 'Bet must be positive', reason: 'non_positive_bet' };
  }

  if (amount < minBet) {
    return { valid: false, error: `Bet below minimum (${minBet})`, reason: 'below_minimum_bet' };
  }

  if (maxBet > 0 && amount > maxBet) {
    return { valid: false, error: `Bet exceeds maximum (${maxBet})`, reason: 'exceeds_maximum_bet' };
  }

  if (amount > playerStack) {
    return { valid: false, error: 'Bet exceeds player stack', reason: 'insufficient_chips' };
  }

  return { valid: true };
}

/**
 * Validate player can act (right turn, correct position)
 */
export function validatePlayerTurn(
  playerId: string,
  currentPlayerIndex: number,
  players: Array<{ id: string; folded: boolean; allIn: boolean }>,
  gameState: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
): GameValidationResult {
  const currentPlayer = players[currentPlayerIndex];
  
  if (!currentPlayer) {
    return { valid: false, error: 'Invalid player index', reason: 'invalid_index' };
  }

  if (currentPlayer.id !== playerId) {
    return { valid: false, error: 'Not your turn', reason: 'not_your_turn' };
  }

  if (currentPlayer.folded) {
    return { valid: false, error: 'You have folded', reason: 'player_folded' };
  }

  if (currentPlayer.allIn) {
    return { valid: false, error: 'You are all-in', reason: 'player_all_in' };
  }

  if (gameState === 'showdown') {
    return { valid: false, error: 'Game is in showdown phase', reason: 'showdown_phase' };
  }

  return { valid: true };
}

/**
 * Log game action for audit
 */
export function logGameAction(
  action: GameAction,
  roomId: string,
  valid: boolean,
  error?: string
): void {
  const level = valid ? 'debug' : 'warn';
  const logFn = level === 'debug' ? logger.debug : logger.warn;

  logFn('[GAME_ACTION]', {
    roomId,
    playerId: action.playerId,
    actionType: action.type,
    amount: action.amount,
    valid,
    error,
    timestamp: new Date(action.timestamp).toISOString(),
  });
}

/**
 * Validate game state consistency
 */
export function validateGameStateConsistency(
  gameState: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check total chips
  let totalChips = 0;
  if (gameState.players && Array.isArray(gameState.players)) {
    gameState.players.forEach((player: any) => {
      if (typeof player.stack !== 'number' || player.stack < 0) {
        errors.push(`Invalid chips for player ${player.id}: ${player.stack}`);
      } else {
        totalChips += player.stack;
      }
    });
  }

  // Chips shouldn't change unless dealt from deck or won from pot
  if (totalChips < 0) {
    errors.push('Total chips is negative');
  }

  // Check current bet validity
  if (typeof gameState.currentBet !== 'number' || gameState.currentBet < 0) {
    errors.push('Invalid current bet');
  }

  // Check pot validity
  if (typeof gameState.pot !== 'number' || gameState.pot < 0) {
    errors.push('Invalid pot amount');
  }

  // Check dealer index
  if (typeof gameState.dealerIndex !== 'number' || gameState.dealerIndex < -1 || gameState.dealerIndex >= (gameState.players?.length || 0)) {
    errors.push('Invalid dealer index');
  }

  // Check community cards
  if (gameState.communityCards && Array.isArray(gameState.communityCards)) {
    if (gameState.communityCards.length > 5) {
      errors.push('Too many community cards');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
