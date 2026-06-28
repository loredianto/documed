import { AdmissionStatus, OcrStatus } from "../types";
import { PatientState } from "../utils/records";

export const STATUS_LABELS: Record<AdmissionStatus | OcrStatus, string> = {
  ACTIVE:      "Attivo",
  DISCHARGED:  "Dimesso",
  PENDING:     "In attesa OCR",
  PROCESSING:  "In elaborazione",
  COMPLETED:   "Completato",
  FAILED:      "Fallito",
};

export function statusLabel(status: AdmissionStatus | OcrStatus): string {
  return STATUS_LABELS[status];
}

export function StatusBadge({ status }: { status: AdmissionStatus | OcrStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>;
}

const PATIENT_STATE: Record<PatientState, { label: string; cls: string }> = {
  RICOVERATO:     { label: "Ricoverato",     cls: "status-active" },
  DIMESSO:        { label: "Dimesso",        cls: "status-discharged" },
  MAI_RICOVERATO: { label: "Mai ricoverato", cls: "status-none" },
};

/** Stato del paziente nella rubrica: ricoverato / dimesso / mai ricoverato. */
export function PatientStateBadge({ state }: { state: PatientState }) {
  const { label, cls } = PATIENT_STATE[state];
  return <span className={`status ${cls}`}>{label}</span>;
}

/** Dicitura sull'archiviazione del documento nella cartella clinica/fascicolo del paziente. */
export function RecordFlag({ filed }: { filed: boolean }) {
  return (
    <span className={`dm-record-flag${filed ? " is-filed" : ""}`}>
      {filed ? "In cartella clinica" : "Non in cartella"}
    </span>
  );
}
