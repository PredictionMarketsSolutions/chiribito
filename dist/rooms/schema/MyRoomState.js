"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoomState = exports.Player = void 0;
const schema_1 = require("@colyseus/schema");
class Player extends schema_1.Schema {
    constructor(sessionId) {
        super();
        this.name = "";
        this.hand = new schema_1.ArraySchema();
        this.chips = 1000;
        this.currentBet = 0;
        this.isFolded = false;
        this.seatIndex = -1;
        this.sessionId = sessionId;
    }
}
exports.Player = Player;
__decorate([
    (0, schema_1.type)("string")
], Player.prototype, "sessionId", void 0);
__decorate([
    (0, schema_1.type)("string")
], Player.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], Player.prototype, "hand", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "chips", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "currentBet", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], Player.prototype, "isFolded", void 0);
__decorate([
    (0, schema_1.type)("number")
], Player.prototype, "seatIndex", void 0);
class MyRoomState extends schema_1.Schema {
    constructor() {
        super();
        this.users = new schema_1.MapSchema();
        this.deck = new schema_1.ArraySchema();
        this.communityCards = new schema_1.ArraySchema();
        this.pot = 0;
        this.currentBet = 0;
        this.currentTurn = "";
        this.dealerIndex = 0;
        this.roundStarted = false;
        this.phase = "waiting"; // waiting, preflop, flop, turn, river
        this.lastRaiser = "";
        this.resetDeck();
    }
    resetDeck() {
        const suits = ["O", "C", "E", "B"];
        const ranks = ["1", "7", "8", "9", "10", "11", "12"];
        this.deck.clear();
        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push(`${rank}${suit}`);
            }
        }
        // Shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    dealCard() {
        return this.deck.shift() || "";
    }
}
exports.MyRoomState = MyRoomState;
__decorate([
    (0, schema_1.type)({ map: Player })
], MyRoomState.prototype, "users", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], MyRoomState.prototype, "deck", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], MyRoomState.prototype, "communityCards", void 0);
__decorate([
    (0, schema_1.type)("number")
], MyRoomState.prototype, "pot", void 0);
__decorate([
    (0, schema_1.type)("number")
], MyRoomState.prototype, "currentBet", void 0);
__decorate([
    (0, schema_1.type)("string")
], MyRoomState.prototype, "currentTurn", void 0);
__decorate([
    (0, schema_1.type)("number")
], MyRoomState.prototype, "dealerIndex", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], MyRoomState.prototype, "roundStarted", void 0);
__decorate([
    (0, schema_1.type)("string")
], MyRoomState.prototype, "phase", void 0);
__decorate([
    (0, schema_1.type)("string")
], MyRoomState.prototype, "lastRaiser", void 0);
