import assert from "node:assert/strict";

type FuzzInput = {
  playersInHand: string[];
  contributions: Record<string, number>;
  folded: Set<string>;
  handStrength: Record<string, number>;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function payout(input: FuzzInput): Record<string, number> {
  const contributionEntries = Object.entries(input.contributions).filter(([, amount]) => amount > 0);
  const levels = Array.from(new Set(contributionEntries.map(([, amount]) => amount))).sort((a, b) => a - b);
  const payouts = new Map<string, number>();

  let previousLevel = 0;
  for (const level of levels) {
    const participants = contributionEntries.filter(([, amount]) => amount >= level).map(([id]) => id);
    const pot = (level - previousLevel) * participants.length;
    previousLevel = level;

    if (pot <= 0) continue;

    const eligible = participants.filter((id) => !input.folded.has(id));
    if (eligible.length === 0) continue;

    const best = Math.max(...eligible.map((id) => input.handStrength[id]));
    const winners = input.playersInHand.filter((id) => eligible.includes(id) && input.handStrength[id] === best);

    const base = Math.floor(pot / winners.length);
    let remainder = pot % winners.length;

    for (const winner of winners) {
      payouts.set(winner, (payouts.get(winner) ?? 0) + base + (remainder > 0 ? 1 : 0));
      if (remainder > 0) remainder -= 1;
    }
  }

  return Object.fromEntries(input.playersInHand.map((id) => [id, payouts.get(id) ?? 0]));
}

function runFuzz(iterations: number) {
  for (let i = 0; i < iterations; i += 1) {
    const n = randInt(2, 6);
    const ids = Array.from({ length: n }, (_, k) => `P${k + 1}`);

    const contributions: Record<string, number> = {};
    const handStrength: Record<string, number> = {};
    const folded = new Set<string>();

    for (const id of ids) {
      contributions[id] = randInt(0, 3000);
      handStrength[id] = randInt(1, 100);
    }

    if (Object.values(contributions).every((x) => x === 0)) {
      contributions[ids[0]] = randInt(1, 3000);
    }

    const input: FuzzInput = { playersInHand: ids, contributions, folded, handStrength };
    const out = payout(input);

    const totalPot = Object.values(contributions).reduce((a, b) => a + b, 0);
    const totalPaid = Object.values(out).reduce((a, b) => a + b, 0);

    assert.equal(totalPaid, totalPot, `Iteration ${i}: payout sum mismatch`);

    for (const id of ids) {
      assert.ok(out[id] >= 0, `Iteration ${i}: negative payout for ${id}`);
    }
  }

  console.log(`✅ Side-pot fuzz test passed (${iterations} random iterations)`);
}

runFuzz(2000);
