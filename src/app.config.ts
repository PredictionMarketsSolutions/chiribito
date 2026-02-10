import config from "@colyseus/tools";

import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import type { Request, Response } from "express";

// import { RedisDriver } from "@colyseus/redis-driver";
// import { RedisPresence } from "@colyseus/redis-presence";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom";
import auth from "./config/auth";
import { LobbyRoom } from "colyseus";

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
            res.send(`Instance ID => ${process.env.NODE_APP_INSTANCE ?? "NONE"}`);
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());

        // Bind "playground"
        app.use("/playground", playground());

        // Bind auth routes
        app.use(auth.prefix, auth.routes());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
