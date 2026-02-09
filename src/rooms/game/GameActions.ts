import { Client } from "colyseus";
import type { MyRoom } from "../MyRoom";
import type { GameHelpers } from "./types";
import {
  handleStartGame as startGame,
  startNewHand as startHand,
  postBlinds as postBlindsImpl,
  startBettingRound as startBettingImpl,
  proceedToNextPhase as nextPhase,
  determineWinners as determineWinnersImpl,
  endRound as endRoundImpl
} from "./actions/rounds";
import {
  handleBet as betImpl,
  handleCall as callImpl,
  handleCheck as checkImpl,
  handleRaise as raiseImpl,
  handleFold as foldImpl,
  handleFoldFromTimeout as foldFromTimeoutImpl
} from "./actions/betting";
import {
  endTurn as endTurnImpl,
  startTurnTimer as startTurnTimerImpl
} from "./actions/turns";

export class GameActions implements GameHelpers {
  constructor(private room: MyRoom) {}

  handleStartGame(client: Client) {
    startGame(this.room, this, client.sessionId);
  }

  handleBet(client: Client, amount: number) {
    betImpl(this.room, this, client, amount);
  }

  handleCall(client: Client) {
    callImpl(this.room, this, client);
  }

  handleCheck(client: Client) {
    checkImpl(this.room, this, client);
  }

  handleRaise(client: Client, amount: number) {
    raiseImpl(this.room, this, client, amount);
  }

  handleFold(client: Client) {
    foldImpl(this.room, this, client);
  }

  // GameHelpers implementations
  startNewHand() {
    startHand(this.room, this);
  }

  postBlinds() {
    postBlindsImpl(this.room, this);
  }

  startBettingRound() {
    startBettingImpl(this.room);
  }

  endTurn() {
    endTurnImpl(this.room, this);
  }

  proceedToNextPhase() {
    nextPhase(this.room, this);
  }

  determineWinners(): string[] {
    return determineWinnersImpl(this.room);
  }

  endRound(winners: string[]) {
    endRoundImpl(this.room, this, winners);
  }

  startTurnTimer() {
    startTurnTimerImpl(this.room, this);
  }

  handleFoldForTimeout(sessionId: string) {
    foldFromTimeoutImpl(this.room, this, sessionId);
  }
}
