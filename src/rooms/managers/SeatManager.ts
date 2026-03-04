/**
 * SeatManager.ts
 * Manages player seats, reservations, and rebuy logic
 */

import logger from "../../config/logger";

export interface SeatReservation {
  userId: number;
  expiresAt: number;
}

export class SeatManager {
  private readonly maxSeats: number;
  private occupiedSeats: Set<number> = new Set();
  private rebuySeatReservations: Map<number, SeatReservation> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private roomId: string,
    maxSeats: number = 6,
    private reservationTimeoutMs: number = 180000 // 3 minutes
  ) {
    this.maxSeats = maxSeats;
    this.startCleanupTask();
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
   * Reserve a seat for rebuy (temporary hold)
   */
  reserveSeatForRebuy(seatIndex: number, userId: number): void {
    const expiresAt = Date.now() + this.reservationTimeoutMs;
    
    this.rebuySeatReservations.set(seatIndex, {
      userId,
      expiresAt
    });

    logger.info("Seat reserved for rebuy", {
      seatIndex,
      userId,
      expiresAt,
      roomId: this.roomId
    });
  }

  /**
   * Check if a seat is reserved for rebuy
   */
  isSeatReservedForRebuy(seatIndex: number): boolean {
    const reservation = this.rebuySeatReservations.get(seatIndex);
    if (!reservation) return false;

    // Check if expired
    if (Date.now() > reservation.expiresAt) {
      this.rebuySeatReservations.delete(seatIndex);
      return false;
    }

    return true;
  }

  /**
   * Get reservation for a seat
   */
  getReservation(seatIndex: number): SeatReservation | undefined {
    const reservation = this.rebuySeatReservations.get(seatIndex);
    if (!reservation) return undefined;

    // Check if expired
    if (Date.now() > reservation.expiresAt) {
      this.rebuySeatReservations.delete(seatIndex);
      return undefined;
    }

    return reservation;
  }

  /**
   * Clear a rebuy reservation
   */
  clearReservation(seatIndex: number): void {
    this.rebuySeatReservations.delete(seatIndex);
    
    logger.info("Seat reservation cleared", {
      seatIndex,
      roomId: this.roomId
    });
  }

  /**
   * Clean up expired reservations (called periodically)
   */
  private cleanupExpiredReservations(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [seatIndex, reservation] of this.rebuySeatReservations.entries()) {
      if (now > reservation.expiresAt) {
        this.rebuySeatReservations.delete(seatIndex);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info("Expired reservations cleaned", {
        count: expiredCount,
        roomId: this.roomId
      });
    }
  }

  /**
   * Start periodic cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations();
    }, 60000);
  }

  /**
   * Stop cleanup task
   */
  private stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all seats and reservations (on room dispose)
   */
  clearAll(): void {
    this.stopCleanupTask();
    this.occupiedSeats.clear();
    this.rebuySeatReservations.clear();
    
    logger.info("SeatManager cleared", { roomId: this.roomId });
  }

  /**
   * Get all occupied seat indices
   */
  getOccupiedSeats(): number[] {
    return Array.from(this.occupiedSeats);
  }
}
