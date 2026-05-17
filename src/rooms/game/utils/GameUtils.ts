/**
 * GameUtils.ts
 * General utility functions for game logic
 */

import type { IGameRoom } from "../../../types/IGameRoom";
import { Player } from "../../schema/MesaState";

export class GameUtils {
  constructor(private room: IGameRoom) {}

  getPlayerName(sessionId: string): string {
    return this.room.state.users.get(sessionId)?.name ?? sessionId;
  }

  getPlayersWithChips(): Player[] {
    return Array.from(this.room.state.users.values()).filter(p => p.chips > 0);
  }

  getPlayersInHandNonFolded(): string[] {
    return this.room.playersInHand.filter(id => {
      const player = this.room.state.users.get(id);
      return player && !player.isFolded;
    });
  }

  getActivePlayerIds(): string[] {
    return this.room.playersInHand
      .filter(id => !this.room.state.users.get(id)!.isFolded)
      .filter(id => !this.room.playersAllIn.has(id));
  }

  getNextActiveIndexFrom(startIndex: number): number {
    const totalPlayers = this.room.playersInHand.length;
    if (totalPlayers === 0) return -1;

    // Cache active indexes - O(n) operation done once
    const activeIndexes = this.room.playersInHand
      .map((playerId, idx) => {
        const player = this.room.state.users.get(playerId);
        const isActive = player && !player.isFolded && !this.room.playersAllIn.has(playerId);
        return isActive ? idx : -1;
      })
      .filter(idx => idx !== -1);

    if (activeIndexes.length === 0) return -1;

    // Find next active from startIndex - O(k) where k = active players
    const nextIdx = activeIndexes.find(idx => idx > startIndex);
    return nextIdx !== undefined ? nextIdx : activeIndexes[0];
  }

  removeFromHand(sessionId: string): void {
    this.room.playersInHand = this.room.playersInHand.filter(id => id !== sessionId);
  }

  addToPot(amount: number, playerId?: string, handContributions?: Map<string, number>): void {
    this.room.state.pot += amount;
    if (playerId && handContributions) {
      handContributions.set(playerId, (handContributions.get(playerId) ?? 0) + amount);
    }
  }

  setCurrentPlayerIndexBeforeNextActive(fromIndex: number): void {
    const totalPlayers = this.room.playersInHand.length;
    if (totalPlayers === 0) return;

    let candidateIndex = fromIndex - 1;
    if (candidateIndex < 0) {
      candidateIndex = totalPlayers - 1;
    }

    let safety = totalPlayers;
    while (safety > 0) {
      const candidateId = this.room.playersInHand[candidateIndex];
      const candidate = this.room.state.users.get(candidateId);
      if (candidate && !candidate.isFolded && !this.room.playersAllIn.has(candidateId)) {
        this.room.currentPlayerIndex = candidateIndex;
        return;
      }
      candidateIndex -= 1;
      if (candidateIndex < 0) {
        candidateIndex = totalPlayers - 1;
      }
      safety -= 1;
    }

    this.room.currentPlayerIndex = candidateIndex;
  }
}
