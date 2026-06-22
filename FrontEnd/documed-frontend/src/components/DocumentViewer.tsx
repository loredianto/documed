import { PatientDocument } from "../types";
import { Loading } from "./Feedback";

interface DocumentViewerProps {
  document: PatientDocument;
  previewUrl: string;
  loading: boolean;
  error: string;
}

/**
 * Uses browser-native image and PDF rendering so the stored original can be
 * compared with OCR output without introducing a second PDF dependency.
 */
export function DocumentViewer({ document, previewUrl, loading, error }: DocumentViewerProps) {
  const isImage = document.contentType === "image/png" || document.contentType === "image/jpeg";
  const isPdf = document.contentType === "application/pdf";

  return (
    <div className="document-viewer">
      <div className="viewer-toolbar">
        <span>{isPdf ? "PDF originale" : isImage ? "Immagine originale" : "File originale"}</span>
        {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer">Apri a piena pagina ↗</a>}
      </div>
      <div className={`viewer-canvas${isPdf ? " viewer-pdf" : ""}`}>
        {loading && <Loading label="Caricamento anteprima…" />}
        {!loading && error && <div className="viewer-message" role="alert">{error}</div>}
        {!loading && !error && previewUrl && isImage && (
          <img src={previewUrl} alt={`Anteprima di ${document.originalFilename}`} />
        )}
        {!loading && !error && previewUrl && isPdf && (
          <object
            data={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`}
            type="application/pdf"
            aria-label={`Anteprima PDF di ${document.originalFilename}`}
          >
            <p>Il browser non supporta l'anteprima PDF. <a href={previewUrl}>Apri il documento</a>.</p>
          </object>
        )}
        {!loading && !error && previewUrl && !isImage && !isPdf && (
          <div className="viewer-message">Anteprima non disponibile per il formato {document.contentType}.</div>
        )}
      </div>
    </div>
  );
}
