import { z } from "zod";
import type { DocumentApiClient } from "../client/documentApi.js";
import { toDocumentListPayload } from "./documentOutput.js";
import { jsonContent, type ToolDefinition } from "./tool.js";
import { pageSchema, sizeSchema } from "./schemas.js";

export const searchDocumentsInputShape = {
  query: z
    .string()
    .min(1)
    .describe("Free-text search across document metadata and file content."),
  page: pageSchema,
  size: sizeSchema,
} as const;

export function createSearchDocumentsTool(
  client: DocumentApiClient,
): ToolDefinition<typeof searchDocumentsInputShape> {
  return {
    name: "search_documents",
    title: "Search documents",
    description:
      "Search active public documents by free-text query. Returns latest revisions only. Use get_document for a specific document.",
    inputSchema: searchDocumentsInputShape,
    handler: async (input) =>
      jsonContent(toDocumentListPayload(await client.searchDocuments(input))),
  };
}
