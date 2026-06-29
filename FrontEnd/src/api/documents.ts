import { DocumentOcrResult, DocumentStatistics, DocumentType, OcrExtraction, OcrStatus, PatientDocument } from "../types";
import { apiFetch, requestJson } from "./http";

const PREVIEW_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const PREVIEW_PDF_TYPE = "application/pdf";

export interface DocumentSearchFilters {
  query?: string;
  patientId?: number;
  admissionId?: number;
  documentType?: DocumentType | "";
  ocrStatus?: OcrStatus | "";
}

export function buildDocumentSearchPath(filters: DocumentSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set("query", filters.query.trim());
  if (filters.patientId) params.set("patientId", String(filters.patientId));
  if (filters.admissionId) params.set("admissionId", String(filters.admissionId));
  if (filters.documentType) params.set("documentType", filters.documentType);
  if (filters.ocrStatus) params.set("ocrStatus", filters.ocrStatus);
  return `/api/documents/search?${params.toString()}`;
}

export const listDocuments = () =>
  requestJson<PatientDocument[]>("/api/documents");

export const searchDocuments = (filters: DocumentSearchFilters) =>
  requestJson<PatientDocument[]>(buildDocumentSearchPath(filters));

export const getDocument = (id: string) =>
  requestJson<PatientDocument>(`/api/documents/${id}`);

export const getAdmissionDocuments = (admissionId: number) =>
  requestJson<PatientDocument[]>(`/api/admissions/${admissionId}/documents`);

export const getDocumentStatistics = () =>
  requestJson<DocumentStatistics>("/api/documents/statistics");

export function uploadDocument(
  admissionId: number,
  file: File,
  documentType: DocumentType,
  description: string,
): Promise<PatientDocument> {
  const body = new FormData();
  body.append("file", file);
  body.append("documentType", documentType);
  if (description.trim()) body.append("description", description.trim());
  return requestJson<PatientDocument>(`/api/admissions/${admissionId}/documents`, { method: "POST", body });
}

export const processDocumentOcr = (id: string) =>
  requestJson<DocumentOcrResult>(`/api/documents/${id}/ocr`, { method: "POST" });

export interface DocumentOcrConfirmationInput {
  documentType: DocumentType;
  ocrExtraction: OcrExtraction;
}

export const confirmDocumentOcr = (id: string, input: DocumentOcrConfirmationInput): Promise<PatientDocument> =>
  requestJson<PatientDocument>(`/api/documents/${id}/ocr`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

export const getDocumentOcr = (id: string) =>
  requestJson<DocumentOcrResult>(`/api/documents/${id}/ocr`);

export const saveDocumentToRecord = (id: string) =>
  requestJson<{ documentId: string; filed: true }>(`/api/documents/${id}/file-in-record`, { method: "POST" });

export const deleteDocument = (id: string) =>
  requestJson<void>(`/api/documents/${id}`, { method: "DELETE" });

export function canPreviewDocument(document: PatientDocument): boolean {
  const contentType = document.contentType.toLowerCase();
  return PREVIEW_IMAGE_TYPES.has(contentType) || contentType === PREVIEW_PDF_TYPE;
}

export function isPreviewImage(document: PatientDocument): boolean {
  return PREVIEW_IMAGE_TYPES.has(document.contentType.toLowerCase());
}

export function isPreviewPdf(document: PatientDocument): boolean {
  return document.contentType.toLowerCase() === PREVIEW_PDF_TYPE;
}

export async function createDocumentPreviewUrl(document: PatientDocument): Promise<string | null> {
  if (!canPreviewDocument(document)) return null;
  const response = await apiFetch(`/api/documents/${document.id}/content`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function downloadDocument(document: PatientDocument): Promise<void> {
  const response = await apiFetch(`/api/documents/${document.id}/content`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.originalFilename;
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
