import { z } from "zod";
import type { DocumentApiClient } from "../client/documentApi.js";

export const searchDocumentsInputShape = {
  query: z
    .string()
    .min(1)
    .describe("Free-text search across document metadata and file content."),
  page: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Zero-based page index. Defaults to 0."),
  size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size, 1–100. Defaults to the service default."),
} as const;

const SearchDocumentsInput = z.object(searchDocumentsInputShape);
export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInput>;

export function createSearchDocumentsTool(client: DocumentApiClient) {
  return {
    name: "search_documents",
    title: "Search documents",
    description:
      "Search for documents by free-text query. Returns the latest active revisions with title, registration number, and description. Use this to find candidates; follow up with get_document to fetch a specific document.",
    inputSchema: searchDocumentsInputShape,
    handler: async (input: SearchDocumentsInput) => {
      const result = await client.searchDocuments(input);
      const payload = {
        totalElements: result._meta.totalElements,
        page: result._meta.page,
        size: result._meta.limit,
        documents: result.documents.map((d) => ({
          registrationNumber: d.registrationNumber,
          revision: d.revision,
          title: metadataValue(d.metadata, "title"),
          description: d.description,
          confidential: d.confidentiality?.confidential ?? false,
        })),
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(payload, null, 2),
          },
        ],
      };
    },
  };
}

function metadataValue(
  metadata: { key: string; value: string }[],
  key: string,
): string | undefined {
  return metadata.find((m) => m.key.toLowerCase() === key.toLowerCase())?.value;
}
