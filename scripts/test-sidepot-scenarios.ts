import assert from "node:assert/strict";

type SidePotInput = {
  playersInHand: string[];
  contributions: Record<string, number>;
  folded?: string[];
  handStrength: Record<string, number>; // higher is better
};

type SidePotResult = {
  payouts: Record<string, number>;
  totalPot: number;
};

function calculateSidePots(input: SidePotInput): SidePotResult {
  const foldedSet = new Set(input.folded ?? []);
  const contributionEntries = Object.entries(input.contributions).filter(([, amount]) => amount > 0);
  const totalPot = contributionEntries.reduce((sum, [, amount]) => sum + amount, 0);

  const payouts = new Map<string, number>();
  const levels = Array.from(new Set(contributionEntries.map(([, amount]) => amount))).sort((a, b) => a - b);

  let previousLevel = 0;
  for (const level of levels) {
    const participants = contributionEntries.filter(([, amount]) => amount >= level).map(([id]) => id);
    const sidePotAmount = (level - previousLevel) * participants.length;
    previousLevel = level;

    if (sidePotAmount <= 0 || participants.length === 0) continue;

    const eligible = participants.filter((id) => !foldedSet.has(id));
    if (eligible.length === 0) continue;

    const bestStrength = Math.max(...eligible.map((id) => input.handStrength[id] ?? Number.NEGATIVE_INFINITY));
    const winners = input.playersInHand.filter(
      (id) => eligible.includes(id) && (input.handStrength[id] ?? Number.NEGATIVE_INFINITY) === bestStrength
    );

    assert.ok(winners.length > 0, "Each side pot must have at least one eligible winner");

    const base = Math.floor(sidePotAmount / winners.length);
    let remainder = sidePotAmount % winners.length;

    for (const winnerId of winners) {
      const bonus = remainder > 0 ? 1 : 0;
      payouts.set(winnerId, (payouts.get(winnerId) ?? 0) + base + bonus);
      if (remainder > 0) remainder -= 1;
    }
  }

  const payoutObject = Object.fromEntries(input.playersInHand.map((id) => [id, payouts.get(id) ?? 0]));
  return { payouts: payoutObject, totalPot };
}

function assertPayouts(name: string, input: SidePotInput, expected: Record<string, number>) {
  const result = calculateSidePots(input);
  const totalPaid = Object.values(result.payouts).reduce((a, b) => a + b, 0);

  assert.deepEqual(result.payouts, expected, `${name}: unexpected payout distribution`);
  assert.equal(totalPaid, result.totalPot, `${name}: payouts must match total pot`);

  console.log(`✅ ${name}`);
  console.log(`   Pot=${result.totalPot}  Payouts=${JSON.stringify(result.payouts)}`);
}

function run() {
  assertPayouts(
    "Escenario 1: Heads-up overbet cap + side pot",
    {
      playersInHand: ["A", "B"],
      contributions: { A: 1000, B: 300 },
      handStrength: { A: 10, B: 20 }, // B gana main, A gana side
    },
    { A: 700, B: 600 }
  );

  assertPayouts(
    "Escenario 2: 3 jugadores, all-ins desiguales",
    {
      playersInHand: ["A", "B", "C"],
      contributions: { A: 1000, B: 600, C: 200 },
      handStrength: { A: 5, B: 15, C: 25 },
    },
    { A: 400, B: 800, C: 600 }
  );

  assertPayouts(
    "Escenario 3: Split pot con remainder",
    {
      playersInHand: ["A", "B", "C"],
      contributions: { A: 101, B: 101, C: 101 },
      handStrength: { A: 50, B: 50, C: 10 },
    },
    { A: 152, B: 151, C: 0 }
  );

  assertPayouts(
    "Escenario 4: Jugador foldeado no puede ganar",
    {
      playersInHand: ["A", "B", "C"],
      contributions: { A: 500, B: 500, C: 500 },
      folded: ["C"],
      handStrength: { A: 10, B: 20, C: 99 },
    },
    { A: 0, B: 1500, C: 0 }
  );

  console.log("\n🎯 Side-pot scenarios: ALL PASS");
}

run();
