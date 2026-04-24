import type { DocumentApiClient } from "../../client/documentApi.js";
import { toDocumentStatisticsPayload } from "../documentOutput.js";
import { isoDateTimeSchema, registrationNumberSchema } from "../schemas.js";
import { jsonContent, type ToolDefinition } from "../tool.js";

export const getDocumentStatisticsInputShape = {
  registrationNumber: registrationNumberSchema,
  from: isoDateTimeSchema
    .optional()
    .describe("Inclusive lower bound. Omit for unbounded history."),
  to: isoDateTimeSchema
    .optional()
    .describe("Exclusive upper bound. Omit for an open-ended range."),
} as const;

export function createGetDocumentStatisticsTool(
  client: DocumentApiClient,
): ToolDefinition<typeof getDocumentStatisticsInputShape> {
  return {
    name: "get_document_statistics",
    title: "Get document statistics",
    description:
      "Read aggregated file access statistics for one public document, including per-revision and per-file breakdowns.",
    inputSchema: getDocumentStatisticsInputShape,
    handler: async (input) =>
      jsonContent(
        toDocumentStatisticsPayload(await client.getDocumentStatistics(input)),
      ),
  };
}
