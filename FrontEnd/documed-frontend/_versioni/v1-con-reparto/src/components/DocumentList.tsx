import { Link } from "react-router-dom";
import { Download, ScanLine, Trash2 } from "lucide-react";
import { PatientDocument } from "../types";
import { formatDate, formatFileSize } from "../utils/format";
import { StatusBadge } from "./StatusBadge";
import { motion } from "@/lib/motion";

interface Props {
  documents: PatientDocument[];
  patientNames?: Record<number, string>;
  onDownload: (document: PatientDocument) => void;
  onOcr:      (document: PatientDocument) => void;
  onDelete:   (document: PatientDocument) => void;
  busyId?: string;
}

const rowVariants = {
  hidden:  { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.03, duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

export function DocumentList({ documents, patientNames = {}, onDownload, onOcr, onDelete, busyId }: Props) {
  return (
    <div className="table-wrap panel">
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Paziente / Ricovero</th>
            <th>Tipologia</th>
            <th>Caricato</th>
            <th>OCR</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document, i) => (
            <motion.tr
              key={document.id}
              custom={i}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
            >
              <td>
                <Link className="text-link" to={`/documents/${document.id}`}>
                  {document.originalFilename}
                </Link>
                <small>{formatFileSize(document.fileSize)}</small>
              </td>
              <td>
                <strong>{patientNames[document.patientId] ?? `Paziente #${document.patientId}`}</strong>
                <small>Ricovero #{document.admissionId}</small>
              </td>
              <td>{documentTypeLabel(document.documentType)}</td>
              <td>{formatDate(document.uploadedAt)}</td>
              <td><StatusBadge status={document.ocrStatus} /></td>
              <td>
                <div className="row-actions">
                  <button title="Scarica" aria-label="Scarica" onClick={() => onDownload(document)}>
                    <Download size={16} aria-hidden="true" />
                  </button>
                  <button
                    title={document.ocrStatus === "COMPLETED" ? "Ripeti OCR" : "Avvia OCR"}
                    aria-label={document.ocrStatus === "COMPLETED" ? "Ripeti OCR" : "Avvia OCR"}
                    disabled={busyId === document.id || document.ocrStatus === "PROCESSING"}
                    onClick={() => onOcr(document)}
                  >
                    <ScanLine size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="danger-action"
                    title="Elimina"
                    aria-label="Elimina"
                    disabled={busyId === document.id}
                    onClick={() => onDelete(document)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function documentTypeLabel(type: PatientDocument["documentType"]): string {
  return ({
    IDENTITY_DOCUMENT:  "Documento identità",
    ADMISSION_FORM:     "Modulo ricovero",
    CONSENT_FORM:       "Consenso",
    MEDICAL_REPORT:     "Referto",
    DISCHARGE_DOCUMENT: "Dimissione",
    OTHER:              "Altro",
  })[type];
}
