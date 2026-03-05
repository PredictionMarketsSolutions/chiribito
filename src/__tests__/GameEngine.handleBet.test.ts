import { GameEngine } from '../rooms/game/GameEngine';
import { MyRoomState, Player } from '../rooms/schema/MyRoomState';
import type { IGameRoom } from '../types/IGameRoom';
import type { Client } from '@colyseus/core';

describe('GameEngine.handleBet', () => {
  let engine: GameEngine;
  let mockRoom: jest.Mocked<IGameRoom>;
  let state: MyRoomState;
  let mockClient: Partial<Client>;

  beforeEach(() => {
    // Use fake timers to avoid real setTimeout delays in tests
    jest.useFakeTimers();

    state = new MyRoomState();
    state.currentTurn = 'player1';
    state.currentBet = 0;
    state.pot = 0;

    mockRoom = {
      roomId: 'test-room',
      state,
      clients: [],
      playersInHand: ['player1', 'player2'],
      playersAllIn: new Set(),
      playersActedThisRound: new Set(),
      dealerIndex: 0,
      currentPlayerIndex: 0,
      turnTimeout: null,
      broadcast: jest.fn()
    } as any;

    const player1 = new Player('player1');
    player1.chips = 1000;
    player1.currentBet = 0;
    player1.name = 'Player1';
    state.users.set('player1', player1);

    const player2 = new Player('player2');
    player2.chips = 1000;
    player2.currentBet = 0;
    player2.name = 'Player2';
    state.users.set('player2', player2);

    engine = new GameEngine(mockRoom);

    mockClient = {
      sessionId: 'player1',
      send: jest.fn()
    };
  });

  afterEach(() => {
    // Clean up timers and restore real timers
    if (mockRoom.turnTimeout) {
      clearTimeout(mockRoom.turnTimeout);
    }
    jest.useRealTimers();
  });

  describe('Integration tests (handleBet)', () => {
    test('rejects bet when not player turn', () => {
      state.currentTurn = 'player2';
      engine.handleBet(mockClient as Client, 100);
      expect(state.pot).toBe(0);
    });

    test('rejects bet when player not found', () => {
      mockClient.sessionId = 'nonexistent';
      engine.handleBet(mockClient as Client, 100);
      expect(state.pot).toBe(0);
    });

    test('rejects bet when player is folded', () => {
      const player = state.users.get('player1')!;
      player.isFolded = true;
      engine.handleBet(mockClient as Client, 100);
      expect(state.pot).toBe(0);
    });

    test('rejects bet less than current bet', () => {
      state.currentBet = 100;
      engine.handleBet(mockClient as Client, 50);
      expect(mockClient.send).toHaveBeenCalledWith('error', expect.any(Object));
    });

    test('processes opening bet 100', () => {
      engine.handleBet(mockClient as Client, 100);
      const p1 = state.users.get('player1')!;
      expect(p1.chips).toBe(900);
      expect(p1.currentBet).toBe(100);
      expect(state.pot).toBe(100);
    });

    test('allows raise from 100 to 150', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      p1.currentBet = 100;
      engine.handleBet(mockClient as Client, 150);
      expect(p1.currentBet).toBe(150);
      expect(state.currentBet).toBe(150);
    });

    test('allows all-in with fewer chips', () => {
      const p1 = state.users.get('player1')!;
      p1.chips = 50;
      engine.handleBet(mockClient as Client, 100);
      expect(p1.chips).toBe(0);
      expect(mockRoom.playersAllIn.has('player1')).toBe(true);
    });

    test('broadcasts allIn action', () => {
      const p1 = state.users.get('player1')!;
      p1.chips = 75;
      engine.handleBet(mockClient as Client, 100);
      expect(mockRoom.broadcast).toHaveBeenCalledWith('playerAction', expect.objectContaining({ action: 'allIn' }));
    });

    test('does not mark all-in if chips remain', () => {
      const p1 = state.users.get('player1')!;
      p1.chips = 200;
      engine.handleBet(mockClient as Client, 100);
      expect(mockRoom.playersAllIn.has('player1')).toBe(false);
    });

    test('resets playersActedThisRound on raise', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      p1.currentBet = 100;
      mockRoom.playersActedThisRound.add('player2');
      engine.handleBet(mockClient as Client, 150);
      expect(mockRoom.playersActedThisRound.has('player2')).toBe(false);
      expect(mockRoom.playersActedThisRound.has('player1')).toBe(true);
    });

    test('accumulates pot from multiple players', () => {
      engine.handleBet(mockClient as Client, 100);
      state.currentTurn = 'player2';
      mockClient.sessionId = 'player2';
      mockRoom.playersActedThisRound.clear();
      engine.handleBet(mockClient as Client, 150);
      expect(state.pot).toBe(250);
    });

    test('caps bet to maximum opponent callables', () => {
      const p2 = state.users.get('player2')!;
      p2.chips = 200;
      p2.currentBet = 50;
      engine.handleBet(mockClient as Client, 500);
      const p1 = state.users.get('player1')!;
      expect(p1.currentBet).toBe(250);
    });

    test('prevents negative chip stacks', () => {
      const p1 = state.users.get('player1')!;
      p1.chips = 50;
      engine.handleBet(mockClient as Client, 100);
      expect(p1.chips).toBeGreaterThanOrEqual(0);
    });

    test('does not skip betting round after opening all-in in heads-up', () => {
      const p1 = state.users.get('player1')!;
      const p2 = state.users.get('player2')!;

      // Both players start with chips, heads-up
      p1.chips = 1000;
      p2.chips = 1000;
      state.currentBet = 0;
      state.currentTurn = 'player1';
      mockRoom.currentPlayerIndex = 0;

      const proceedSpy = jest.spyOn(engine as any, 'proceedToNextPhase');

      // Player 1 goes all-in as opening action
      engine.handleAllIn(mockClient as Client);

      // All-in player should be marked and betting round should not be skipped
      expect(mockRoom.playersAllIn.has('player1')).toBe(true);
      expect(proceedSpy).not.toHaveBeenCalled();

      // Turn should move to player 2
      expect(mockRoom.currentPlayerIndex).toBe(1);
      expect(state.currentTurn).toBe('player2');
    });
  });

  describe('_validateBetAction', () => {
    test('rejects when not player turn', () => {
      state.currentTurn = 'player2';
      const result = (engine as any)._validateBetAction(mockClient, 100);
      expect(result.valid).toBe(false);
    });

    test('rejects when player not found', () => {
      mockClient.sessionId = 'nobody';
      const result = (engine as any)._validateBetAction(mockClient, 100);
      expect(result.valid).toBe(false);
    });

    test('rejects when player folded', () => {
      const p1 = state.users.get('player1')!;
      p1.isFolded = true;
      const result = (engine as any)._validateBetAction(mockClient, 100);
      expect(result.valid).toBe(false);
    });

    test('rejects bet below minimum', () => {
      state.currentBet = 100;
      const result = (engine as any)._validateBetAction(mockClient, 50);
      expect(result.valid).toBe(false);
      expect(mockClient.send).toHaveBeenCalledWith('error', expect.any(Object));
    });

    test('accepts valid bet', () => {
      const result = (engine as any)._validateBetAction(mockClient, 100);
      expect(result.valid).toBe(true);
    });

    test('accepts equal to minimum', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      p1.currentBet = 100;
      const result = (engine as any)._validateBetAction(mockClient, 100);
      expect(result.valid).toBe(true);
    });
  });

  describe('_calculateBetAmounts', () => {
    test('calculates opening bet correctly', () => {
      const p1 = state.users.get('player1')!;
      const amounts = (engine as any)._calculateBetAmounts(p1, 100, 0);
      expect(amounts.actualChipsToAdd).toBe(100);
      expect(amounts.actualFinalBet).toBe(100);
      expect(amounts.isRaise).toBe(true);
      expect(amounts.isAllIn).toBe(false);
    });

    test('calculates raise correctly', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      p1.currentBet = 100;
      const amounts = (engine as any)._calculateBetAmounts(p1, 150, 100);
      expect(amounts.actualChipsToAdd).toBe(50);
      expect(amounts.actualFinalBet).toBe(150);
      expect(amounts.isRaise).toBe(true);
    });

    test('calculates call correctly', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      const amounts = (engine as any)._calculateBetAmounts(p1, 100, 100);
      expect(amounts.actualChipsToAdd).toBe(100);
      expect(amounts.actualFinalBet).toBe(100);
      expect(amounts.isRaise).toBe(false);
    });

    test('handles all-in scenario', () => {
      const p1 = state.users.get('player1')!;
      p1.chips = 50;
      const amounts = (engine as any)._calculateBetAmounts(p1, 100, 0);
      expect(amounts.actualChipsToAdd).toBe(50);
      expect(amounts.isAllIn).toBe(true);
    });

    test('caps bet to opponent stack', () => {
      const p2 = state.users.get('player2')!;
      p2.chips = 200;
      p2.currentBet = 50;
      const p1 = state.users.get('player1')!;
      const amounts = (engine as any)._calculateBetAmounts(p1, 500, 0);
      expect(amounts.actualFinalBet).toBeLessThanOrEqual(250);
    });
  });

  describe('_updateGameState', () => {
    test('updates player chips', () => {
      const p1 = state.users.get('player1')!;
      const initialChips = p1.chips;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 100,
        actualFinalBet: 100,
        isAllIn: false,
        isRaise: true,
        prevCurrentBet: 0
      });
      expect(p1.chips).toBe(initialChips - 100);
    });

    test('updates pot', () => {
      const p1 = state.users.get('player1')!;
      const initialPot = state.pot;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 100,
        actualFinalBet: 100,
        isAllIn: false,
        isRaise: true,
        prevCurrentBet: 0
      });
      expect(state.pot).toBe(initialPot + 100);
    });

    test('marks player all-in', () => {
      const p1 = state.users.get('player1')!;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 100,
        actualFinalBet: 100,
        isAllIn: true,
        isRaise: true,
        prevCurrentBet: 0
      });
      expect(mockRoom.playersAllIn.has('player1')).toBe(true);
    });

    test('updates currentBet on raise', () => {
      const p1 = state.users.get('player1')!;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 50,
        actualFinalBet: 150,
        isAllIn: false,
        isRaise: true,
        prevCurrentBet: 100
      });
      expect(state.currentBet).toBe(150);
      expect(state.lastRaiser).toBe('player1');
    });

    test('does not update currentBet on call', () => {
      state.currentBet = 100;
      const p1 = state.users.get('player1')!;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 100,
        actualFinalBet: 100,
        isAllIn: false,
        isRaise: false,
        prevCurrentBet: 100
      });
      expect(state.currentBet).toBe(100);
    });

    test('clears playersActedThisRound on raise', () => {
      mockRoom.playersActedThisRound.add('player2');
      const p1 = state.users.get('player1')!;
      (engine as any)._updateGameState(p1, {
        actualChipsToAdd: 50,
        actualFinalBet: 150,
        isAllIn: false,
        isRaise: true,
        prevCurrentBet: 100
      });
      expect(mockRoom.playersActedThisRound.size).toBe(1);
      expect(mockRoom.playersActedThisRound.has('player1')).toBe(true);
    });
  });

  describe('_broadcastAndEndTurn', () => {
    test('broadcasts bet action', () => {
      const p1 = state.users.get('player1')!;
      (engine as any)._broadcastAndEndTurn(p1, {
        actualChipsToAdd: 100,
        isAllIn: false,
        isRaise: false
      });
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        'playerAction',
        expect.objectContaining({ action: 'bet' })
      );
    });

    test('broadcasts raise action', () => {
      const p1 = state.users.get('player1')!;
      (engine as any)._broadcastAndEndTurn(p1, {
        actualChipsToAdd: 100,
        isAllIn: false,
        isRaise: true
      });
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        'playerAction',
        expect.objectContaining({ action: 'raise' })
      );
    });

    test('broadcasts allIn action', () => {
      const p1 = state.users.get('player1')!;
      (engine as any)._broadcastAndEndTurn(p1, {
        actualChipsToAdd: 75,
        isAllIn: true,
        isRaise: true
      });
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        'playerAction',
        expect.objectContaining({ action: 'allIn', amount: 75 })
      );
    });
  });
});



