import type { DocumentApiClient } from "../client/documentApi.js";
import { toDocumentPayload } from "./documentOutput.js";
import { registrationNumberSchema } from "./schemas.js";
import { jsonContent, type ToolDefinition } from "./tool.js";

export const getDocumentInputShape = {
  registrationNumber: registrationNumberSchema,
} as const;

export function createGetDocumentTool(
  client: DocumentApiClient,
): ToolDefinition<typeof getDocumentInputShape> {
  return {
    name: "get_document",
    title: "Get document",
    description:
      "Read the latest public revision of a document by registration number. Returns metadata and file descriptors, not file content.",
    inputSchema: getDocumentInputShape,
    handler: async (input) =>
      jsonContent(
        toDocumentPayload(
          await client.getDocument({
            registrationNumber: input.registrationNumber,
            includeConfidential: false,
            includeNonPublic: false,
          }),
        ),
      ),
  };
}
