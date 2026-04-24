import { z } from "zod";
import type { DocumentApiClient } from "../client/documentApi.js";
import { toFileMatchesPayload } from "./documentOutput.js";
import { pageSchema, sizeSchema } from "./schemas.js";
import { jsonContent, type ToolDefinition } from "./tool.js";

export const searchFileMatchesInputShape = {
  query: z
    .string()
    .min(1)
    .describe(
      "Phrase matched against the text extracted from document files (PDF, PPTX, DOCX, ...). Returns matching files with page-level offsets when available.",
    ),
  page: pageSchema,
  size: sizeSchema,
} as const;

export function createSearchFileMatchesTool(
  client: DocumentApiClient,
): ToolDefinition<typeof searchFileMatchesInputShape> {
  return {
    name: "search_file_matches",
    title: "Search file content",
    description:
      "Search the extracted text inside document files and return matching files with page-level offsets and highlighted fragments. Limited to active, public, latest revisions. Use get_document for full metadata of a match.",
    inputSchema: searchFileMatchesInputShape,
    handler: async (input) =>
      jsonContent(
        toFileMatchesPayload(
          await client.searchFileMatches({
            query: [input.query],
            page: input.page,
            size: input.size,
          }),
        ),
      ),
  };
}
