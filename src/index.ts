#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pino from "pino";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

async function main() {
  const config = loadConfig();
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("api-service-document-mcp connected on stdio");
}

main().catch((err) => {
  logger.error({ err }, "fatal startup error");
  process.exit(1);
});
