import { Link } from "react-router-dom";
import { PatientDocument } from "../types";
import { formatDate, formatFileSize } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface Props {
  documents: PatientDocument[];
  patientNames?: Record<number, string>;
  onDownload: (document: PatientDocument) => void;
  onOcr: (document: PatientDocument) => void;
  onDelete: (document: PatientDocument) => void;
  busyId?: string;
}

export function DocumentList({ documents, patientNames = {}, onDownload, onOcr, onDelete, busyId }: Props) {
  return (
    <div className="table-wrap panel">
      <table>
        <thead><tr><th>Documento</th><th>Paziente / Ricovero</th><th>Tipologia</th><th>Caricato</th><th>OCR</th><th>Azioni</th></tr></thead>
        <tbody>{documents.map((document) => (
          <tr key={document.id}>
            <td><Link className="text-link" to={`/documents/${document.id}`}>{document.originalFilename}</Link><small>{formatFileSize(document.fileSize)}</small></td>
            <td><strong>{patientNames[document.patientId] ?? `Paziente #${document.patientId}`}</strong><small>Ricovero #{document.admissionId}</small></td>
            <td>{documentTypeLabel(document.documentType)}</td>
            <td>{formatDate(document.uploadedAt)}</td>
            <td><StatusBadge status={document.ocrStatus} /></td>
            <td><div className="row-actions">
              <button title="Scarica" onClick={() => onDownload(document)}>↓</button>
              <button title={document.ocrStatus === "COMPLETED" ? "Ripeti OCR" : "Avvia OCR"} disabled={busyId === document.id || document.ocrStatus === "PROCESSING"} onClick={() => onOcr(document)}>OCR</button>
              <button className="danger-action" title="Elimina" disabled={busyId === document.id} onClick={() => onDelete(document)}>×</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function documentTypeLabel(type: PatientDocument["documentType"]): string {
  return ({
    IDENTITY_DOCUMENT: "Documento identità",
    ADMISSION_FORM: "Modulo ricovero",
    CONSENT_FORM: "Consenso",
    MEDICAL_REPORT: "Referto",
    DISCHARGE_DOCUMENT: "Dimissione",
    OTHER: "Altro",
  })[type];
}
