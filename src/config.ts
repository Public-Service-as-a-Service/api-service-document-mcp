import { z } from "zod";

const ConfigSchema = z.object({
  documentApiBaseUrl: z.string().url(),
  municipalityId: z.string().min(1),
  oauth2TokenUrl: z.string().url(),
  oauth2ClientId: z.string().min(1),
  oauth2ClientSecret: z.string().min(1),
  logLevel: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    documentApiBaseUrl: process.env.DOCUMENT_API_BASE_URL,
    municipalityId: process.env.MUNICIPALITY_ID,
    oauth2TokenUrl: process.env.OAUTH2_TOKEN_URL,
    oauth2ClientId: process.env.OAUTH2_CLIENT_ID,
    oauth2ClientSecret: process.env.OAUTH2_CLIENT_SECRET,
    logLevel: process.env.LOG_LEVEL,
  });
}
