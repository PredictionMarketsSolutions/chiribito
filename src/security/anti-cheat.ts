import logger from '../config/logger';

/**
 * Anti-Cheat System for Game Server
 * Detects suspicious player behavior and actions
 */

export interface CheatDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action?: 'warn' | 'flag' | 'ban';
}

export interface PlayerBehavior {
  playerId: string;
  actionCount: number;
  lastActionTime: number;
  actionsPerSecond: number;
  suspiciousActions: number;
  isAllIn: boolean;
  chipChange: number;
  connectedTime: number;
}

/**
 * Detect impossible or suspicious actions
 */
export function detectSuspiciousAction(
  playerId: string,
  actionType: 'fold' | 'check' | 'call' | 'raise' | 'all_in',
  currentBet: number,
  playerStack: number,
  gamePhase: string,
  behaviorHistory: PlayerBehavior
): CheatDetectionResult {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check 1: Negative stack (impossible)
  if (playerStack < 0) {
    reasons.push('Negative chip stack detected');
    severity = 'critical';
  }

  // Check 2: Action on negative bet
  if (currentBet < 0) {
    reasons.push('Negative bet detected');
    severity = 'critical';
  }

  // Check 3: Call with insufficient chips
  if (actionType === 'call' && playerStack < currentBet) {
    reasons.push('Call action with insufficient chips');
    severity = 'critical';
  }

  // Check 4: Impossible raise
  if (actionType === 'raise' && playerStack < currentBet * 2) {
    reasons.push('Raise amount exceeds player stack');
    severity = 'critical';
  }

  // Check 5: Double action in same round
  if (behaviorHistory.actionCount > 2 && gamePhase !== 'new_round') {
    reasons.push('Multiple actions in same round');
    severity = 'high';
  }

  // Check 6: Superhuman reaction time (< 100ms between decisions)
  const timeSinceLastAction = Date.now() - behaviorHistory.lastActionTime;
  if (behaviorHistory.actionCount > 0 && timeSinceLastAction < 100) {
    reasons.push('Impossibly fast action timing');
    severity = 'high';
  }

  // Check 7: Extreme actions per second (> 10 APS)
  if (behaviorHistory.actionsPerSecond > 10) {
    reasons.push('Excessive action rate detected');
    severity = 'high';
  }

  // Check 8: All-in spam (going all-in more than twice per session)
  if (actionType === 'all_in' && behaviorHistory.suspiciousActions > 2) {
    reasons.push('Repeated all-in actions');
    severity = 'medium';
  }

  // Determine action based on severity
  let action: 'warn' | 'flag' | 'ban' = 'warn';
  if (severity === 'high') {
    action = 'flag';
  } else if (severity === 'critical') {
    action = 'ban';
  }

  return {
    detected: reasons.length > 0,
    severity,
    reasons,
    action,
  };
}

/**
 * Detect packet manipulation or impossible game states
 */
export function detectStateManipulation(
  playerId: string,
  reportedState: any,
  actualState: any
): CheatDetectionResult {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check 1: Chip counts mismatch
  if (reportedState.chips !== actualState.chips) {
    reasons.push(`Chip mismatch: reported=${reportedState.chips}, actual=${actualState.chips}`);
    severity = 'critical';
  }

  // Check 2: Hand mismatch
  if (reportedState.hand?.cards && actualState.hand?.cards) {
    if (JSON.stringify(reportedState.hand.cards) !== JSON.stringify(actualState.hand.cards)) {
      reasons.push('Hand cards mismatch');
      severity = 'critical';
    }
  }

  // Check 3: Position mismatch
  if (reportedState.position !== actualState.position) {
    reasons.push('Player position mismatch');
    severity = 'high';
  }

  // Check 4: Bet mismatch
  if (reportedState.currentBet && reportedState.currentBet !== actualState.currentBet) {
    reasons.push(`Bet mismatch: reported=${reportedState.currentBet}, actual=${actualState.currentBet}`);
    severity = 'high';
  }

  const action = severity === 'critical' ? 'ban' : severity === 'high' ? 'flag' : 'warn';

  return {
    detected: reasons.length > 0,
    severity,
    reasons,
    action,
  };
}

/**
 * Detect collusion patterns (multiple players coordinating)
 */
export function detectCollusion(
  players: Array<{ id: string; winRate: number; lastActions: string[]; }>,
): Array<{ playerPair: [string, string]; suspicionScore: number; reasons: string[] }> {
  const suspicions: Array<{ playerPair: [string, string]; suspicionScore: number; reasons: string[] }> = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      const reasons: string[] = [];
      let score = 0;

      // Check 1: Frequent same actions (folding together, raising together)
      const commonActions = player1.lastActions.filter(a => player2.lastActions.includes(a)).length;
      if (commonActions > player1.lastActions.length * 0.7) {
        reasons.push('Suspiciously coordinated actions');
        score += 30;
      }

      // Check 2: Similar win rates (both winning too much)
      if (player1.winRate > 0.6 && player2.winRate > 0.6) {
        reasons.push('Both players have unusually high win rates');
        score += 20;
      }

      if (score > 30) {
        suspicions.push({
          playerPair: [player1.id, player2.id],
          suspicionScore: score,
          reasons,
        });
      }
    }
  }

  return suspicions;
}

/**
 * Network-based cheat detection
 */
export function detectNetworkAnomaly(
  playerId: string,
  latency: number,
  packetLoss: number,
  jitter: number
): CheatDetectionResult {
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check 1: Extreme latency variance (possible time-dilation attack)
  if (jitter > 1000) {
    reasons.push('Extreme latency jitter detected');
    severity = 'medium';
  }

  // Check 2: Zero latency (impossible, likely spoofed)
  if (latency < 10) {
    reasons.push('Impossibly low latency (likely spoofed)');
    severity = 'high';
  }

  // Check 3: Consistent low latency while other players high (possible local game)
  if (latency < 50 && packetLoss === 0) {
    reasons.push('Suspiciously perfect network conditions');
    severity = 'low'; // Just a warning
  }

  return {
    detected: reasons.length > 0,
    severity,
    reasons,
  };
}

/**
 * Log cheat detection event
 */
export function logCheatDetection(
  playerId: string,
  detection: CheatDetectionResult,
  gameContext: Record<string, any> = {}
): void {
  logger.warn('[CHEAT_DETECTION]', {
    playerId,
    severity: detection.severity,
    detected: detection.detected,
    reasons: detection.reasons,
    recommendedAction: detection.action,
    timestamp: new Date().toISOString(),
    ...gameContext,
  });
}
