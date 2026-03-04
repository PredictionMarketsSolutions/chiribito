/**
 * SeatManager.test.ts
 * Unit tests for SeatManager
 */

import { SeatManager } from "../rooms/managers/SeatManager";

describe("SeatManager", () => {
  let seatManager: SeatManager;
  const roomId = "test-room-123";
  const maxSeats = 6;

  beforeEach(() => {
    jest.useFakeTimers();
    seatManager = new SeatManager(roomId, maxSeats, 180000);
  });

  afterEach(() => {
    seatManager.clearAll();
    jest.useRealTimers();
  });

  describe("Seat Occupation", () => {
    it("should get next available seat", () => {
      const seat = seatManager.getNextAvailableSeat();
      expect(seat).toBe(0);
    });

    it("should occupy a seat", () => {
      seatManager.occupySeat(0, 1);

      expect(seatManager.isSeatOccupied(0)).toBe(true);
      expect(seatManager.getOccupiedCount()).toBe(1);
    });

    it("should get next available seat after occupation", () => {
      seatManager.occupySeat(0, 1);

      const nextSeat = seatManager.getNextAvailableSeat();
      expect(nextSeat).toBe(1);
    });

    it("should return null when all seats are occupied", () => {
      for (let i = 0; i < maxSeats; i++) {
        seatManager.occupySeat(i, i + 1);
      }

      const nextSeat = seatManager.getNextAvailableSeat();
      expect(nextSeat).toBeNull();
    });

    it("should throw error for invalid seat index", () => {
      expect(() => {
        seatManager.occupySeat(-1, 1);
      }).toThrow("Invalid seat index: -1");

      expect(() => {
        seatManager.occupySeat(maxSeats, 1);
      }).toThrow(`Invalid seat index: ${maxSeats}`);
    });

    it("should handle occupying already taken seat gracefully", () => {
      seatManager.occupySeat(0, 1);

      expect(() => {
        seatManager.occupySeat(0, 2);
      }).not.toThrow();

      // Seat should still be occupied
      expect(seatManager.isSeatOccupied(0)).toBe(true);
    });
  });

  describe("Seat Freeing", () => {
    it("should free an occupied seat", () => {
      seatManager.occupySeat(0, 1);
      seatManager.freeSeat(0);

      expect(seatManager.isSeatOccupied(0)).toBe(false);
      expect(seatManager.getOccupiedCount()).toBe(0);
    });

    it("should make freed seat available again", () => {
      seatManager.occupySeat(0, 1);
      seatManager.occupySeat(1, 2);
      seatManager.freeSeat(0);

      const nextSeat = seatManager.getNextAvailableSeat();
      expect(nextSeat).toBe(0);
    });

    it("should handle freeing already free seat", () => {
      expect(() => {
        seatManager.freeSeat(0);
      }).not.toThrow();
    });
  });

  describe("Seat Counting", () => {
    it("should count occupied seats correctly", () => {
      expect(seatManager.getOccupiedCount()).toBe(0);

      seatManager.occupySeat(0, 1);
      expect(seatManager.getOccupiedCount()).toBe(1);

      seatManager.occupySeat(2, 2);
      expect(seatManager.getOccupiedCount()).toBe(2);

      seatManager.freeSeat(0);
      expect(seatManager.getOccupiedCount()).toBe(1);
    });

    it("should get all occupied seats", () => {
      seatManager.occupySeat(1, 1);
      seatManager.occupySeat(3, 2);
      seatManager.occupySeat(5, 3);

      const occupiedSeats = seatManager.getOccupiedSeats();
      
      expect(occupiedSeats).toHaveLength(3);
      expect(occupiedSeats).toContain(1);
      expect(occupiedSeats).toContain(3);
      expect(occupiedSeats).toContain(5);
    });
  });

  describe("Rebuy Reservations", () => {
    it("should reserve a seat for rebuy", () => {
      const seatIndex = 2;
      const userId = 1;

      seatManager.reserveSeatForRebuy(seatIndex, userId);

      expect(seatManager.isSeatReservedForRebuy(seatIndex)).toBe(true);
    });

    it("should get reservation details", () => {
      const seatIndex = 2;
      const userId = 1;

      seatManager.reserveSeatForRebuy(seatIndex, userId);
      const reservation = seatManager.getReservation(seatIndex);

      expect(reservation).toBeDefined();
      expect(reservation?.userId).toBe(userId);
      expect(reservation?.expiresAt).toBeGreaterThan(Date.now());
    });

    it("should clear reservation", () => {
      const seatIndex = 2;

      seatManager.reserveSeatForRebuy(seatIndex, 1);
      seatManager.clearReservation(seatIndex);

      expect(seatManager.isSeatReservedForRebuy(seatIndex)).toBe(false);
    });

    it("should expire reservations after timeout", () => {
      const seatIndex = 2;
      const reservationTimeoutMs = 180000;

      seatManager.reserveSeatForRebuy(seatIndex, 1);

      // Advance time beyond reservation timeout
      jest.advanceTimersByTime(reservationTimeoutMs + 1000);

      expect(seatManager.isSeatReservedForRebuy(seatIndex)).toBe(false);
    });

    it("should return undefined for expired reservation", () => {
      const seatIndex = 2;
      const reservationTimeoutMs = 180000;

      seatManager.reserveSeatForRebuy(seatIndex, 1);
      jest.advanceTimersByTime(reservationTimeoutMs + 1000);

      const reservation = seatManager.getReservation(seatIndex);
      expect(reservation).toBeUndefined();
    });

    it("should clean up expired reservations periodically", () => {
      seatManager.reserveSeatForRebuy(0, 1);
      seatManager.reserveSeatForRebuy(1, 2);

      // Advance time to expire reservations
      jest.advanceTimersByTime(180000 + 1000);

      // Trigger cleanup (runs every 60 seconds)
      jest.advanceTimersByTime(60000);

      expect(seatManager.isSeatReservedForRebuy(0)).toBe(false);
      expect(seatManager.isSeatReservedForRebuy(1)).toBe(false);
    });

    it("should allow multiple reservations for different seats", () => {
      seatManager.reserveSeatForRebuy(0, 1);
      seatManager.reserveSeatForRebuy(2, 2);
      seatManager.reserveSeatForRebuy(4, 3);

      expect(seatManager.isSeatReservedForRebuy(0)).toBe(true);
      expect(seatManager.isSeatReservedForRebuy(2)).toBe(true);
      expect(seatManager.isSeatReservedForRebuy(4)).toBe(true);
    });
  });

  describe("Clear All", () => {
    it("should clear all seats and reservations", () => {
      seatManager.occupySeat(0, 1);
      seatManager.occupySeat(1, 2);
      seatManager.reserveSeatForRebuy(3, 3);

      seatManager.clearAll();

      expect(seatManager.getOccupiedCount()).toBe(0);
      expect(seatManager.isSeatReservedForRebuy(3)).toBe(false);
    });

    it("should stop cleanup task", () => {
      seatManager.clearAll();
      
      // Advance time and verify no cleanup happens
      jest.advanceTimersByTime(60000);
      
      // If cleanup was running, it would throw or log
      // This is a smoke test to ensure no errors
      expect(seatManager.getOccupiedCount()).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle seat 0 correctly", () => {
      seatManager.occupySeat(0, 1);
      expect(seatManager.isSeatOccupied(0)).toBe(true);
    });

    it("should handle last seat correctly", () => {
      const lastSeat = maxSeats - 1;
      seatManager.occupySeat(lastSeat, 1);
      expect(seatManager.isSeatOccupied(lastSeat)).toBe(true);
    });

    it("should handle overwriting reservation", () => {
      const seatIndex = 2;

      seatManager.reserveSeatForRebuy(seatIndex, 1);
      seatManager.reserveSeatForRebuy(seatIndex, 2);

      const reservation = seatManager.getReservation(seatIndex);
      expect(reservation?.userId).toBe(2);
    });

    it("should handle reservation check for non-existent reservation", () => {
      expect(seatManager.isSeatReservedForRebuy(99)).toBe(false);
    });
  });

  describe("Integration: Occupation + Reservation", () => {
    it("should allow occupying a reserved seat", () => {
      const seatIndex = 2;

      seatManager.reserveSeatForRebuy(seatIndex, 1);
      seatManager.occupySeat(seatIndex, 1);

      expect(seatManager.isSeatOccupied(seatIndex)).toBe(true);
      // Reservation is independent of occupation
      expect(seatManager.isSeatReservedForRebuy(seatIndex)).toBe(true);
    });

    it("should allow freeing an occupied seat with reservation", () => {
      const seatIndex = 2;

      seatManager.occupySeat(seatIndex, 1);
      seatManager.reserveSeatForRebuy(seatIndex, 1);
      seatManager.freeSeat(seatIndex);

      expect(seatManager.isSeatOccupied(seatIndex)).toBe(false);
      expect(seatManager.isSeatReservedForRebuy(seatIndex)).toBe(true);
    });
  });
});
