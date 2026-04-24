import { request } from "undici";
import type { Config } from "../config.js";

export type DocumentSearchParams = {
  query: string;
  page?: number;
  size?: number;
};

export type DocumentMetadata = {
  key: string;
  value: string;
};

export type DocumentSummary = {
  registrationNumber: string;
  revision: number;
  description?: string;
  metadata: DocumentMetadata[];
  confidentiality?: { confidential: boolean; legalCitation?: string };
};

export type DocumentSearchResponse = {
  documents: DocumentSummary[];
  _meta: {
    totalElements: number;
    totalPages: number;
    page: number;
    limit: number;
    count: number;
  };
};

export class DocumentApiClient {
  private cachedToken?: { accessToken: string; expiresAt: number };

  constructor(private readonly config: Config) {}

  async searchDocuments(
    params: DocumentSearchParams,
  ): Promise<DocumentSearchResponse> {
    const url = new URL(
      `${this.config.documentApiBaseUrl}/${this.config.municipalityId}/documents`,
    );
    url.searchParams.set("query", params.query);
    url.searchParams.set("onlyLatestRevision", "true");
    url.searchParams.set("status", "ACTIVE");
    if (params.page !== undefined) {
      url.searchParams.set("page", String(params.page));
    }
    if (params.size !== undefined) {
      url.searchParams.set("limit", String(params.size));
    }

    const token = await this.getAccessToken();
    const { statusCode, body } = await request(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    });
    if (statusCode < 200 || statusCode >= 300) {
      const text = await body.text();
      throw new Error(
        `document-api search failed (${statusCode}): ${text}`,
      );
    }
    return (await body.json()) as DocumentSearchResponse;
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
    const { statusCode, body } = await request(this.config.oauth2TokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (statusCode < 200 || statusCode >= 300) {
      const text = await body.text();
      throw new Error(`oauth2 token request failed (${statusCode}): ${text}`);
    }
    const payload = (await body.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: now + payload.expires_in * 1000,
    };
    return payload.access_token;
  }
}
