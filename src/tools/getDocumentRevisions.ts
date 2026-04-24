import type { DocumentApiClient } from "../client/documentApi.js";
import { toDocumentListPayload } from "./documentOutput.js";
import { pageSchema, registrationNumberSchema, sizeSchema } from "./schemas.js";
import { jsonContent, type ToolDefinition } from "./tool.js";

export const getDocumentRevisionsInputShape = {
  registrationNumber: registrationNumberSchema,
  page: pageSchema,
  size: sizeSchema,
} as const;

export function createGetDocumentRevisionsTool(
  client: DocumentApiClient,
): ToolDefinition<typeof getDocumentRevisionsInputShape> {
  return {
    name: "get_document_revisions",
    title: "Get document revisions",
    description:
      "List public revisions for a document by registration number. Returns revision summaries with paging metadata.",
    inputSchema: getDocumentRevisionsInputShape,
    handler: async (input) =>
      jsonContent(
        toDocumentListPayload(
          await client.getDocumentRevisions({
            registrationNumber: input.registrationNumber,
            page: input.page,
            size: input.size,
            includeConfidential: false,
          }),
        ),
      ),
  };
}
