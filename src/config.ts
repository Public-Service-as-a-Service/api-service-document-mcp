import { z } from "zod";

const BaseSchema = z.object({
  transport: z.enum(["stdio", "http"]).default("http"),
  httpPort: z.coerce.number().int().min(1).max(65535).default(3000),
  mcpAuthToken: z.string().min(1).optional(),
  documentApiBaseUrl: z.string().url(),
  municipalityId: z.string().min(1),
  documentApiAuthMode: z.enum(["none", "oauth2"]).default("oauth2"),
  oauth2TokenUrl: z.string().url().optional(),
  oauth2ClientId: z.string().min(1).optional(),
  oauth2ClientSecret: z.string().min(1).optional(),
  logLevel: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  enableReportingTools: z.boolean().default(false),
});

const ConfigSchema = BaseSchema.superRefine((value, ctx) => {
  if (value.documentApiAuthMode === "oauth2") {
    requireField(ctx, value.oauth2TokenUrl, "oauth2TokenUrl");
    requireField(ctx, value.oauth2ClientId, "oauth2ClientId");
    requireField(ctx, value.oauth2ClientSecret, "oauth2ClientSecret");
  }
  if (value.transport === "http" && !value.mcpAuthToken) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mcpAuthToken"],
      message:
        "MCP_AUTH_TOKEN is required when TRANSPORT=http — refusing to start without incoming auth",
    });
  }
});

export type Config = z.infer<typeof BaseSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    transport: process.env.TRANSPORT,
    httpPort: process.env.HTTP_PORT,
    mcpAuthToken: process.env.MCP_AUTH_TOKEN,
    documentApiBaseUrl: process.env.DOCUMENT_API_BASE_URL,
    municipalityId: process.env.MUNICIPALITY_ID,
    documentApiAuthMode: process.env.DOCUMENT_API_AUTH_MODE,
    oauth2TokenUrl: process.env.OAUTH2_TOKEN_URL,
    oauth2ClientId: process.env.OAUTH2_CLIENT_ID,
    oauth2ClientSecret: process.env.OAUTH2_CLIENT_SECRET,
    logLevel: process.env.LOG_LEVEL,
    enableReportingTools: parseBool(process.env.ENABLE_REPORTING_TOOLS),
  });
}

function requireField(
  ctx: z.RefinementCtx,
  value: string | undefined,
  field: string,
): void {
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [field],
      message: `${field} is required when DOCUMENT_API_AUTH_MODE=oauth2`,
    });
  }
}

function parseBool(value: string | undefined): boolean {
  return value === "true" || value === "1";
}
