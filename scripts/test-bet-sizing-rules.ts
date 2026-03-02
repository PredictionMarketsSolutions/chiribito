import assert from "node:assert/strict";

type BetSizingInput = {
  requestedAmount: number;
  currentBet: number;
  playerCurrentBet: number;
  playerChips: number;
  opponentCurrentBetsAndChips: Array<{ currentBet: number; chips: number }>;
};

type BetSizingResult = {
  targetAmount: number;
  actualChipsToAdd: number;
  finalBet: number;
  isAllIn: boolean;
  isRaise: boolean;
  accepted: boolean;
};

function simulateHandleBet(input: BetSizingInput): BetSizingResult {
  const maxCallableBet = input.opponentCurrentBetsAndChips.length > 0
    ? Math.max(...input.opponentCurrentBetsAndChips.map((op) => op.currentBet + op.chips))
    : Infinity;

  const targetAmount = Math.min(input.requestedAmount, maxCallableBet);
  if (targetAmount < input.currentBet) {
    return {
      targetAmount,
      actualChipsToAdd: 0,
      finalBet: input.playerCurrentBet,
      isAllIn: false,
      isRaise: false,
      accepted: false,
    };
  }

  const chipsToCall = targetAmount - input.playerCurrentBet;
  const actualChipsToAdd = Math.min(chipsToCall, input.playerChips);
  const finalBet = input.playerCurrentBet + actualChipsToAdd;
  const isAllIn = actualChipsToAdd === input.playerChips && input.playerChips > 0;
  const isRaise = finalBet > input.currentBet;

  const minRaise = input.currentBet * 2;
  if (isRaise && !isAllIn && finalBet < minRaise) {
    return {
      targetAmount,
      actualChipsToAdd,
      finalBet,
      isAllIn,
      isRaise,
      accepted: false,
    };
  }

  return {
    targetAmount,
    actualChipsToAdd,
    finalBet,
    isAllIn,
    isRaise,
    accepted: true,
  };
}

function run() {
  const overbetCapped = simulateHandleBet({
    requestedAmount: 2000,
    currentBet: 100,
    playerCurrentBet: 100,
    playerChips: 5000,
    opponentCurrentBetsAndChips: [{ currentBet: 100, chips: 300 }],
  });
  assert.equal(overbetCapped.targetAmount, 400);
  assert.equal(overbetCapped.accepted, true);

  const shortAllInAllowed = simulateHandleBet({
    requestedAmount: 350,
    currentBet: 200,
    playerCurrentBet: 200,
    playerChips: 40,
    opponentCurrentBetsAndChips: [{ currentBet: 200, chips: 1000 }],
  });
  assert.equal(shortAllInAllowed.isAllIn, true);
  assert.equal(shortAllInAllowed.accepted, true);
  assert.equal(shortAllInAllowed.finalBet, 240);

  const underMinRaiseRejected = simulateHandleBet({
    requestedAmount: 250,
    currentBet: 200,
    playerCurrentBet: 200,
    playerChips: 1000,
    opponentCurrentBetsAndChips: [{ currentBet: 200, chips: 1000 }],
  });
  assert.equal(underMinRaiseRejected.accepted, false);

  console.log("✅ Bet sizing rules test passed");
}

run();
