"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = __importDefault(require("@colyseus/tools"));
const ws_transport_1 = require("@colyseus/ws-transport");
const monitor_1 = require("@colyseus/monitor");
const playground_1 = require("@colyseus/playground");
const logger_1 = __importDefault(require("./config/logger"));
// import { RedisDriver } from "@colyseus/redis-driver";
// import { RedisPresence } from "@colyseus/redis-presence";
const MyRoom_1 = require("./rooms/MyRoom");
const auth_1 = __importDefault(require("./config/auth"));
const core_1 = require("@colyseus/core");
exports.default = (0, tools_1.default)({
    options: {
    // devMode: true,
    // driver: new RedisDriver(),
    // presence: new RedisPresence(),
    },
    initializeTransport: (options) => {
        // Create transport and attach compatibility helpers that some @colyseus/core
        // router code expects (either `expressApp` property or `getExpressApp()` method).
        const transport = new ws_transport_1.WebSocketTransport(options);
        // prefer existing property if present
        try {
            // attach expressApp for @colyseus/tools compatibility
            transport.expressApp = options.app;
        }
        catch (e) {
            // ignore
        }
        // attach getExpressApp for @colyseus/core router compatibility
        if (typeof transport.getExpressApp !== 'function') {
            transport.getExpressApp = () => options.app;
        }
        return transport;
    },
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom_1.MyRoom);
        gameServer.define('lobby', core_1.LobbyRoom);
    },
    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (_req, res) => {
            res.send("Server running");
        });
        // Middleware to protect /colyseus and /playground routes
        const protectRoute = (req, res, next) => {
            const password = process.env.MONITOR_PASSWORD;
            if (!password) {
                logger_1.default.warn("MONITOR_PASSWORD not set - /colyseus and /playground are publicly accessible");
                return next();
            }
            const authHeader = req.headers["authorization"];
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const token = authHeader.replace("Bearer ", "");
            if (token !== password) {
                return res.status(403).json({ error: "Forbidden" });
            }
            next();
        };
        /**
         * Bind @colyseus/monitor (PROTECTED)
         * Requires MONITOR_PASSWORD environment variable
         * Usage: Authorization: Bearer <password>
         */
        app.use("/colyseus", protectRoute, (0, monitor_1.monitor)());
        // Bind "playground" (PROTECTED)
        app.use("/playground", protectRoute, (0, playground_1.playground)());
        // Bind auth routes
        app.use(auth_1.default.prefix, auth_1.default.routes());
    },
    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         * Validate critical environment variables
         */
        if (process.env.DISABLE_ENV_VALIDATION === "true") {
            logger_1.default.warn("Environment validation disabled via DISABLE_ENV_VALIDATION");
            return;
        }
        const isProduction = process.env.NODE_ENV === 'production';
        const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
        const productionOnlyVars = ['MONITOR_PASSWORD', 'ALLOWED_ORIGINS'];
        const missing = [];
        // Check required vars in all environments
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        });
        // Check production-only vars
        if (isProduction) {
            productionOnlyVars.forEach(varName => {
                if (!process.env[varName]) {
                    missing.push(varName);
                }
            });
        }
        // Fail startup if critical vars missing
        if (missing.length > 0) {
            logger_1.default.error("CRITICAL: Missing required environment variables", { missing });
            logger_1.default.error("Set the following variables before starting the server:");
            missing.forEach(varName => logger_1.default.error(`  - ${varName}`));
            if (isProduction) {
                process.exit(1);
            }
            else {
                logger_1.default.warn("Development mode: continuing with missing variables (may cause errors)");
            }
        }
        // Warn about MONITOR_PASSWORD in development
        if (!isProduction && !process.env.MONITOR_PASSWORD) {
            logger_1.default.warn("MONITOR_PASSWORD not set - development mode allows unprotected monitor access");
        }
        logger_1.default.info("Environment validation passed", {
            NODE_ENV: process.env.NODE_ENV,
            varsChecked: requiredVars.length + (isProduction ? productionOnlyVars.length : 0)
        });
    }
});
