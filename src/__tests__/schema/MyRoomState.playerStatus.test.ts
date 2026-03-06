/**
 * Tests for Player.playerStatus and PLAYER_STATUS constants.
 * Ensures allowed values and default; security: only server sets this field.
 */

import { Player, PLAYER_STATUS } from "../../rooms/schema/MyRoomState";

describe("Player.playerStatus (schema)", () => {
  it("PLAYER_STATUS has expected values", () => {
    expect(PLAYER_STATUS.SEATED).toBe("seated");
    expect(PLAYER_STATUS.IN_HAND).toBe("in_hand");
  });

  it("new Player has default playerStatus seated", () => {
    const player = new Player("session-1");
    expect(player.playerStatus).toBe(PLAYER_STATUS.SEATED);
  });

  it("playerStatus is writable by server (string)", () => {
    const player = new Player("session-1");
    player.playerStatus = PLAYER_STATUS.IN_HAND;
    expect(player.playerStatus).toBe("in_hand");
    player.playerStatus = PLAYER_STATUS.SEATED;
    expect(player.playerStatus).toBe("seated");
  });
});
