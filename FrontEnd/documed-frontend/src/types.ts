export type AdmissionStatus = "ACTIVE" | "DISCHARGED";
export type OcrStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type DocumentType =
  | "IDENTITY_DOCUMENT"
  | "ADMISSION_FORM"
  | "CONSENT_FORM"
  | "MEDICAL_REPORT"
  | "DISCHARGE_DOCUMENT"
  | "OTHER";

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  email: string;
  phone: string;
}

export interface Admission {
  id: number;
  patientId: number;
  admissionDate: string;
  dischargeDate: string | null;
  department: string;
  notes: string | null;
  status: AdmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionInput {
  admissionDate: string;
  department: string;
  notes: string;
}

export interface PatientStatistics {
  totalPatients: number;
  activeAdmissions: number;
  admissionsToday: number;
  dischargesToday: number;
  lastSevenDays: Array<{ date: string; admissions: number; discharges: number }>;
}

export interface PatientDocument {
  id: string;
  patientId: number;
  admissionId: number;
  documentType: DocumentType;
  originalFilename: string;
  description: string | null;
  contentType: string;
  fileSize: number;
  ocrStatus: OcrStatus;
  extractedText: string | null;
  ocrErrorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

export interface DocumentOcrResult {
  documentId: string;
  ocrStatus: OcrStatus;
  extractedText: string | null;
  ocrErrorMessage: string | null;
  processedAt: string | null;
}

export interface DocumentStatistics {
  totalDocuments: number;
  documentsByType: Partial<Record<DocumentType, number>>;
  documentsByOcrStatus: Partial<Record<OcrStatus, number>>;
}
