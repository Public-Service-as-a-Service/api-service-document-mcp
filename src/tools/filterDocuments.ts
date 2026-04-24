import { z } from "zod";
import type { DocumentApiClient } from "../client/documentApi.js";
import { toDocumentListPayload } from "./documentOutput.js";
import { pageSchema, sizeSchema } from "./schemas.js";
import { jsonContent, type ToolDefinition } from "./tool.js";

const documentStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
]);

export const filterDocumentsInputShape = {
  createdBy: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Person ID of the user who created the document. Use the current user's personId for questions like 'documents I created'.",
    ),
  responsiblePersonId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Person ID of a responsible user. Use the current user's personId for questions like 'documents I am responsible for'.",
    ),
  statuses: z
    .array(documentStatusSchema)
    .min(1)
    .max(5)
    .optional()
    .describe(
      "Lifecycle statuses to include. Use SCHEDULED for scheduled documents, ACTIVE for active documents, and so on.",
    ),
  documentTypes: z
    .array(z.string().min(1))
    .min(1)
    .optional()
    .describe("Document type identifiers to include, for example POLICY or RULE."),
  page: pageSchema,
  size: sizeSchema,
} as const;

export function createFilterDocumentsTool(
  client: DocumentApiClient,
): ToolDefinition<typeof filterDocumentsInputShape> {
  return {
    name: "filter_documents",
    title: "Filter documents",
    description:
      "Filter internal documents by creator, responsible person, lifecycle status, and document type. Use for questions about 'my documents', 'documents I created', 'documents I am responsible for', and scheduled/active/draft/revoked/expired documents. Returns latest revisions only and excludes confidential documents.",
    inputSchema: filterDocumentsInputShape,
    handler: async (input) =>
      jsonContent(toDocumentListPayload(await client.filterDocuments(input))),
  };
}
