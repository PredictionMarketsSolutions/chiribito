/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 *
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options
 */


import "dotenv/config";

import { listen } from "@colyseus/tools";
import logger from "./config/logger";

// Import arena config
import app from "./app.config";

// Create and listen on 2567 (or PORT environment variable.)
const port = Number(process.env.PORT || 2567);

logger.info("Chiribito backend starting", {
  port,
  env: process.env.NODE_ENV || "development",
});

listen(app);
