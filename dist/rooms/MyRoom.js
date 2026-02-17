"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const core_1 = require("@colyseus/core");
const MyRoomState_1 = require("./schema/MyRoomState");
const jwt = __importStar(require("jsonwebtoken"));
const GameEngine_1 = require("./game/GameEngine");
const API_URL = process.env.API_URL || "http://localhost:3000";
class MyRoom extends core_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 6;
        this.turnTimeout = null;
        this.dealerIndex = 0;
        this.currentPlayerIndex = 0;
        this.playersInHand = [];
        this.playersActedThisRound = new Set();
        this.playersAllIn = new Set();
        this.activeUsers = new Map();
        this.sessionUsers = new Map();
        this.pendingUsers = new Set();
        this.reconnectionTimeoutSeconds = 60;
        // Heartbeat & connection monitoring
        this.clientHeartbeats = new Map();
        this.heartbeatInterval = null;
        this.HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
        this.HEARTBEAT_TIMEOUT_MS = 90000; // 90 seconds (3 missed heartbeats)
    }
    getNextAvailableSeat() {
        const occupied = new Set();
        this.state.users.forEach((player) => {
            if (player.seatIndex >= 0)
                occupied.add(player.seatIndex);
        });
        for (let i = 0; i < this.maxClients; i += 1) {
            if (!occupied.has(i))
                return i;
        }
        return -1;
    }
    /**
     * Start monitoring client heartbeats to detect dead connections
     * Sends periodic heartbeat requests to all clients
     */
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const deadClients = [];
            // Check for unresponsive clients
            this.clients.forEach(client => {
                var _a;
                const lastHeartbeat = (_a = this.clientHeartbeats.get(client.sessionId)) !== null && _a !== void 0 ? _a : Date.now();
                const timeSinceLastHeartbeat = now - lastHeartbeat;
                if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT_MS) {
                    console.warn(`[HEARTBEAT] Client ${client.sessionId} is unresponsive (${timeSinceLastHeartbeat}ms without heartbeat)`);
                    deadClients.push(client.sessionId);
                }
            });
            // Force disconnect dead clients
            deadClients.forEach(sessionId => {
                const client = this.clients.find(c => c.sessionId === sessionId);
                if (client) {
                    console.log(`[HEARTBEAT] Forcing disconnect for unresponsive client ${sessionId}`);
                    client.close(4000, "Heartbeat timeout");
                }
            });
            // Send heartbeat request to all healthy clients
            this.broadcast("heartbeat");
        }, this.HEARTBEAT_INTERVAL_MS);
    }
    /**
     * Stop heartbeat monitoring when room is disposed
     */
    stopHeartbeatMonitor() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.clientHeartbeats.clear();
    }
    replaceSession(oldSessionId, newClient) {
        const existingPlayer = this.state.users.get(oldSessionId);
        if (!existingPlayer)
            return;
        existingPlayer.sessionId = newClient.sessionId;
        this.state.users.delete(oldSessionId);
        this.state.users.set(newClient.sessionId, existingPlayer);
        this.playersInHand = this.playersInHand.map(id => id === oldSessionId ? newClient.sessionId : id);
        if (this.state.currentTurn === oldSessionId) {
            this.state.currentTurn = newClient.sessionId;
        }
        const userId = this.sessionUsers.get(oldSessionId);
        if (userId) {
            this.activeUsers.set(userId, newClient.sessionId);
            this.sessionUsers.delete(oldSessionId);
            this.sessionUsers.set(newClient.sessionId, userId);
            this.pendingUsers.delete(userId);
        }
        newClient.send("reconnected", {
            id: newClient.sessionId,
            name: existingPlayer.name,
            chips: existingPlayer.chips
        });
    }
    handleLeaveCleanup(client) {
        var _a;
        const player = this.state.users.get(client.sessionId);
        console.log(`[LEAVE] ${(_a = player === null || player === void 0 ? void 0 : player.name) !== null && _a !== void 0 ? _a : "Unknown"} (${client.sessionId})`);
        if (player) {
            const wasCurrentTurn = this.state.currentTurn === client.sessionId;
            const foldIndex = this.playersInHand.indexOf(client.sessionId);
            player.isFolded = true;
            const playerIndex = this.playersInHand.indexOf(client.sessionId);
            if (playerIndex > -1) {
                this.playersInHand.splice(playerIndex, 1);
            }
            if (wasCurrentTurn && this.playersInHand.length > 0 && foldIndex !== -1) {
                this.engine.setCurrentPlayerIndexBeforeNextActive(foldIndex);
            }
            if (wasCurrentTurn) {
                this.engine.endTurn();
            }
            // Remove player from the room completely
            this.state.users.delete(client.sessionId);
        }
        if (this.playersInHand.length === 1 && this.state.roundStarted) {
            this.engine.endRound([this.playersInHand[0]], "Gana por fold");
        }
        const userId = this.sessionUsers.get(client.sessionId);
        if (userId) {
            const currentSessionId = this.activeUsers.get(userId);
            if (currentSessionId === client.sessionId) {
                this.activeUsers.delete(userId);
            }
            this.pendingUsers.delete(userId);
            this.sessionUsers.delete(client.sessionId);
        }
        // Notify other players
        this.broadcast("playerLeft", {
            id: client.sessionId
        });
    }
    onCreate(options) {
        this.setState(new MyRoomState_1.MyRoomState());
        this.autoDispose = false;
        this.engine = new GameEngine_1.GameEngine(this);
        // Game messages
        this.onMessage("startGame", (client) => this.engine.handleStartGame(client));
        this.onMessage("bet", (client, amount) => this.engine.handleBet(client, amount));
        this.onMessage("call", (client) => this.engine.handleCall(client));
        this.onMessage("check", (client) => this.engine.handleCheck(client));
        this.onMessage("fold", (client) => this.engine.handleFold(client));
        this.onMessage("raise", (client, amount) => this.engine.handleRaise(client, amount));
        // Heartbeat message to detect dead connections
        this.onMessage("heartbeat", (client) => {
            this.clientHeartbeats.set(client.sessionId, Date.now());
            client.send("heartbeat_ack");
        });
        // Start heartbeat monitoring
        this.startHeartbeatMonitor();
    }
    // Validate JWT before allowing join. Colyseus calls `requestJoin` when a client tries to join.
    requestJoin(options, isNew) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(options === null || options === void 0 ? void 0 : options.authUser)) {
                console.warn("requestJoin: no authUser provided");
                return false;
            }
            return true;
        });
    }
    onAuth(client, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const token = (options === null || options === void 0 ? void 0 : options.token) || ((_a = options === null || options === void 0 ? void 0 : options.auth) === null || _a === void 0 ? void 0 : _a.token) ||
                ((options === null || options === void 0 ? void 0 : options.headers) && typeof options.headers.authorization === 'string'
                    ? options.headers.authorization.split(' ')[1]
                    : undefined);
            if (!token) {
                throw new Error("NO_TOKEN");
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("onAuth: JWT_SECRET not set on server");
                throw new Error("SERVER_CONFIG");
            }
            const decoded = jwt.verify(token, secret);
            yield this.validateTokenRemote(token);
            options.authUser = decoded;
            const userId = Number(decoded === null || decoded === void 0 ? void 0 : decoded.userId);
            if (!Number.isFinite(userId)) {
                throw new Error("INVALID_TOKEN");
            }
            const existingSessionId = this.activeUsers.get(userId);
            const hasPending = this.pendingUsers.has(userId);
            if ((existingSessionId || hasPending) && !(options === null || options === void 0 ? void 0 : options.forceReplace)) {
                throw new Error("SESSION_EXISTS");
            }
            if (existingSessionId && (options === null || options === void 0 ? void 0 : options.forceReplace)) {
                options.replaceSessionId = existingSessionId;
            }
            this.pendingUsers.add(userId);
            return options.authUser;
        });
    }
    /**
     * Validate token with API server using exponential backoff
     * This ensures token is still valid and user still exists
     */
    validateTokenRemote(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxAttempts = 3;
            const initialDelayMs = 500;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const controller = new AbortController();
                // Increased timeout: 8 seconds for slower networks
                const timeoutMs = 8000;
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                try {
                    const response = yield fetch(`${API_URL}/api/auth/validate`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        signal: controller.signal
                    });
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            throw new Error("INVALID_TOKEN");
                        }
                        throw new Error(`HTTP ${response.status}`);
                    }
                    // Token valid
                    return;
                }
                catch (err) {
                    clearTimeout(timeoutId);
                    const isLastAttempt = attempt >= maxAttempts;
                    const isAuthError = err instanceof Error && err.message === "INVALID_TOKEN";
                    // Don't retry auth errors - fail immediately
                    if (isAuthError) {
                        throw err;
                    }
                    // For network errors, use exponential backoff
                    if (isLastAttempt) {
                        console.error(`[AUTH] Token validation failed after ${maxAttempts} attempts:`, err);
                        throw err instanceof Error ? err : new Error("AUTH_UNAVAILABLE");
                    }
                    // Exponential backoff: 500ms, 1s, 2s
                    const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
                    console.warn(`[AUTH] Token validation attempt ${attempt}/${maxAttempts} failed, retrying in ${delayMs}ms...`);
                    yield new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        });
    }
    onJoin(client, options) {
        var _a, _b, _c, _d;
        const userId = Number((_a = options === null || options === void 0 ? void 0 : options.authUser) === null || _a === void 0 ? void 0 : _a.userId);
        const replaceSessionId = typeof (options === null || options === void 0 ? void 0 : options.replaceSessionId) === "string"
            ? options.replaceSessionId
            : "";
        const previousSeatIndex = replaceSessionId
            ? (_c = (_b = this.state.users.get(replaceSessionId)) === null || _b === void 0 ? void 0 : _b.seatIndex) !== null && _c !== void 0 ? _c : -1
            : -1;
        const player = new MyRoomState_1.Player(client.sessionId);
        player.name = options.name || ((_d = options.authUser) === null || _d === void 0 ? void 0 : _d.username) || `Player-${client.sessionId.slice(0, 4)}`;
        player.chips = options.chips || 1000;
        player.seatIndex = previousSeatIndex >= 0 ? previousSeatIndex : this.getNextAvailableSeat();
        if (replaceSessionId) {
            const previousClient = this.clients.find(c => c.sessionId === replaceSessionId);
            if (previousClient) {
                previousClient.leave(4001, "SESSION_REPLACED");
            }
            const previousUserId = this.sessionUsers.get(replaceSessionId);
            if (previousUserId) {
                this.activeUsers.delete(previousUserId);
                this.sessionUsers.delete(replaceSessionId);
            }
            const orderedEntries = Array.from(this.state.users.entries());
            let replaced = false;
            this.state.users.clear();
            orderedEntries.forEach(([sessionId, existingPlayer]) => {
                if (sessionId === replaceSessionId) {
                    this.state.users.set(client.sessionId, player);
                    replaced = true;
                    return;
                }
                this.state.users.set(sessionId, existingPlayer);
            });
            if (!replaced) {
                this.state.users.set(client.sessionId, player);
            }
            this.playersInHand = this.playersInHand.map(id => id === replaceSessionId ? client.sessionId : id);
            if (this.state.currentTurn === replaceSessionId) {
                this.state.currentTurn = client.sessionId;
            }
        }
        else {
            this.state.users.set(client.sessionId, player);
        }
        if (Number.isFinite(userId)) {
            this.activeUsers.set(userId, client.sessionId);
            this.sessionUsers.set(client.sessionId, userId);
            this.pendingUsers.delete(userId);
        }
        console.log(`[JOIN] ${player.name} (${client.sessionId})`);
        // Notify the player they joined
        client.send("joined", {
            name: player.name,
            chips: player.chips,
            players: Array.from(this.state.users.values()).map(p => ({
                id: p.sessionId,
                name: p.name,
                chips: p.chips
            }))
        });
        // Notify other players
        this.broadcast("playerJoined", {
            id: client.sessionId,
            name: player.name,
            chips: player.chips
        }, { except: client });
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = this.sessionUsers.get(client.sessionId);
            if (!consented && userId) {
                try {
                    const reconnected = yield this.allowReconnection(client, this.reconnectionTimeoutSeconds);
                    this.replaceSession(client.sessionId, reconnected);
                    return;
                }
                catch (_a) {
                    // Reconnection failed or timed out. Continue cleanup.
                }
            }
            this.handleLeaveCleanup(client);
        });
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
        if (this.turnTimeout)
            clearTimeout(this.turnTimeout);
        // Stop heartbeat monitoring
        this.stopHeartbeatMonitor();
    }
}
exports.MyRoom = MyRoom;
