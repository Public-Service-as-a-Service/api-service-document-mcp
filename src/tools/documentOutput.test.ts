import { describe, expect, it } from "vitest";
import {
  toDocumentListPayload,
  toDocumentPayload,
  toDocumentTypesPayload,
  toFileMatchesPayload,
} from "./documentOutput.js";

describe("document output mapping", () => {
  it("maps paged document responses into compact MCP payloads", () => {
    const payload = toDocumentListPayload({
      documents: [
        {
          registrationNumber: "2026-2281-1",
          revision: 2,
          title: "Decision",
          description: "Published decision",
          type: "DECISION",
          status: "ACTIVE",
          confidentiality: { confidential: false },
        },
      ],
      _meta: {
        page: 0,
        limit: 20,
        count: 1,
        totalRecords: 1,
        totalPages: 1,
      },
    });

    expect(payload).toEqual({
      totalRecords: 1,
      totalPages: 1,
      page: 0,
      size: 20,
      count: 1,
      documents: [
        {
          registrationNumber: "2026-2281-1",
          revision: 2,
          title: "Decision",
          description: "Published decision",
          type: "DECISION",
          status: "ACTIVE",
          validFrom: undefined,
          validTo: undefined,
          confidential: false,
        },
      ],
    });
  });

  it("maps document details without exposing file binary content", () => {
    const payload = toDocumentPayload({
      registrationNumber: "2026-2281-1",
      revision: 1,
      title: "Report",
      documentData: [
        {
          id: "file-1",
          fileName: "report.pdf",
          mimeType: "application/pdf",
          fileSizeInBytes: 42,
        },
      ],
    });

    expect(payload.files).toEqual([
      {
        id: "file-1",
        fileName: "report.pdf",
        mimeType: "application/pdf",
        fileSizeInBytes: 42,
      },
    ]);
    expect(JSON.stringify(payload)).not.toContain("content");
  });

  it("maps file matches with page-level offsets and highlights", () => {
    const payload = toFileMatchesPayload({
      documents: [
        {
          id: "doc-1",
          registrationNumber: "2026-2281-9",
          revision: 4,
          files: [
            {
              id: "file-1",
              fileName: "budget.pdf",
              pageCount: 12,
              score: 7.5,
              extractionStatus: "SUCCESS",
              highlights: {
                extractedText: ["... the <em>budget</em> for 2026 ..."],
              },
              matches: [
                { field: "extractedText", page: 3, start: 1500, end: 1506 },
              ],
              confidential: false,
            },
          ],
        },
      ],
      _meta: {
        page: 0,
        limit: 20,
        count: 1,
        totalRecords: 1,
        totalPages: 1,
      },
    });

    expect(payload.totalRecords).toBe(1);
    expect(payload.documents).toEqual([
      {
        registrationNumber: "2026-2281-9",
        revision: 4,
        files: [
          {
            id: "file-1",
            fileName: "budget.pdf",
            pageCount: 12,
            score: 7.5,
            extractionStatus: "SUCCESS",
            highlights: {
              extractedText: ["... the <em>budget</em> for 2026 ..."],
            },
            matches: [
              { field: "extractedText", page: 3, start: 1500, end: 1506 },
            ],
          },
        ],
      },
    ]);
  });

  it("defaults file-match highlights and matches to empty collections", () => {
    const payload = toFileMatchesPayload({
      documents: [
        {
          registrationNumber: "2026-2281-10",
          revision: 1,
          files: [
            { id: "file-2", fileName: "memo.docx", extractionStatus: "UNSUPPORTED" },
          ],
        },
      ],
      _meta: { page: 0, limit: 20, count: 1, totalRecords: 1, totalPages: 1 },
    });

    const file = payload.documents[0]?.files[0];
    expect(file?.highlights).toEqual({});
    expect(file?.matches).toEqual([]);
  });

  it("sorts document types by type for stable output", () => {
    const payload = toDocumentTypesPayload([
      { type: "ZONING", displayName: "Zoning" },
      { type: "AGREEMENT", displayName: "Agreement" },
    ]);

    expect(payload.documentTypes.map((documentType) => documentType.type)).toEqual([
      "AGREEMENT",
      "ZONING",
    ]);
  });
});
