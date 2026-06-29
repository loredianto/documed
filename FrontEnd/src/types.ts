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

/** Medico/clinico selezionabile come riferimento del documento (lista per reparto). */
export interface Clinico {
  id: number;
  name: string;
  department: string;
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

export interface DailyActivity {
  date: string;
  admissions: number;
  discharges: number;
}

export interface PatientStatistics {
  totalPatients: number;
  activeAdmissions: number;
  admissionsToday: number;
  dischargesToday: number;
  lastSevenDays: DailyActivity[];
}

/** Provenienza del valore di un campo. */
export type FieldSource = "ocr" | "manual" | "empty";
/** Esito del confronto tra l'identità letta sul documento e il paziente del ricovero. */
export type MatchStatus = "MATCHED" | "REVIEW" | "UNRESOLVED";

/** Singolo campo strutturato estratto dall'OCR (la "versione digitale" del documento). */
export interface OcrField {
  /** Chiave canonica del campo (es. "patientName"): permette di conservare i valori al cambio tipologia. */
  key?: string;
  label: string;
  value: string;
  /** Confidenza OCR 0–1 (null se inserito a mano). */
  confidence?: number | null;
  /** Provenienza del valore. */
  source?: FieldSource;
  /** Campo correggibile a mano (es. data firma). Le altre date restano in sola lettura. */
  editable?: boolean;
}

/**
 * Tipologia DEDOTTA dall'OCR (non più scelta a monte): proposta + confidenza + alternative.
 * `status` AUTO = applicata in automatico; REVIEW = confidenza bassa o candidati troppo vicini;
 * CONFIRMED = confermata o corretta dall'operatore.
 */
export interface TypeClassification {
  type: DocumentType | null;
  confidence: number;
  status: "AUTO" | "REVIEW" | "CONFIRMED";
  candidates: { type: DocumentType; confidence: number }[];
}

/** Legami del documento alle entità reali + esito della verifica identità paziente. */
export interface DocumentResolution {
  patientId: number | null;
  doctorId: number | null;
  admissionId: number | null;
  patientMatch: {
    status: MatchStatus;
    score: number;
    /** Identità letta sul documento, confrontata col paziente del ricovero. */
    extractedName: string | null;
    extractedFiscalCode: string | null;
    /** patientId proposti, ordinati per score (per lo spostamento ad altro paziente). */
    candidates: number[];
  };
}

/** Rappresentazione digitale di un documento prodotta dall'OCR: titolo, campi chiave/valore e testo libero. */
export interface OcrExtraction {
  title: string;
  fields: OcrField[];
  bodyText: string | null;
  /** Tipologia dedotta dall'OCR. */
  classification?: TypeClassification;
  /** Risoluzione entità + verifica paziente. */
  resolution?: DocumentResolution;
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
  /** Dati strutturati estratti dall'OCR; null finché non elaborato. */
  ocrExtraction: OcrExtraction | null;
  ocrErrorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  /** true = versione digitale archiviata nella cartella clinica/fascicolo del paziente; false = ancora da acquisire. */
  filedInRecord: boolean;
}

export interface DocumentOcrResult {
  documentId: string;
  ocrStatus: OcrStatus;
  extractedText: string | null;
  ocrExtraction: OcrExtraction | null;
  ocrErrorMessage: string | null;
  processedAt: string | null;
}

export interface DocumentStatistics {
  totalDocuments: number;
  documentsByType: Partial<Record<DocumentType, number>>;
  documentsByOcrStatus: Partial<Record<OcrStatus, number>>;
}
