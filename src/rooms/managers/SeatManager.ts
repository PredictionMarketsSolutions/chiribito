/**
 * SeatManager.ts
 * Manages player seats, reservations, and rebuy logic
 */

import logger from "../../config/logger";

export class SeatManager {
  private readonly maxSeats: number;
  private occupiedSeats: Set<number> = new Set();

  constructor(
    private roomId: string,
    maxSeats: number = 6
  ) {
    this.maxSeats = maxSeats;
  }

  /**
   * Get the next available seat number
   */
  getNextAvailableSeat(): number | null {
    for (let seatIndex = 0; seatIndex < this.maxSeats; seatIndex++) {
      if (!this.occupiedSeats.has(seatIndex)) {
        return seatIndex;
      }
    }
    return null;
  }

  /**
   * Occupy a seat
   */
  occupySeat(seatIndex: number, userId: number): void {
    if (seatIndex < 0 || seatIndex >= this.maxSeats) {
      throw new Error(`Invalid seat index: ${seatIndex}`);
    }

    if (this.occupiedSeats.has(seatIndex)) {
      logger.warn("Attempted to occupy already taken seat", {
        seatIndex,
        userId,
        roomId: this.roomId
      });
      return;
    }

    this.occupiedSeats.add(seatIndex);
    
    logger.info("Seat occupied", {
      seatIndex,
      userId,
      roomId: this.roomId
    });
  }

  /**
   * Free a seat
   */
  freeSeat(seatIndex: number): void {
    this.occupiedSeats.delete(seatIndex);
    
    logger.info("Seat freed", {
      seatIndex,
      roomId: this.roomId
    });
  }

  /**
   * Check if a seat is occupied
   */
  isSeatOccupied(seatIndex: number): boolean {
    return this.occupiedSeats.has(seatIndex);
  }

  /**
   * Get total occupied seats
   */
  getOccupiedCount(): number {
    return this.occupiedSeats.size;
  }

  /**
   * Clear all seats and reservations (on room dispose)
   */
  clearAll(): void {
    this.occupiedSeats.clear();
    
    logger.info("SeatManager cleared", { roomId: this.roomId });
  }

  /**
   * Get all occupied seat indices
   */
  getOccupiedSeats(): number[] {
    return Array.from(this.occupiedSeats);
  }
}
