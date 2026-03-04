/**
 * PlayerActions.ts
 * Player action handlers: bet, call, check, allIn, raise, fold
 */

import { Client } from "@colyseus/core";
import logger from "../../../config/logger";
import type { IGameRoom } from "../../../types/IGameRoom";
import { Player } from "../../schema/MyRoomState";
import { GameUtils } from "./GameUtils";
import { GameBroadcaster } from "./GameBroadcaster";

export class PlayerActions {
  private utils: GameUtils;
  private broadcaster: GameBroadcaster;

  constructor(private room: IGameRoom) {
    this.utils = new GameUtils(room);
    this.broadcaster = new GameBroadcaster(room);
  }

  handleCheck(client: Client, endTurnCallback: () => void): void {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player check`, {
      player: this.utils.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    if (player.currentBet < this.room.state.currentBet) {
      client.send("error", { message: `${player.name}: cannot check, you need to call or fold` });
      return;
    }

    this.broadcaster.broadcastPlayerAction({
      playerId: client.sessionId,
      action: "check",
      pot: this.room.state.pot
    });

    this.room.playersActedThisRound.add(client.sessionId);
    endTurnCallback();
  }

  handleFold(client: Client, handContributions: Map<string, number>, endTurnCallback: () => void): void {
    if (client.sessionId !== this.room.state.currentTurn) return;

    const player = this.room.state.users.get(client.sessionId);
    if (!player || player.isFolded) return;
    logger.info(`Player fold`, {
      player: this.utils.getPlayerName(client.sessionId),
      roomId: this.room.roomId
    });

    const foldIndex = this.room.playersInHand.indexOf(client.sessionId);
    player.isFolded = true;
    this.utils.removeFromHand(client.sessionId);

    if (this.room.playersInHand.length > 0 && foldIndex !== -1) {
      this.utils.setCurrentPlayerIndexBeforeNextActive(foldIndex);
    }

    this.broadcaster.broadcastPlayerAction({
      playerId: player.sessionId,
      action: "fold"
    });

    if (this.room.playersInHand.length === 1) {
      // One player left - round ends (will be handled by caller)
      return;
    }

    endTurnCallback();
  }

  handleFoldForTimeout(sessionId: string, handContributions: Map<string, number>, endTurnCallback: () => void): void {
    const player = this.room.state.users.get(sessionId);
    if (!player || player.isFolded) return;
    this.handleFold({ sessionId } as Client, handContributions, endTurnCallback);
  }
}
