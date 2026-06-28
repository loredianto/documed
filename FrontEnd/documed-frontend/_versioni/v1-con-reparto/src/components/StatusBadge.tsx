import { AdmissionStatus, OcrStatus } from "../types";

export const STATUS_LABELS: Record<AdmissionStatus | OcrStatus, string> = {
  ACTIVE:      "Attivo",
  DISCHARGED:  "Dimesso",
  PENDING:     "In attesa",
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
