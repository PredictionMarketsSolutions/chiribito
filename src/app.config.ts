import { defineServer, defineRoom } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import type { Request, Response } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import logger from "./config/logger";

// import { RedisDriver } from "@colyseus/redis-driver";
// import { RedisPresence } from "@colyseus/redis-presence";


import { MyRoom } from "./rooms/MyRoom";
import auth from "./config/auth";
import { LobbyRoom } from "@colyseus/core";

const server = defineServer({
    rooms: {
        my_room: defineRoom(MyRoom),
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

        // Configure express-session
        app.use(session({
            store: sessionStore,
            secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            },
        }));

        /**
         * Bind @colyseus/monitor (PUBLIC - No authentication required)
         * Access at: http://localhost:2567/colyseus
         */
        app.use("/colyseus", monitor());

        /**
         * Bind "playground" (PUBLIC - No authentication required)
         * Access at: http://localhost:2567/playground
         */
        app.use("/playground", playground());

        // Bind auth routes
        app.use(auth.prefix, auth.routes());
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
