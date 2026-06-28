import { DocumentOcrResult, DocumentStatistics, DocumentType, MatchStatus, OcrExtraction, OcrStatus, PatientDocument } from "../types";
import { apiFetch, requestJson } from "./http";
import { MOCK_ADMISSIONS, MOCK_CLINICIANS, MOCK_DOC_STATISTICS, MOCK_DOCUMENTS, MOCK_PATIENTS } from "./mock-data";
import { classifyDocument, DOC_TYPE_TITLES, valuesToFields } from "../utils/ocrSchema";

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";
const PREVIEW_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

function mockDelay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

let mockDocuments = [...MOCK_DOCUMENTS];
let nextDocId = 100;

/** ISO "YYYY-MM-DD" → "DD/MM/YYYY" (evita gli scostamenti di fuso di toLocaleDateString). */
function itDate(iso: string): string {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

/** Genera una versione digitale strutturata (mock) a partire dal documento, simulando l'output OCR. */
function buildMockExtraction(doc: PatientDocument): OcrExtraction {
  const patient = MOCK_PATIENTS.find((p) => p.id === doc.patientId);
  const admission = MOCK_ADMISSIONS.find((a) => a.id === doc.admissionId);
  const values: Record<string, string> = {};
  if (patient) {
    values.patientName = `${patient.firstName} ${patient.lastName}`;
    values.fiscalCode = patient.fiscalCode;
    values.birthDate = itDate(patient.birthDate);
  }
  if (admission) {
    values.department = admission.department;
    values.admissionDate = itDate(admission.admissionDate);
    if (admission.dischargeDate) values.dischargeDate = itDate(admission.dischargeDate);
  }

  // Tipologia DEDOTTA dal contenuto (testo OCR + nome file + descrizione), non imposta a monte.
  const signal = [doc.extractedText, doc.originalFilename, doc.description].filter(Boolean).join(" ");
  const classification = classifyDocument(signal);
  const type = classification.type ?? "OTHER";

  // Verifica paziente: l'identità letta sul documento combacia col paziente del ricovero?
  const extractedFiscalCode = values.fiscalCode ?? null;
  const matched = !!patient && !!extractedFiscalCode && extractedFiscalCode === patient.fiscalCode;
  const status: MatchStatus = matched ? "MATCHED" : extractedFiscalCode ? "REVIEW" : "UNRESOLVED";

  // Medico firmatario letto dall'OCR: per i documenti tipicamente firmati lo deduciamo dal reparto
  // del ricovero (mock). Per gli altri (es. documento d'identità) resta vuoto → "non firmato".
  const SIGNED_TYPES: DocumentType[] = ["CONSENT_FORM", "MEDICAL_REPORT", "DISCHARGE_DOCUMENT", "ADMISSION_FORM"];
  const signingDoctor =
    admission && SIGNED_TYPES.includes(type)
      ? MOCK_CLINICIANS.find((c) => c.department === admission.department)
      : undefined;

  return {
    title: DOC_TYPE_TITLES[type],
    fields: valuesToFields(values, type),
    bodyText: null,
    classification,
    resolution: {
      patientId: doc.patientId ?? null,
      doctorId: signingDoctor?.id ?? null,
      admissionId: doc.admissionId ?? null,
      patientMatch: {
        status,
        score: matched ? 1 : extractedFiscalCode ? 0.5 : 0,
        extractedName: values.patientName ?? null,
        extractedFiscalCode,
        candidates: patient ? [patient.id] : [],
      },
    },
  };
}

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
  MOCK ? mockDelay([...mockDocuments]) : requestJson<PatientDocument[]>("/api/documents");

export const searchDocuments = (filters: DocumentSearchFilters) => {
  if (MOCK) {
    let results = [...mockDocuments];
    if (filters.patientId) results = results.filter((d) => d.patientId === filters.patientId);
    if (filters.admissionId) results = results.filter((d) => d.admissionId === filters.admissionId);
    if (filters.documentType) results = results.filter((d) => d.documentType === filters.documentType);
    if (filters.ocrStatus) results = results.filter((d) => d.ocrStatus === filters.ocrStatus);
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      results = results.filter(
        (d) =>
          d.originalFilename.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.extractedText?.toLowerCase().includes(q),
      );
    }
    return mockDelay(results);
  }
  return requestJson<PatientDocument[]>(buildDocumentSearchPath(filters));
};

export const getDocument = (id: string) =>
  MOCK
    ? mockDelay(mockDocuments.find((d) => d.id === id)!)
    : requestJson<PatientDocument>(`/api/documents/${id}`);

export const getAdmissionDocuments = (admissionId: number) =>
  MOCK
    ? mockDelay(mockDocuments.filter((d) => d.admissionId === admissionId))
    : requestJson<PatientDocument[]>(`/api/admissions/${admissionId}/documents`);

export const getDocumentStatistics = () =>
  MOCK ? mockDelay({ ...MOCK_DOC_STATISTICS }) : requestJson<DocumentStatistics>("/api/documents/statistics");

