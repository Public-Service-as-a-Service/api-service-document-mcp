import type { DocumentApiClient } from "../client/documentApi.js";
import { toDocumentTypesPayload } from "./documentOutput.js";
import { jsonContent, type ToolDefinition } from "./tool.js";

export const listDocumentTypesInputShape = {} as const;

export function createListDocumentTypesTool(
  client: DocumentApiClient,
): ToolDefinition<typeof listDocumentTypesInputShape> {
  return {
    name: "list_document_types",
    title: "List document types",
    description:
      "List configured document types for the current municipality.",
    inputSchema: listDocumentTypesInputShape,
    handler: async () =>
      jsonContent(toDocumentTypesPayload(await client.listDocumentTypes())),
  };
}
