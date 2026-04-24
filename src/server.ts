import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { DocumentApiClient } from "./client/documentApi.js";
import { createGetDocumentTool } from "./tools/getDocument.js";
import { createGetDocumentRevisionsTool } from "./tools/getDocumentRevisions.js";
import { createListDocumentTypesTool } from "./tools/listDocumentTypes.js";
import { createReportingTools } from "./tools/reporting/index.js";
import { createSearchDocumentsTool } from "./tools/searchDocuments.js";
import { createSearchFileMatchesTool } from "./tools/searchFileMatches.js";
import type { ToolDefinition } from "./tools/tool.js";

export function createServer(config: Config): McpServer {
  const client = new DocumentApiClient(config);
  const server = new McpServer({
    name: "api-service-document-mcp",
    version: "0.1.0",
  });

  const tools: ToolDefinition<any>[] = [
    createSearchDocumentsTool(client),
    createSearchFileMatchesTool(client),
    createGetDocumentTool(client),
    createGetDocumentRevisionsTool(client),
    createListDocumentTypesTool(client),
  ];

  if (config.enableReportingTools) {
    tools.push(...createReportingTools(client));
  }

  registerTools(server, tools);
  return server;
}

function registerTools(server: McpServer, tools: ToolDefinition<any>[]): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: true,
        },
      },
      tool.handler,
    );
  }
}