export function uploadDocument(
  admissionId: number,
  file: File,
  documentType: DocumentType,
  description: string,
): Promise<PatientDocument> {
  if (MOCK) {
    const doc: PatientDocument = {
      id: `doc-mock-${nextDocId++}`,
      patientId: MOCK_ADMISSIONS.find((a) => a.id === admissionId)?.patientId ?? 0,
      admissionId,
      documentType,
      originalFilename: file.name,
      description: description || null,
      contentType: file.type,
      fileSize: file.size,
      ocrStatus: "PENDING",
      extractedText: null,
      ocrExtraction: null,
      ocrErrorMessage: null,
      uploadedAt: new Date().toISOString(),
      processedAt: null,
      filedInRecord: false, // appena caricato: non ancora archiviato in cartella clinica
    };
    mockDocuments = [...mockDocuments, doc];
    return mockDelay(doc);
  }
  const body = new FormData();
  body.append("file", file);
  body.append("documentType", documentType);
  if (description.trim()) body.append("description", description.trim());
  return requestJson<PatientDocument>(`/api/admissions/${admissionId}/documents`, { method: "POST", body });
}

export const processDocumentOcr = (id: string) => {
  if (MOCK) {
    const doc = mockDocuments.find((d) => d.id === id)!;
    const extraction = doc.ocrExtraction ?? buildMockExtraction(doc);
    // La tipologia la assegna l'OCR: se dedotta, sovrascrive il provvisorio "OTHER" del caricamento.
    const deducedType = extraction.classification?.type ?? doc.documentType;
    const result: DocumentOcrResult = {
      documentId: id,
      ocrStatus: "COMPLETED",
      extractedText: extraction.fields.map((f) => `${f.label}: ${f.value}`).join("\n"),
      ocrExtraction: extraction,
      ocrErrorMessage: null,
      processedAt: new Date().toISOString(),
    };
    mockDocuments = mockDocuments.map((d) =>
      d.id === id
        ? { ...d, documentType: deducedType, ocrStatus: "COMPLETED", extractedText: result.extractedText, ocrExtraction: extraction, ocrErrorMessage: null, processedAt: result.processedAt }
        : d,
    );
    // simula il tempo di scansione (~1.2s)
    return mockDelay(result, 1200);
  }
  return requestJson<DocumentOcrResult>(`/api/documents/${id}/ocr`, { method: "POST" });
};

export interface DocumentOcrConfirmationInput {
  documentType: DocumentType;
  ocrExtraction: OcrExtraction;
}

export const confirmDocumentOcr = (id: string, input: DocumentOcrConfirmationInput): Promise<PatientDocument> => {
  if (MOCK) {
    let updated: PatientDocument | undefined;
    mockDocuments = mockDocuments.map((d) => {
      if (d.id !== id) return d;
      updated = {
        ...d,
        documentType: input.documentType,
        ocrStatus: "COMPLETED",
        ocrExtraction: input.ocrExtraction,
        ocrErrorMessage: null,
      };
      return updated;
    });
    return mockDelay(updated!);
  }
  return requestJson<PatientDocument>(`/api/documents/${id}/ocr`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
};

export const getDocumentOcr = (id: string) => {
  if (MOCK) {
    const doc = mockDocuments.find((d) => d.id === id)!;
    return mockDelay<DocumentOcrResult>({
      documentId: id,
      ocrStatus: doc.ocrStatus,
      extractedText: doc.extractedText,
      ocrExtraction: doc.ocrExtraction,
      ocrErrorMessage: doc.ocrErrorMessage,
      processedAt: doc.processedAt,
    });
  }
  return requestJson<DocumentOcrResult>(`/api/documents/${id}/ocr`);
};

/**
 * MOCK front-end — "Salva nella cartella clinica del paziente".
 * Nessun endpoint backend esistente: vedi nota di handoff.
 */
export const saveDocumentToRecord = (id: string) => {
  if (MOCK) {
    // Archivia la versione digitale nella cartella clinica: aggiorna il flag persistente.
    mockDocuments = mockDocuments.map((d) => (d.id === id ? { ...d, filedInRecord: true } : d));
    return mockDelay<{ documentId: string; filed: true }>({ documentId: id, filed: true }, 600);
  }
  return requestJson(`/api/documents/${id}/file-in-record`, { method: "POST" });
};

export const deleteDocument = (id: string) => {
  if (MOCK) {
    mockDocuments = mockDocuments.filter((d) => d.id !== id);
    return mockDelay<void>(undefined);
  }
  return requestJson<void>(`/api/documents/${id}`, { method: "DELETE" });
};

export function canPreviewDocument(document: PatientDocument): boolean {
  return PREVIEW_IMAGE_TYPES.has(document.contentType.toLowerCase());
}

export async function createDocumentPreviewUrl(document: PatientDocument): Promise<string | null> {
  if (!canPreviewDocument(document) || MOCK) return null;
  const response = await apiFetch(`/api/documents/${document.id}/content`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function downloadDocument(document: PatientDocument): Promise<void> {
  if (MOCK) {
    alert(`[Mock] Download simulato: ${document.originalFilename}`);
    return;
  }
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
