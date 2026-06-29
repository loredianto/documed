import { useEffect, useState } from "react";
import { CheckCircle2, FileText, FolderPlus } from "lucide-react";
import { canPreviewDocument, createDocumentPreviewUrl, isPreviewImage, isPreviewPdf, saveDocumentToRecord } from "../api/documents";
import { PatientDocument } from "../types";
import { readableError } from "../utils/format";
import { FieldDef } from "../utils/ocrSchema";

/** Anteprima del documento: scarica il binario via API e mostra immagini/PDF. */
export function DocPreview({ document }: { document: PatientDocument }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewable = canPreviewDocument(document);
  const image = isPreviewImage(document);
  const pdf = isPreviewPdf(document);

  useEffect(() => {
    let revokedOrPendingUrl: string | null = null;
    let cancelled = false;

    setUrl(null);
    setError(null);
    if (!previewable) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    createDocumentPreviewUrl(document)
      .then((objectUrl) => {
        if (cancelled) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return;
        }
        revokedOrPendingUrl = objectUrl;
        setUrl(objectUrl);
      })
      .catch((e) => {
        if (!cancelled) setError(readableError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (revokedOrPendingUrl) URL.revokeObjectURL(revokedOrPendingUrl);
    };
  }, [document, previewable]);

  return (
    <div className="dm-doc-preview">
      {url ? (
        image ? (
          <img src={url} alt={`Anteprima di ${document.originalFilename}`} />
        ) : pdf ? (
          <iframe src={url} title={`Anteprima di ${document.originalFilename}`} />
        ) : null
      ) : (
        <div className="dm-doc-preview-placeholder">
          <FileText size={48} aria-hidden="true" />
          <span>{document.originalFilename}</span>
          <small>
            {loading
              ? "Caricamento anteprima…"
              : error ?? (previewable
                ? "Anteprima non disponibile"
                : "Anteprima disponibile per immagini PNG, JPEG o PDF")}
          </small>
        </div>
      )}
    </div>
  );
}

/** "DD/MM/YYYY" ↔ "YYYY-MM-DD" per il controllo <input type="date">. */
const itToIso = (s: string) => (/^\d{2}\/\d{2}\/\d{4}$/.test(s) ? s.split("/").reverse().join("-") : "");
const isoToIt = (s: string) => (s ? s.split("-").reverse().join("/") : "");

/**
 * Campi della versione digitale, guidati dallo schema della tipologia.
 * Le date dedotte dalla lettura del documento (valore presente) sono correggibili con un date
 * picker; quelle marcate `editable` (es. data firma) lo sono sempre. Le date non rilevate
 * restano in sola lettura ("—").
 */
export function FieldsEditor({
  defs,
  values,
  onChange,
  readOnly,
}: {
  defs: FieldDef[];
  values: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <dl className="dm-ocr-fields dm-fields-editor">
      {defs.map((def) => {
        const value = values[def.key] ?? "";
        // Una data è correggibile se sempre editabile (es. data firma) o se dedotta dall'OCR (ha un valore).
        const editableDate = def.kind === "date" && !readOnly && (def.editable || value !== "");
        const locked = readOnly || (def.kind === "date" && !editableDate);
        return (
          <div key={def.key}>
            <dt>{def.label}</dt>
            {editableDate ? (
              <input
                type="date"
                className="form-control form-control-sm"
                value={itToIso(value)}
                aria-label={def.label}
                onChange={(e) => onChange?.(def.key, isoToIt(e.target.value))}
              />
            ) : locked ? (
              <dd className={def.kind === "date" && !readOnly ? "dm-field-locked" : undefined}>
                {value || "—"}
              </dd>
            ) : (
              <input
                className="form-control form-control-sm"
                value={value}
                aria-label={def.label}
                onChange={(e) => onChange?.(def.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </dl>
  );
}

/** Azione finale: aggiungi il documento alla cartella clinica. */
export function FileActions({
  docId,
  compact = false,
  filed = false,
  onFiled,
}: {
  docId: string;
  /** Layout inline e compatto, pensato per il footer della modale. */
  compact?: boolean;
  /** Stato persistente: documento già archiviato nella cartella clinica. */
  filed?: boolean;
  /** Notifica il parent, così liste e KPI locali riflettono subito l'archiviazione. */
  onFiled?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(filed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(filed);
  }, [filed]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveDocumentToRecord(docId);
      setSaved(true);
      onFiled?.();
    } catch (e) {
      setError(readableError(e));
    } finally {
      setSaving(false);
    }
  }

  if (compact) {
    return (
      <div className="dm-footer-actions">
        {error && <span className="dm-footer-error" role="alert">{error}</span>}
        {saved ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> In cartella clinica</span>
        ) : (
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            disabled={saving}
            onClick={() => void save()}
          >
            <FolderPlus size={16} aria-hidden="true" /> {saving ? "Aggiunta…" : "Cartella Clinica"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dm-modal-action-grid">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="dm-action-card">
        <FolderPlus size={20} aria-hidden="true" />
        <div>
          <strong>Aggiungi a cartella clinica</strong>
          <small>Archivia la versione digitale nel fascicolo del paziente.</small>
        </div>
        {saved ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> Aggiunto</span>
        ) : (
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Aggiunta…" : "Aggiungi"}
          </button>
        )}
      </div>
    </div>
  );
}
