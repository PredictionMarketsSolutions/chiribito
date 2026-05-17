import { defineServer, defineRoom } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { randomBytes, timingSafeEqual } from "crypto";
import logger from "./config/logger";
import { JWT_SECRET as ENV_JWT_SECRET } from "./config/env";

// import { RedisDriver } from "@colyseus/redis-driver";
// import { RedisPresence } from "@colyseus/redis-presence";


import { MyRoom } from "./rooms/MyRoom";
import auth from "./config/auth";
import { JWT } from "@colyseus/auth";
import { LobbyRoom } from "@colyseus/core";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

/**
 * Resolve the secret used to sign session cookies + colyseus auth.
 *
 * Production: requires JWT_SECRET; throws otherwise so the server never
 *   silently runs with an insecure fallback.
 * Non-production: if JWT_SECRET is missing, generate an in-memory random
 *   secret per process. Sessions won't survive restarts — which is the
 *   correct behaviour for local dev.
 */
function resolveSessionSecret(): string {
    if (ENV_JWT_SECRET) return ENV_JWT_SECRET;
    if (isProduction()) {
        throw new Error("JWT_SECRET is required in production");
    }
    const generated = randomBytes(48).toString("base64");
    logger.warn("JWT_SECRET not set — generated ephemeral secret for this process (dev only)");
    return generated;
}

/**
 * Basic-auth middleware for the Colyseus monitor.
 * Production-only: requires MONITOR_USER + MONITOR_PASSWORD. If either is
 * missing, the route is fully disabled (404). Comparison is timing-safe.
 */
function monitorAuthMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!isProduction()) {
            return next();
        }
        const expectedUser = process.env.MONITOR_USER;
        const expectedPass = process.env.MONITOR_PASSWORD;
        if (!expectedUser || !expectedPass) {
            res.status(404).end();
            return;
        }
        const header = req.headers.authorization ?? "";
        if (!header.toLowerCase().startsWith("basic ")) {
            res.set("WWW-Authenticate", 'Basic realm="chiribito-monitor"').status(401).end();
            return;
        }
        const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
        const sep = decoded.indexOf(":");
        const providedUser = sep >= 0 ? decoded.slice(0, sep) : decoded;
        const providedPass = sep >= 0 ? decoded.slice(sep + 1) : "";
        const userOk = safeEqual(providedUser, expectedUser);
        const passOk = safeEqual(providedPass, expectedPass);
        if (!userOk || !passOk) {
            res.set("WWW-Authenticate", 'Basic realm="chiribito-monitor"').status(401).end();
            return;
        }
        next();
    };
}

function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) {
        // Still run a fixed-time compare to avoid leaking length difference.
        const max = Math.max(ab.length, bb.length);
        const pad = Buffer.alloc(max);
        timingSafeEqual(Buffer.concat([ab, pad]).subarray(0, max), Buffer.concat([bb, pad]).subarray(0, max));
        return false;
    }
    return timingSafeEqual(ab, bb);
}

const server = defineServer({
    rooms: {
        my_room: defineRoom(MyRoom).enableRealtimeListing(),
        lobby: defineRoom(LobbyRoom),
    },

    /**
     * Configure Express routes and middleware.
     */
    express: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (_req: Request, res: Response) => {
            res.send("Server running");
        });

        // Configure Redis session store for monitor
        let sessionStore: any = undefined;
        const redisUrl = process.env.REDIS_URL;
        
        if (redisUrl) {
            try {
                const redisClient = createClient({ url: redisUrl });
                redisClient.connect().catch((err) => {
                    logger.error('Failed to connect Redis client for sessions', { error: err });
                });
                
                sessionStore = new RedisStore({
                    client: redisClient,
                    prefix: (process.env.REDIS_PREFIX || 'chiri') + ':session:',
                });
                logger.info('Redis session store configured for monitor');
            } catch (error) {
                logger.error('Failed to configure Redis session store', { error });
            }
        } else {
            logger.warn('REDIS_URL not configured, monitor will use MemoryStore (not production-ready)');
        }

        const sessionSecret = resolveSessionSecret();

        // Configure express-session
        app.use(session({
            store: sessionStore,
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: isProduction(),
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            },
        }));

        /**
         * Colyseus monitor.
         * - Development: open (DX).
         * - Production: requires basic-auth (MONITOR_USER + MONITOR_PASSWORD).
         *   If those env vars are missing, the route returns 404.
         */
        app.use("/colyseus", monitorAuthMiddleware(), monitor());

        /**
         * Colyseus playground.
         * Development tool that can create/destroy rooms — never exposed in production.
         */
        if (!isProduction()) {
            app.use("/playground", playground());
        }

        // Bind @colyseus/auth — uses the same secret resolved above.
        JWT.settings.secret = sessionSecret;
        try {
            app.use(auth.prefix, auth.routes());
        } catch (err: any) {
            logger.error("Failed to mount @colyseus/auth routes", { error: err?.message ?? err });
            throw err;
        }
    },

    /**
     * Validación de entorno antes de que el servidor empiece a escuchar.
     */
    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         * Validate critical environment variables
         */
        if (process.env.DISABLE_ENV_VALIDATION === "true") {
            logger.warn("Environment validation disabled via DISABLE_ENV_VALIDATION");
            return;
        }
        const isProduction = process.env.NODE_ENV === 'production';
        const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
        const productionOnlyVars = ['ALLOWED_ORIGINS'];
        
        const missing: string[] = [];
        
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
            logger.error("CRITICAL: Missing required environment variables", { missing });
            logger.error("Set the following variables before starting the server:");
            missing.forEach(varName => logger.error(`  - ${varName}`));
            
            if (isProduction) {
                process.exit(1);
            } else {
                logger.warn("Development mode: continuing with missing variables (may cause errors)");
            }
        }
        
        
        logger.info("Environment validation passed", { 
            NODE_ENV: process.env.NODE_ENV,
            varsChecked: requiredVars.length + (isProduction ? productionOnlyVars.length : 0)
        });
    }
});

export default server;
