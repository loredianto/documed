import { FormEvent, useState } from "react";
import { FilePlus } from "lucide-react";
import { DocumentType, PatientDocument } from "../types";
import { uploadDocument } from "../api/documents";
import { documentTypeLabel } from "./DocumentList";
import { readableError } from "../utils/format";

const DOCUMENT_TYPES: DocumentType[] = [
  "IDENTITY_DOCUMENT", "ADMISSION_FORM", "CONSENT_FORM",
  "MEDICAL_REPORT", "DISCHARGE_DOCUMENT", "OTHER",
];

interface Props {
  /** Ricovero a cui allegare il documento (già fissato dalla riga). */
  admissionId: number;
  onAdded: (doc: PatientDocument) => void;
  onClose: () => void;
}

/**
 * Aggiunta di un documento a un singolo ricovero (il ricovero è già fissato dalla
 * riga, quindi non c'è selettore): si sceglie la tipologia, una descrizione
 * facoltativa e il file, poi si carica. La scansione OCR avviene dopo, dalla riga.
 */
export function AddDocumentModal({ admissionId, onAdded, onClose }: Props) {
  const [documentType, setDocumentType] = useState<DocumentType>("ADMISSION_FORM");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setError("Seleziona un file da caricare."); return; }
    setBusy(true); setError("");
    try {
      const doc = await uploadDocument(admissionId, file, documentType, description);
      onAdded(doc);
      onClose();
    } catch (err) {
      setError(readableError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="dm-add-fields">
        <label className="dm-add-field">
          <span>Tipologia documento</span>
          <select
            className="form-select"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{documentTypeLabel(t)}</option>
            ))}
          </select>
        </label>
        <label className="dm-add-field">
          <span>Descrizione <small>(facoltativa)</small></span>
          <input
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Referto post-operatorio"
          />
        </label>
      </div>

      <label className="dm-add-field mb-4">
        <span>File</span>
        <input
          type="file"
          className="form-control"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Annulla
        </button>
        <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy}>
          <FilePlus size={16} aria-hidden="true" /> {busy ? "Caricamento…" : "Carica documento"}
        </button>
      </div>
    </form>
  );
}
