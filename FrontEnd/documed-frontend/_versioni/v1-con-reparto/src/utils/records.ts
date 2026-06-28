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
