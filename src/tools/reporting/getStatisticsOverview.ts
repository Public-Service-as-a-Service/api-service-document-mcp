import { z } from "zod";
import type { DocumentApiClient } from "../../client/documentApi.js";
import { toStatisticsOverviewPayload } from "../documentOutput.js";
import { jsonContent, type ToolDefinition } from "../tool.js";

export const getStatisticsOverviewInputShape = {
  createdBy: z
    .string()
    .min(1)
    .optional()
    .describe("Optional personId to scope statistics to documents created by one user."),
} as const;

export function createGetStatisticsOverviewTool(
  client: DocumentApiClient,
): ToolDefinition<typeof getStatisticsOverviewInputShape> {
  return {
    name: "get_document_statistics_overview",
    title: "Get document statistics overview",
    description:
      "Read aggregated document corpus statistics for the current municipality, optionally scoped by creator.",
    inputSchema: getStatisticsOverviewInputShape,
    handler: async (input) =>
      jsonContent(
        toStatisticsOverviewPayload(await client.getStatisticsOverview(input)),
      ),
  };
}
