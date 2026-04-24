import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import type { Logger } from "pino";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Config } from "../config.js";
import { createServer } from "../server.js";

export type HttpServerHandle = {
  close: () => Promise<void>;
  port: number;
};

export function startHttpServer(
  config: Config,
  logger: Logger,
): Promise<HttpServerHandle> {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const mcpRouter = express.Router();
  mcpRouter.use(bearerAuth(config.mcpAuthToken, logger));
  mcpRouter.all("/", (req, res) => handleMcp(req, res, config, logger));
  app.use("/mcp", mcpRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "unhandled http error");
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error" });
    }
  });

  return new Promise((resolve) => {
    const httpServer = app.listen(config.httpPort, () => {
      const address = httpServer.address();
      const port =
        typeof address === "object" && address ? address.port : config.httpPort;
      logger.info({ port }, "api-service-document-mcp listening on http");
      resolve({
        port,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            httpServer.close((err) => (err ? rejectClose(err) : resolveClose()));
          }),
      });
    });
  });
}

async function handleMcp(
  req: Request,
  res: Response,
  config: Config,
  logger: Logger,
): Promise<void> {
  const requestId = randomUUID();
  const log = logger.child({ requestId });
  const server = createServer(config);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    log.error({ err }, "mcp request failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "mcp_error" });
    }
  }
}

function bearerAuth(expectedToken: string | undefined, logger: Logger) {
  const expected = expectedToken
    ? Buffer.from(expectedToken, "utf8")
    : undefined;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!expected) {
      logger.error("MCP_AUTH_TOKEN missing at request time — rejecting");
      res.status(503).json({ error: "auth_not_configured" });
      return;
    }

    const header = req.header("authorization");
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
      res.status(401).json({ error: "missing_bearer_token" });
      return;
    }

    const provided = Buffer.from(header.slice(7).trim(), "utf8");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      res.status(401).json({ error: "invalid_bearer_token" });
      return;
    }

    next();
  };
}
