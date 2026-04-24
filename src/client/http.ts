import { request } from "undici";

export type HttpRequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
};

export type HttpResponse = {
  statusCode: number;
  body: {
    json(): Promise<unknown>;
    text(): Promise<string>;
  };
};

export type HttpRequester = (
  url: string | URL,
  options: HttpRequestOptions,
) => Promise<HttpResponse>;

export const undiciRequester: HttpRequester = request;
