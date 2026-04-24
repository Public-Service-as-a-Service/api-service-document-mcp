import type { DocumentApiClient } from "../../client/documentApi.js";
import type { ToolDefinition } from "../tool.js";
import { createGetDocumentStatisticsTool } from "./getDocumentStatistics.js";
import { createGetStatisticsOverviewTool } from "./getStatisticsOverview.js";

export function createReportingTools(
  client: DocumentApiClient,
): ToolDefinition<any>[] {
  return [
    createGetDocumentStatisticsTool(client),
    createGetStatisticsOverviewTool(client),
  ];
}
