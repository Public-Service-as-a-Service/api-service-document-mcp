import type { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type ToolDefinition<InputShape extends z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  inputSchema: InputShape;
  handler(input: z.infer<z.ZodObject<InputShape>>): Promise<CallToolResult>;
};

export function jsonContent(payload: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
