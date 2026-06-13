/**
 * Tests for Player.playerStatus and PLAYER_STATUS constants.
 * Ensures allowed values and default; security: only server sets this field.
 */

import { Player, PLAYER_STATUS } from "../../rooms/schema/MesaState";

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

describe("Player.isBot (schema)", () => {
  it("new Player has isBot === false by default", () => {
    const player = new Player("session-1");
    expect(player.isBot).toBe(false);
  });

  it("isBot is writable by server (server-set only)", () => {
    const player = new Player("session-1");
    player.isBot = true;
    expect(player.isBot).toBe(true);
    player.isBot = false;
    expect(player.isBot).toBe(false);
  });
});

describe("Player schema — trait privacy invariant (SC3)", () => {
  it("avatar field is present on a new Player with default empty string", () => {
    const player = new Player("x");
    // RED: 'avatar' in player must be true — fails until @type("string") avatar is added
    expect("avatar" in player).toBe(true);
    expect(player.avatar).toBe("");
  });

  it("public serialized fields are present on Player", () => {
    const player = new Player("x");
    expect("sessionId" in player).toBe(true);
    expect("name" in player).toBe(true);
    expect("isBot" in player).toBe(true);
    expect("chips" in player).toBe(true);
    expect("currentBet" in player).toBe(true);
    expect("isFolded" in player).toBe(true);
    expect("seatIndex" in player).toBe(true);
    expect("playerStatus" in player).toBe(true);
    // hand is @view() but still a field
    expect("hand" in player).toBe(true);
  });

  it("strategy trait fields are NEVER present on Player (never serialize)", () => {
    const player = new Player("x");
    // These fields live ONLY in BotProfile; they must NEVER appear on Player.
    // If any gets @type accidentally, this assertion flips to red — privacy breach.
    expect("aggression" in player).toBe(false);
    expect("bluffFreq" in player).toBe(false);
    expect("tightness" in player).toBe(false);
    expect("lines" in player).toBe(false);
    expect("thinkMsRange" in player).toBe(false);
  });

  it("avatar is writable and defaults to empty string", () => {
    const player = new Player("x");
    player.avatar = "pato";
    expect(player.avatar).toBe("pato");
    player.avatar = "";
    expect(player.avatar).toBe("");
  });
});
