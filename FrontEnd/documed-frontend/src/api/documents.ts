import { DocumentOcrResult, DocumentStatistics, DocumentType, OcrStatus, PatientDocument } from "../types";
import { apiFetch, requestJson } from "./http";

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

export const listDocuments = () => requestJson<PatientDocument[]>("/api/documents");
export const searchDocuments = (filters: DocumentSearchFilters) =>
  requestJson<PatientDocument[]>(buildDocumentSearchPath(filters));
export const getDocument = (id: string) => requestJson<PatientDocument>(`/api/documents/${id}`);
export const getAdmissionDocuments = (admissionId: number) =>
  requestJson<PatientDocument[]>(`/api/admissions/${admissionId}/documents`);
export const getDocumentStatistics = () => requestJson<DocumentStatistics>("/api/documents/statistics");

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
export const getDocumentOcr = (id: string) =>
  requestJson<DocumentOcrResult>(`/api/documents/${id}/ocr`);
export const deleteDocument = (id: string) =>
  requestJson<void>(`/api/documents/${id}`, { method: "DELETE" });

/**
 * Loads protected GridFS content without forcing a browser download. The
 * caller owns any object URL created from the returned Blob.
 */
export async function getDocumentContent(id: string): Promise<Blob> {
  const response = await apiFetch(`/api/documents/${id}/content`);
  return response.blob();
}

export async function downloadDocument(document: PatientDocument): Promise<void> {
  const blob = await getDocumentContent(document.id);
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
