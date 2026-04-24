import type {
  Document,
  DocumentFileMatchResponse,
  DocumentMatch,
  DocumentSearchResponse,
  DocumentStatistics,
  DocumentStatisticsOverview,
  DocumentType,
  FileMatch,
} from "../client/documentApi.js";

export function toDocumentListPayload(result: DocumentSearchResponse) {
  return {
    totalRecords: result._meta?.totalRecords ?? 0,
    totalPages: result._meta?.totalPages ?? 0,
    page: result._meta?.page ?? 0,
    size: result._meta?.limit ?? 0,
    count: result._meta?.count ?? result.documents?.length ?? 0,
    documents: (result.documents ?? []).map(toDocumentSummary),
  };
}

export function toFileMatchesPayload(result: DocumentFileMatchResponse) {
  return {
    totalRecords: result._meta?.totalRecords ?? 0,
    totalPages: result._meta?.totalPages ?? 0,
    page: result._meta?.page ?? 0,
    size: result._meta?.limit ?? 0,
    count: result._meta?.count ?? result.documents?.length ?? 0,
    documents: (result.documents ?? []).map(toDocumentMatchSummary),
  };
}

export function toDocumentPayload(document: Document) {
  return {
    ...toDocumentSummary(document),
    municipalityId: document.municipalityId,
    created: document.created,
    createdBy: document.createdBy,
    updatedBy: document.updatedBy,
    archive: document.archive,
    metadata: document.metadataList ?? [],
    responsibilities: document.responsibilities ?? [],
    files: (document.documentData ?? []).map((file) => ({
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSizeInBytes: file.fileSizeInBytes,
    })),
  };
}

export function toDocumentTypesPayload(documentTypes: DocumentType[]) {
  return {
    count: documentTypes.length,
    documentTypes: [...documentTypes]
      .sort((a, b) => a.type.localeCompare(b.type))
      .map((documentType) => ({
        type: documentType.type,
        displayName: documentType.displayName,
      })),
  };
}

export function toDocumentStatisticsPayload(statistics: DocumentStatistics) {
  return {
    municipalityId: statistics.municipalityId,
    registrationNumber: statistics.registrationNumber,
    from: statistics.from,
    to: statistics.to,
    totalAccesses: statistics.totalAccesses ?? 0,
    perRevision: (statistics.perRevision ?? []).map((revision) => ({
      revision: revision.revision,
      downloads: revision.downloads ?? 0,
      views: revision.views ?? 0,
      files: (revision.perFile ?? []).map((file) => ({
        documentDataId: file.documentDataId,
        fileName: file.fileName,
        downloads: file.downloads ?? 0,
        views: file.views ?? 0,
      })),
    })),
  };
}

export function toStatisticsOverviewPayload(
  statistics: DocumentStatisticsOverview,
) {
  return {
    municipalityId: statistics.municipalityId,
    scope: statistics.scope,
    createdBy: statistics.createdBy,
    generatedAt: statistics.generatedAt,
    totalDocuments: statistics.totalDocuments ?? 0,
    byStatus: statistics.byStatus ?? {},
    byConfidentiality: statistics.byConfidentiality,
    byDocumentType: statistics.byDocumentType ?? [],
    byRegistrationYear: statistics.byRegistrationYear ?? [],
    revisionDistribution: statistics.revisionDistribution,
    documentsWithoutFiles: statistics.documentsWithoutFiles ?? 0,
    expiringSoon: statistics.expiringSoon,
  };
}

function toDocumentMatchSummary(match: DocumentMatch) {
  return {
    registrationNumber: match.registrationNumber,
    revision: match.revision,
    files: (match.files ?? []).map(toFileMatchSummary),
  };
}

function toFileMatchSummary(file: FileMatch) {
  return {
    id: file.id,
    fileName: file.fileName,
    pageCount: file.pageCount,
    score: file.score,
    extractionStatus: file.extractionStatus,
    highlights: file.highlights ?? {},
    matches: (file.matches ?? []).map((match) => ({
      field: match.field,
      page: match.page,
      start: match.start,
      end: match.end,
    })),
  };
}

function toDocumentSummary(document: Document) {
  return {
    registrationNumber: document.registrationNumber,
    revision: document.revision,
    title: document.title ?? metadataValue(document.metadataList, "title"),
    description: document.description,
    type: document.type,
    status: document.status,
    validFrom: document.validFrom,
    validTo: document.validTo,
    confidential: document.confidentiality?.confidential ?? false,
  };
}

function metadataValue(
  metadata: { key: string; value: string }[] | undefined,
  key: string,
): string | undefined {
  return metadata?.find((m) => m.key.toLowerCase() === key.toLowerCase())?.value;
}
