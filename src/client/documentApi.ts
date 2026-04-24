import type { Config } from "../config.js";
import type { components, operations } from "../generated/documentApiTypes.js";
import type { HttpRequester, HttpResponse } from "./http.js";
import { undiciRequester } from "./http.js";

type SearchQuery = operations["search"]["parameters"]["query"];
type SearchFileMatchesQuery =
  operations["searchFileMatches"]["parameters"]["query"];
type ReadDocumentQuery = NonNullable<
  operations["read"]["parameters"]["query"]
>;
type ReadRevisionsQuery = NonNullable<
  operations["readRevisions"]["parameters"]["query"]
>;
type ReadStatisticsQuery = NonNullable<
  operations["readStatistics"]["parameters"]["query"]
>;
type StatisticsOverviewQuery = NonNullable<
  operations["statistics"]["parameters"]["query"]
>;

export type DocumentSearchParams = Pick<SearchQuery, "query" | "page" | "size">;

export type SearchFileMatchesParams = Pick<
  SearchFileMatchesQuery,
  "query" | "page" | "size"
>;

export type ReadDocumentParams = {
  registrationNumber: string;
} & Pick<ReadDocumentQuery, "includeConfidential" | "includeNonPublic">;

export type ReadDocumentRevisionsParams = {
  registrationNumber: string;
} & Pick<ReadRevisionsQuery, "includeConfidential" | "page" | "size">;

export type ReadDocumentStatisticsParams = {
  registrationNumber: string;
} & Pick<ReadStatisticsQuery, "from" | "to">;

export type ReadStatisticsOverviewParams = Pick<
  StatisticsOverviewQuery,
  "createdBy"
>;

export type Document = components["schemas"]["Document"];
export type DocumentSearchResponse = components["schemas"]["PagedDocumentResponse"];
export type DocumentFileMatchResponse =
  components["schemas"]["PagedDocumentMatchResponse"];
export type DocumentMatch = components["schemas"]["DocumentMatch"];
export type FileMatch = components["schemas"]["FileMatch"];
export type DocumentStatistics = components["schemas"]["DocumentStatistics"];
export type DocumentStatisticsOverview =
  components["schemas"]["DocumentStatisticsOverview"];
export type DocumentType = components["schemas"]["DocumentType"];

type OAuth2TokenResponse = {
  access_token: string;
  expires_in: number;
};

export class DocumentApiClient {
  private cachedToken?: { accessToken: string; expiresAt: number };

  constructor(
    private readonly config: Config,
    private readonly requester: HttpRequester = undiciRequester,
  ) {}

  async searchDocuments(
    params: DocumentSearchParams,
  ): Promise<DocumentSearchResponse> {
    const url = this.documentUrl("/documents");
    url.searchParams.set("query", params.query);
    url.searchParams.set("includeConfidential", "false");
    url.searchParams.set("onlyLatestRevision", "true");
    if (params.page !== undefined) {
      url.searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      url.searchParams.set("size", String(params.size));
    }

    return this.getJson<DocumentSearchResponse>(url, "document-api search");
  }

  async searchFileMatches(
    params: SearchFileMatchesParams,
  ): Promise<DocumentFileMatchResponse> {
    const url = this.documentUrl("/documents/file-matches");
    for (const query of params.query) {
      url.searchParams.append("query", query);
    }
    url.searchParams.set("includeConfidential", "false");
    url.searchParams.set("onlyLatestRevision", "true");
    url.searchParams.append("statuses", "ACTIVE");
    if (params.page !== undefined) {
      url.searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      url.searchParams.set("size", String(params.size));
    }

    return this.getJson<DocumentFileMatchResponse>(
      url,
      "document-api search file-matches",
    );
  }

  async getDocument(params: ReadDocumentParams): Promise<Document> {
    const url = this.documentUrl(
      `/documents/${encodeURIComponent(params.registrationNumber)}`,
    );
    url.searchParams.set(
      "includeConfidential",
      String(params.includeConfidential ?? false),
    );
    url.searchParams.set(
      "includeNonPublic",
      String(params.includeNonPublic ?? false),
    );

    return this.getJson<Document>(url, "document-api read document");
  }

  async getDocumentRevisions(
    params: ReadDocumentRevisionsParams,
  ): Promise<DocumentSearchResponse> {
    const url = this.documentUrl(
      `/documents/${encodeURIComponent(params.registrationNumber)}/revisions`,
    );
    url.searchParams.set(
      "includeConfidential",
      String(params.includeConfidential ?? false),
    );
    if (params.page !== undefined) {
      url.searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      url.searchParams.set("size", String(params.size));
    }

    return this.getJson<DocumentSearchResponse>(
      url,
      "document-api read revisions",
    );
  }

  async listDocumentTypes(): Promise<DocumentType[]> {
    return this.getJson<DocumentType[]>(
      this.documentUrl("/admin/documenttypes"),
      "document-api list document types",
    );
  }

  async getDocumentStatistics(
    params: ReadDocumentStatisticsParams,
  ): Promise<DocumentStatistics> {
    const url = this.documentUrl(
      `/documents/${encodeURIComponent(params.registrationNumber)}/statistics`,
    );
    if (params.from !== undefined) {
      url.searchParams.set("from", params.from);
    }
    if (params.to !== undefined) {
      url.searchParams.set("to", params.to);
    }

    return this.getJson<DocumentStatistics>(
      url,
      "document-api read document statistics",
    );
  }

  async getStatisticsOverview(
    params: ReadStatisticsOverviewParams,
  ): Promise<DocumentStatisticsOverview> {
    const url = this.documentUrl("/documents/statistics");
    if (params.createdBy !== undefined) {
      url.searchParams.set("createdBy", params.createdBy);
    }

    return this.getJson<DocumentStatisticsOverview>(
      url,
      "document-api read statistics overview",
    );
  }

  private documentUrl(path: string): URL {
    return new URL(
      `${trimTrailingSlash(this.config.documentApiBaseUrl)}/${encodeURIComponent(
        this.config.municipalityId,
      )}${path}`,
    );
  }

  private async getJson<T>(url: URL, operation: string): Promise<T> {
    const token = await this.getAccessToken();
    const response = await this.requester(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    });

    await assertSuccess(response, operation);
    return (await response.body.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 5_000) {
      return this.cachedToken.accessToken;
    }

    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.oauth2ClientId,
      client_secret: this.config.oauth2ClientSecret,
    });
    const response = await this.requester(this.config.oauth2TokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    await assertSuccess(response, "oauth2 token request");
    const payload = (await response.body.json()) as OAuth2TokenResponse;
    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: now + payload.expires_in * 1000,
    };
    return payload.access_token;
  }
}

async function assertSuccess(
  response: HttpResponse,
  operation: string,
): Promise<void> {
  if (response.statusCode >= 200 && response.statusCode < 300) {
    return;
  }

  const text = await response.body.text();
  throw new Error(`${operation} failed (${response.statusCode}): ${text}`);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
