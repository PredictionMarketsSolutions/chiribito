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
    seatManager = new SeatManager(roomId, maxSeats);
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

  describe("Clear All", () => {
    it("should clear all seats", () => {
      seatManager.occupySeat(0, 1);
      seatManager.occupySeat(1, 2);

      seatManager.clearAll();

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
  });
});
