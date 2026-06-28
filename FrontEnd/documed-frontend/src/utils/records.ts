import { Admission, DocumentType, Patient, PatientDocument } from "../types";

/** Documenti che una cartella clinica deve contenere già durante la degenza attiva. */
export const MANDATORY_DOCUMENT_TYPES: DocumentType[] = [
  "IDENTITY_DOCUMENT",
  "ADMISSION_FORM",
  "CONSENT_FORM",
];

/** Tipi obbligatori che mancano alla cartella di un ricovero (in base ai documenti caricati). */
export function missingMandatoryTypes(
  admission: Admission,
  documents: PatientDocument[],
): DocumentType[] {
  const present = new Set(
    documents.filter((d) => d.admissionId === admission.id).map((d) => d.documentType),
  );
  return MANDATORY_DOCUMENT_TYPES.filter((t) => !present.has(t));
}

/** Ricoveri attivi a cui manca almeno un documento obbligatorio. */
export function incompleteAdmissions(
  admissions: Admission[],
  documents: PatientDocument[],
): Admission[] {
  return admissions
    .filter((a) => a.status === "ACTIVE")
    .filter((a) => missingMandatoryTypes(a, documents).length > 0);
}

/** Anagrafiche prive di un recapito (email o telefono) o del codice fiscale. */
export function incompletePatients(patients: Patient[]): Patient[] {
  return patients.filter((p) => !p.email || !p.phone || !p.fiscalCode);
}

/** Il ricovero "corrente" del paziente: quello attivo, altrimenti il più recente per data di ingresso. */
export function currentAdmission(admissions: Admission[]): Admission | undefined {
  const active = admissions.find((a) => a.status === "ACTIVE");
  if (active) return active;
  return [...admissions].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))[0];
}

export type PatientState = "RICOVERATO" | "DIMESSO" | "MAI_RICOVERATO";

/** Stato del paziente nella rubrica: ricoverato (degenza in corso), dimesso (solo ricoveri chiusi) o mai ricoverato. */
export function patientAdmissionState(admissions: Admission[]): PatientState {
  if (admissions.some((a) => a.status === "ACTIVE")) return "RICOVERATO";
  if (admissions.length > 0) return "DIMESSO";
  return "MAI_RICOVERATO";
}

/**
 * Estrae i metadati della cartella clinica dal campo `notes` del ricovero
 * (dove, per convenzione del mock, sono annotati regime e numero nosologico).
 * Tutto in sola lettura, con fallback se le note sono libere o assenti.
 */
export function parseAdmissionMeta(notes: string | null): { nosologico: string | null; regime: string | null } {
  if (!notes) return { nosologico: null, regime: null };
  const nosologico = notes.match(/Nosologico\s+([0-9/]+)/i)?.[1] ?? null;
  const first = notes.split(".")[0]?.trim() ?? "";
  const regime = /ricovero|day\s*hospital|day\s*surgery/i.test(first) ? first : null;
  return { nosologico, regime };
}

const MS_PER_DAY = 86_400_000;

/** Degenza media (giorni interi) dei ricoveri attualmente attivi, arrotondata. */
export function averageActiveStayDays(admissions: Admission[], now: Date): number {
  const active = admissions.filter((a) => a.status === "ACTIVE");
  if (active.length === 0) return 0;
  const totalDays = active.reduce((sum, a) => {
    const days = Math.floor((now.getTime() - new Date(a.admissionDate).getTime()) / MS_PER_DAY);
    return sum + Math.max(0, days);
  }, 0);
  return Math.round(totalDays / active.length);
}
