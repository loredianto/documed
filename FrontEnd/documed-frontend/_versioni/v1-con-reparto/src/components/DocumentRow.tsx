import { useEffect, useRef, useState } from "react";
import { Eye, ScanLine, Trash2 } from "lucide-react";
import { OcrExtraction, PatientDocument } from "../types";
import { documentTypeLabel } from "./DocumentList";
import { StatusBadge } from "./StatusBadge";
import { ConfirmPopover } from "./ConfirmPopover";
import { processDocumentOcr } from "../api/documents";
import { formatFileSize, readableError } from "../utils/format";

interface Props {
  document: PatientDocument;
  onView: () => void;
  /** Chiamato a scansione completata con i dati riconosciuti. */
  onScanned: (extraction: OcrExtraction) => void;
  /** Elimina il documento dal ricovero. */
  onDelete: () => void;
}

/**
 * Record documento nell'accordion: meta + stato + azioni come icon button discreti.
 * La scansione OCR viene eseguita dal bottone stesso, con progress interno (fill
 * che riempie l'icona); al termine il parent riceve l'estrazione e apre la modale.
 */
export function DocumentRow({ document: doc, onView, onScanned, onDelete }: Props) {
  const processed = doc.ocrStatus === "COMPLETED";
  // Un documento appena caricato e non ancora scansionato resta senza tipologia
  // reale (default "OTHER"): la sua categoria la assegnerà l'OCR.
  const unclassified = !processed && doc.documentType === "OTHER";
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  async function startScan() {
    setError(null);
    setScanning(true);
    setProgress(8);
    timer.current = window.setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((90 - p) / 6)) : p));
    }, 120);
    try {
      const res = await processDocumentOcr(doc.id);
      if (timer.current) window.clearInterval(timer.current);
      setProgress(100);
      if (res.ocrExtraction) {
        const extraction = res.ocrExtraction;
        window.setTimeout(() => {
          onScanned(extraction);
          setScanning(false);
          setProgress(0);
        }, 280);
      } else {
        setError(res.ocrErrorMessage ?? "Riconoscimento non riuscito.");
        setScanning(false);
        setProgress(0);
      }
    } catch (e) {
      if (timer.current) window.clearInterval(timer.current);
      setError(readableError(e));
      setScanning(false);
      setProgress(0);
    }
  }

  return (
    <div className="dm-doc-row">
      <div className="dm-doc-row-main">
        <span className="dm-doc-row-name">
          {processed ? documentTypeLabel(doc.documentType) : doc.originalFilename}
        </span>
        <span className="dm-doc-row-meta">
          {processed
            ? doc.originalFilename
            : unclassified
              ? <em className="dm-doc-untyped">Tipologia da assegnare</em>
              : documentTypeLabel(doc.documentType)}{" "}
          · {formatFileSize(doc.fileSize)}
        </span>
        {error && (
          <span className="dm-doc-scan-error" role="alert">
            {error}
          </span>
        )}
      </div>
      <StatusBadge status={doc.ocrStatus} />
      <div className="dm-doc-row-actions dm-row-actions">
        {processed ? (
          <button
            type="button"
            className="dm-icon-btn dm-tip-row"
            data-tooltip="Apri la versione digitale"
            aria-label="Visualizza versione digitale"
            onClick={onView}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className={`dm-icon-btn dm-scan-icon-btn dm-tip-row${scanning ? " is-scanning" : ""}`}
            data-tooltip={scanning ? `Riconoscimento… ${progress}%` : "Avvia il riconoscimento OCR"}
            aria-label="Scansione OCR"
            onClick={() => void startScan()}
            disabled={scanning}
            aria-busy={scanning}
          >
            {scanning && (
              <span className="dm-scan-btn-fill" style={{ height: `${progress}%` }} aria-hidden="true" />
            )}
            <ScanLine size={16} aria-hidden="true" className="dm-scan-icon" />
          </button>
        )}
        <ConfirmPopover
          icon={<Trash2 size={16} aria-hidden="true" />}
          label="Elimina documento"
          title="Eliminare il documento?"
          message="Il documento verrà rimosso dal ricovero. L'operazione non è reversibile."
          confirmLabel="Elimina"
          destructive
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}
