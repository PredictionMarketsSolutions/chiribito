/**
 * RebuyManager.ts
 * Handles player rebuy requests and seat reservations after busting out
 */

import { Client } from "@colyseus/core";
import { MyRoomState } from "../schema/MyRoomState";
import logger from "../../config/logger";
import { SeatManager } from "./SeatManager";
import { SessionManager } from "./SessionManager";

export interface RebuyConfig {
  rebuyTimeoutMs: number;
  rebuyAmount: number;
}

export class RebuyManager {
  private readonly config: RebuyConfig;

  constructor(
    private roomId: string,
    config?: Partial<RebuyConfig>
  ) {
    this.config = {
      rebuyTimeoutMs: config?.rebuyTimeoutMs ?? 120000, // 120 seconds default
      rebuyAmount: config?.rebuyAmount ?? 1000
    };
  }

  /**
   * Reserve a seat for a player who busted out (0 chips)
   * Allows time for rebuy decision
   */
  reserveSeat(
    client: Client,
    seatIndex: number,
    userId: number,
    seatManager: SeatManager
  ): void {
    seatManager.reserveSeatForRebuy(seatIndex, userId);

    const timeoutSeconds = Math.round(this.config.rebuyTimeoutMs / 1000);

    // Notify client to show rebuy dialog (frontend listens for this)
    client.send("bustedOut", {
      rebuyCost: this.config.rebuyAmount,
      timeoutSeconds
    });

    // Notify client of reservation (for logging/state)
    client.send("seatReserved", {
      seatIndex,
      expiresIn: this.config.rebuyTimeoutMs
    });

    logger.info(`Seat reserved for rebuy`, {
      sessionId: client.sessionId,
      seatIndex,
      roomId: this.roomId,
      expiresIn: `${this.config.rebuyTimeoutMs}ms`
    });
  }

  /**
   * Process a rebuy request from a player
   */
  handleRebuy(
    client: Client,
    state: MyRoomState,
    seatManager: SeatManager,
    sessionManager: SessionManager,
    broadcastFn: (type: string, message: any) => void
  ): boolean {
    const player = state.users.get(client.sessionId);
    if (!player) {
      client.send("error", { message: "Player not found" });
      return false;
    }

    if (player.chips > 0) {
      client.send("error", { message: "You still have chips, no rebuy needed" });
      return false;
    }

    if (player.seatIndex < 0) {
      client.send("error", { message: "You are not seated" });
      return false;
    }

    const reservation = seatManager.getReservation(player.seatIndex);
    const userId = sessionManager.getUserId(client.sessionId);
    
    if (!reservation || !userId || reservation.userId !== userId) {
      client.send("error", { message: "Seat reservation not found or expired" });
      return false;
    }

    // Remove reservation and rebuy
    seatManager.clearReservation(player.seatIndex);
    player.chips = this.config.rebuyAmount;
    player.isFolded = false;

    client.send("rebuySuccess", {
      chips: this.config.rebuyAmount,
      seatIndex: player.seatIndex
    });

    broadcastFn("playerRebuyed", {
      playerId: client.sessionId,
      playerName: player.name,
      newChips: this.config.rebuyAmount,
      seatIndex: player.seatIndex
    });

    logger.info(`Player rebuyed`, {
      player: player.name,
      sessionId: client.sessionId,
      newChips: this.config.rebuyAmount,
      roomId: this.roomId
    });

    return true;
  }

  /**
   * Get rebuy configuration
   */
  getConfig(): Readonly<RebuyConfig> {
    return { ...this.config };
  }
}
