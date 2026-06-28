import { DocumentType, OcrField, TypeClassification } from "../types";

/** Tipo di campo: le date "date" sono correggibili con date picker se dedotte dall'OCR (vedi FieldsEditor). */
export type FieldKind = "text" | "date";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** Solo per le date: se true il campo è correggibile via date picker (es. data firma). */
  editable?: boolean;
}

// Definizioni canoniche dei campi, riusate tra le tipologie.
const F = {
  patientName:    { key: "patientName",    label: "Paziente",            kind: "text" } as FieldDef,
  fiscalCode:     { key: "fiscalCode",      label: "Codice fiscale",      kind: "text" } as FieldDef,
  birthDate:      { key: "birthDate",       label: "Data di nascita",     kind: "date" } as FieldDef,
  docKind:        { key: "docKind",         label: "Tipo documento",      kind: "text" } as FieldDef,
  expiry:         { key: "expiry",          label: "Scadenza",            kind: "date" } as FieldDef,
  department:     { key: "department",      label: "Reparto",             kind: "text" } as FieldDef,
  admissionDate:  { key: "admissionDate",   label: "Data ricovero",       kind: "date" } as FieldDef,
  acceptingDoctor:{ key: "acceptingDoctor", label: "Medico accettante",   kind: "text" } as FieldDef,
  treatment:      { key: "treatment",       label: "Trattamento",         kind: "text" } as FieldDef,
  signatureDate:  { key: "signatureDate",   label: "Data firma",          kind: "date", editable: true } as FieldDef,
  consentOutcome: { key: "consentOutcome",  label: "Esito",               kind: "text" } as FieldDef,
  examType:       { key: "examType",        label: "Esame",               kind: "text" } as FieldDef,
  examDate:       { key: "examDate",        label: "Data esame",          kind: "date" } as FieldDef,
  conclusions:    { key: "conclusions",     label: "Conclusioni",         kind: "text" } as FieldDef,
  dischargeDate:  { key: "dischargeDate",   label: "Data dimissione",     kind: "date" } as FieldDef,
  diagnosis:      { key: "diagnosis",       label: "Diagnosi",            kind: "text" } as FieldDef,
  homeTherapy:    { key: "homeTherapy",     label: "Terapia a domicilio", kind: "text" } as FieldDef,
  note:           { key: "note",            label: "Note",                kind: "text" } as FieldDef,
} satisfies Record<string, FieldDef>;

/** Campi mostrati nella versione digitale, per tipologia di documento. */
export const DOC_TYPE_FIELDS: Record<DocumentType, FieldDef[]> = {
  IDENTITY_DOCUMENT:  [F.patientName, F.fiscalCode, F.birthDate, F.docKind, F.expiry],
  ADMISSION_FORM:     [F.patientName, F.fiscalCode, F.department, F.admissionDate, F.acceptingDoctor],
  CONSENT_FORM:       [F.patientName, F.fiscalCode, F.treatment, F.signatureDate, F.consentOutcome],
  MEDICAL_REPORT:     [F.patientName, F.fiscalCode, F.examType, F.examDate, F.conclusions],
  DISCHARGE_DOCUMENT: [F.patientName, F.fiscalCode, F.department, F.dischargeDate, F.diagnosis, F.homeTherapy],
  OTHER:              [F.patientName, F.fiscalCode, F.note],
};

/** Titolo della versione digitale per tipologia. */
export const DOC_TYPE_TITLES: Record<DocumentType, string> = {
  IDENTITY_DOCUMENT:  "Documento di identità",
  ADMISSION_FORM:     "Modulo di ricovero",
  CONSENT_FORM:       "Consenso informato",
  MEDICAL_REPORT:     "Referto medico",
  DISCHARGE_DOCUMENT: "Lettera di dimissione",
  OTHER:              "Documento clinico",
};

/** Mappa etichette legacy → chiave canonica (per campi OCR privi di `key`). */
const LABEL_TO_KEY: Record<string, string> = {
  "Paziente": "patientName",
  "Cognome e nome": "patientName",
  "Codice fiscale": "fiscalCode",
  "Data di nascita": "birthDate",
  "Tipo documento": "docKind",
  "Scadenza": "expiry",
  "Reparto": "department",
  "Data ricovero": "admissionDate",
  "Medico accettante": "acceptingDoctor",
  "Trattamento": "treatment",
  "Data firma": "signatureDate",
  "Esito": "consentOutcome",
  "Esame": "examType",
  "Data": "examDate",
  "Data esame": "examDate",
  "Conclusioni": "conclusions",
  "Data dimissione": "dischargeDate",
  "Diagnosi": "diagnosis",
  "Terapia a domicilio": "homeTherapy",
  "Note": "note",
};

/** Raccoglie i valori OCR in una mappa per chiave canonica (così sopravvivono al cambio tipologia). */
export function extractionToValues(fields: OcrField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const f of fields) {
    const key = f.key ?? LABEL_TO_KEY[f.label];
    if (key && f.value) values[key] = f.value;
  }
  return values;
}

/** Costruisce i campi della tipologia a partire dai valori canonici disponibili. */
export function valuesToFields(values: Record<string, string>, type: DocumentType): OcrField[] {
  return DOC_TYPE_FIELDS[type].map((def) => ({
    key: def.key,
    label: def.label,
    value: values[def.key] ?? "",
    editable: def.editable ?? false,
    source: values[def.key] ? "ocr" : "empty",
  }));
}

/**
 * Parole chiave per dedurre la tipologia dal contenuto (testo OCR + nome file + descrizione).
 * Nel mock il segnale è povero (spesso solo il nome file); in produzione qui passa il testo OCR reale.
 */
const TYPE_KEYWORDS: { type: DocumentType; terms: string[] }[] = [
  { type: "CONSENT_FORM",       terms: ["consenso", "acconsento", "informato"] },
  { type: "DISCHARGE_DOCUMENT", terms: ["dimission", "lettera di dimission"] },
  { type: "ADMISSION_FORM",     terms: ["ricovero", "ammission", "accettazione"] },
  { type: "MEDICAL_REPORT",     terms: ["referto", "esame", "ecg", "tracciato", "diagnosi", "ortopedic"] },
  { type: "IDENTITY_DOCUMENT",  terms: ["identità", "identita", "patente", "passaporto", "carta d'identità"] },
];

/** Deduce la tipologia documentale dal contenuto, con confidenza e candidati alternativi. */
export function classifyDocument(text: string): TypeClassification {
  const hay = text.toLowerCase();
  const scored = TYPE_KEYWORDS
    .map(({ type, terms }) => {
      const hits = terms.filter((t) => hay.includes(t)).length;
      return { type, confidence: hits === 0 ? 0 : Math.min(0.95, 0.55 + hits * 0.2) };
    })
    .filter((c) => c.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) {
    // Nessun segnale: resta "altro", da confermare a mano.
    return { type: "OTHER", confidence: 0.3, status: "REVIEW", candidates: [{ type: "OTHER", confidence: 0.3 }] };
  }
  const [top, second] = scored;
  // REVIEW se confidenza bassa o due candidati troppo vicini fra loro.
  const ambiguous = top.confidence < 0.6 || (!!second && top.confidence - second.confidence < 0.15);
  return {
    type: top.type,
    confidence: top.confidence,
    status: ambiguous ? "REVIEW" : "AUTO",
    candidates: scored,
  };
}
