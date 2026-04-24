#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pino from "pino";
import { loadConfig } from "./config.js";
import { startHttpServer } from "./http/server.js";
import { createServer } from "./server.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

async function main() {
  const config = loadConfig();

  if (config.transport === "stdio") {
    const server = createServer(config);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("api-service-document-mcp connected on stdio");
    return;
  }

  const handle = await startHttpServer(config, logger);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    try {
      await handle.close();
    } catch (err) {
      logger.error({ err }, "error during shutdown");
    }
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "fatal startup error");
  process.exit(1);
});
