import { z } from "zod";

export const registrationNumberSchema = z
  .string()
  .min(1)
  .describe("Document registration number, for example 2023-2281-1337.");

export const pageSchema = z
  .number()
  .int()
  .min(0)
  .optional()
  .describe("Zero-based page index. Defaults to 0.");

export const sizeSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe("Page size, 1-100. Defaults to the service default.");

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .describe("ISO date-time with timezone offset, for example 2026-01-01T00:00:00+01:00.");
