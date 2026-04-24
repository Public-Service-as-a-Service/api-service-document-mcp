import { describe, expect, it } from "vitest";
import { DocumentApiClient } from "./documentApi.js";
import type { HttpRequester } from "./http.js";
import type { Config } from "../config.js";

const config: Config = {
  transport: "stdio",
  httpPort: 3000,
  documentApiBaseUrl: "https://document.example/api/",
  municipalityId: "2281",
  documentApiAuthMode: "oauth2",
  oauth2TokenUrl: "https://auth.example/token",
  oauth2ClientId: "client-id",
  oauth2ClientSecret: "client-secret",
  logLevel: "info",
  enableReportingTools: false,
};

describe("DocumentApiClient", () => {
  it("searches latest public active documents with size query parameter", async () => {
    const calls: RecordedCall[] = [];
    const client = new DocumentApiClient(config, createRequester(calls, {
      documents: [],
      _meta: {
        page: 1,
        limit: 25,
        count: 0,
        totalRecords: 0,
        totalPages: 0,
      },
    }));

    await client.searchDocuments({ query: "plan*", page: 1, size: 25 });

    const searchCall = calls[1];
    expect(searchCall?.method).toBe("GET");
    expect(searchCall?.url.pathname).toBe("/api/2281/documents");
    expect(searchCall?.url.searchParams.get("query")).toBe("plan*");
    expect(searchCall?.url.searchParams.get("onlyLatestRevision")).toBe("true");
    expect(searchCall?.url.searchParams.get("includeConfidential")).toBe("false");
    expect(searchCall?.url.searchParams.get("page")).toBe("1");
    expect(searchCall?.url.searchParams.get("size")).toBe("25");
    expect(searchCall?.url.searchParams.has("limit")).toBe(false);
  });

  it("reuses an access token across API calls", async () => {
    const calls: RecordedCall[] = [];
    const client = new DocumentApiClient(config, createRequester(calls, {
      type: "POLICY",
      displayName: "Policy",
    }));

    await client.listDocumentTypes();
    await client.listDocumentTypes();

    const tokenCalls = calls.filter(
      (call) => call.url.href === config.oauth2TokenUrl,
    );
    const apiCalls = calls.filter(
      (call) => call.url.href !== config.oauth2TokenUrl,
    );
    expect(tokenCalls).toHaveLength(1);
    expect(apiCalls).toHaveLength(2);
    expect(apiCalls[0]?.headers.authorization).toBe("Bearer test-token");
    expect(apiCalls[0]?.url.pathname).toBe("/api/2281/admin/documenttypes");
  });

  it("builds read-only document detail URLs", async () => {
    const calls: RecordedCall[] = [];
    const client = new DocumentApiClient(config, createRequester(calls, {
      registrationNumber: "2026-2281-1",
      revision: 3,
    }));

    await client.getDocument({ registrationNumber: "2026-2281-1" });

    const readCall = calls[1];
    expect(readCall?.url.pathname).toBe("/api/2281/documents/2026-2281-1");
    expect(readCall?.url.searchParams.get("includeConfidential")).toBe("false");
    expect(readCall?.url.searchParams.get("includeNonPublic")).toBe("false");
  });

  it("searches file matches scoped to active, public, latest revisions", async () => {
    const calls: RecordedCall[] = [];
    const client = new DocumentApiClient(
      config,
      createRequester(calls, {
        documents: [],
        _meta: {
          page: 0,
          limit: 20,
          count: 0,
          totalRecords: 0,
          totalPages: 0,
        },
      }),
    );

    await client.searchFileMatches({ query: ["budget"], size: 5 });

    const matchCall = calls[1];
    expect(matchCall?.url.pathname).toBe("/api/2281/documents/file-matches");
    expect(matchCall?.url.searchParams.getAll("query")).toEqual(["budget"]);
    expect(matchCall?.url.searchParams.get("includeConfidential")).toBe("false");
    expect(matchCall?.url.searchParams.get("onlyLatestRevision")).toBe("true");
    expect(matchCall?.url.searchParams.getAll("statuses")).toEqual(["ACTIVE"]);
    expect(matchCall?.url.searchParams.get("size")).toBe("5");
  });

  it("appends multiple file-match queries for OR combination", async () => {
    const calls: RecordedCall[] = [];
    const client = new DocumentApiClient(
      config,
      createRequester(calls, {
        documents: [],
        _meta: {
          page: 0,
          limit: 20,
          count: 0,
          totalRecords: 0,
          totalPages: 0,
        },
      }),
    );

    await client.searchFileMatches({ query: ["budget", "förslag"] });

    const matchCall = calls[1];
    expect(matchCall?.url.searchParams.getAll("query")).toEqual([
      "budget",
      "förslag",
    ]);
  });

  it("skips the oauth2 token flow when documentApiAuthMode is 'none'", async () => {
    const calls: RecordedCall[] = [];
    const noAuthConfig: Config = {
      ...config,
      documentApiAuthMode: "none",
      oauth2TokenUrl: undefined,
      oauth2ClientId: undefined,
      oauth2ClientSecret: undefined,
    };
    const client = new DocumentApiClient(
      noAuthConfig,
      createRequester(calls, []),
    );

    await client.listDocumentTypes();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url.pathname).toBe("/api/2281/admin/documenttypes");
    expect(calls[0]?.headers.authorization).toBeUndefined();
  });

  it("surfaces non-2xx responses with operation context", async () => {
    const client = new DocumentApiClient(config, async () => ({
      statusCode: 500,
      body: {
        json: async () => ({}),
        text: async () => "server exploded",
      },
    }));

    await expect(client.listDocumentTypes()).rejects.toThrow(
      "oauth2 token request failed (500): server exploded",
    );
  });
});

type RecordedCall = {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

function createRequester(
  calls: RecordedCall[],
  apiPayload: unknown,
): HttpRequester {
  return async (url, options) => {
    const resolvedUrl = new URL(String(url));
    calls.push({
      url: resolvedUrl,
      method: options.method,
      headers: options.headers ?? {},
      body: options.body,
    });

    if (resolvedUrl.href === config.oauth2TokenUrl) {
      return jsonResponse({ access_token: "test-token", expires_in: 3600 });
    }

    return jsonResponse(Array.isArray(apiPayload) ? apiPayload : [apiPayload]);
  };
}

function jsonResponse(payload: unknown) {
  return {
    statusCode: 200,
    body: {
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    },
  };
}
