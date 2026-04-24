import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { DocumentApiClient } from "./client/documentApi.js";
import { createSearchDocumentsTool } from "./tools/searchDocuments.js";

export function createServer(config: Config): McpServer {
  const client = new DocumentApiClient(config);
  const server = new McpServer({
    name: "api-service-document-mcp",
    version: "0.1.0",
  });

  const searchDocuments = createSearchDocumentsTool(client);
  server.registerTool(
    searchDocuments.name,
    {
      title: searchDocuments.title,
      description: searchDocuments.description,
      inputSchema: searchDocuments.inputSchema,
    },
    searchDocuments.handler,
  );

  return server;
}
