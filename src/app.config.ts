import config from "@colyseus/tools";

import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import type { Request, Response } from "express";

// import { RedisDriver } from "@colyseus/redis-driver";
// import { RedisPresence } from "@colyseus/redis-presence";


import { MyRoom } from "./rooms/MyRoom";
import auth from "./config/auth";
import { LobbyRoom } from "@colyseus/core";

export default config({
    options: {
        // devMode: true,
        // driver: new RedisDriver(),
        // presence: new RedisPresence(),
    },

        initializeTransport: (options) => {
                // Create transport and attach compatibility helpers that some @colyseus/core
                // router code expects (either `expressApp` property or `getExpressApp()` method).
                const transport = new WebSocketTransport(options as any);
                // prefer existing property if present
                try {
                    // attach expressApp for @colyseus/tools compatibility
                    (transport as any).expressApp = (options as any).app;
                } catch (e) {
                    // ignore
                }
                // attach getExpressApp for @colyseus/core router compatibility
                if (typeof (transport as any).getExpressApp !== 'function') {
                    (transport as any).getExpressApp = () => (options as any).app;
                }

                return transport;
        },

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);

        gameServer.define('lobby', LobbyRoom);
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (_req: Request, res: Response) => {
            res.send("Server running");
        });

        // Middleware to protect /colyseus and /playground routes
        const protectRoute = (req: Request, res: Response, next: Function) => {
            const password = process.env.MONITOR_PASSWORD;
            if (!password) {
                console.warn("⚠️ MONITOR_PASSWORD not set - /colyseus and /playground are publicly accessible");
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
        app.use("/colyseus", protectRoute, monitor());

        // Bind "playground" (PROTECTED)
        app.use("/playground", protectRoute, playground());

        // Bind auth routes
        app.use(auth.prefix, auth.routes());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
