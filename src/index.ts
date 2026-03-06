import "dotenv/config";

import logger from "./config/logger";

// Import configured Colyseus server
import server from "./app.config";

// Create and listen on 2567 (or PORT environment variable.)
const port = Number(process.env.PORT || 2567);

logger.info("Chiribito backend starting", {
  port,
  env: process.env.NODE_ENV || "development",
});

server.listen(port).catch((error) => {
  logger.error("Failed to start Colyseus server", { error });
  process.exit(1);
});
