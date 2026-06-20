import { AdmissionStatus, OcrStatus } from "../types";

const LABELS: Record<AdmissionStatus | OcrStatus, string> = {
  ACTIVE: "Attivo",
  DISCHARGED: "Dimesso",
  PENDING: "In attesa",
  PROCESSING: "In elaborazione",
  COMPLETED: "Completato",
  FAILED: "Fallito",
};

export function StatusBadge({ status }: { status: AdmissionStatus | OcrStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{LABELS[status]}</span>;
}
