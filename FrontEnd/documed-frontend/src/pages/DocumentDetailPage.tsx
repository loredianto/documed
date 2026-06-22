import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteDocument, downloadDocument, getDocument, getDocumentContent, getDocumentOcr, processDocumentOcr } from "../api/documents";
import { getAdmission, getPatient } from "../api/patients";
import { documentTypeLabel } from "../components/DocumentList";
import { ErrorMessage, Loading } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { DocumentViewer } from "../components/DocumentViewer";
import { Admission, DocumentOcrResult, Patient, PatientDocument } from "../types";
import { formatDate, formatFileSize, readableError } from "../utils/format";

export function DocumentDetailPage() {
  const id = useParams().id ?? "";
  const navigate = useNavigate();
  const [document, setDocument] = useState<PatientDocument | null>(null);
  const [ocr, setOcr] = useState<DocumentOcrResult | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");

  const load = useCallback(async () => {
    try {
      const documentResult = await getDocument(id);
      setDocument(documentResult);
      const [ocrResult, patientResult, admissionResult] = await Promise.all([
        getDocumentOcr(id), getPatient(documentResult.patientId), getAdmission(documentResult.admissionId),
      ]);
      setOcr(ocrResult); setPatient(patientResult); setAdmission(admissionResult);
    } catch (requestError) { setError(readableError(requestError)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setPreviewUrl("");
    setPreviewLoading(true);
    setPreviewError("");

    getDocumentContent(id)
      .then((content) => {
        objectUrl = URL.createObjectURL(content);
        if (active) setPreviewUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((requestError) => {
        if (active) setPreviewError(readableError(requestError));
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  async function runOcr() {
    setProcessing(true); setError("");
    try { setOcr(await processDocumentOcr(id)); setDocument(await getDocument(id)); }
    catch (requestError) { setError(readableError(requestError)); await load(); }
    finally { setProcessing(false); }
  }

  async function remove() {
    if (!document || !window.confirm(`Eliminare definitivamente ${document.originalFilename}?`)) return;
    try { await deleteDocument(id); navigate("/documents"); }
    catch (requestError) { setError(readableError(requestError)); }
  }

  if (loading) return <Loading label="Caricamento documento…" />;
  if (!document) return <ErrorMessage message={error || "Documento non trovato"} />;

  return (
    <section>
      <header className="page-header with-action">
        <div><span className="eyebrow">Documento · {documentTypeLabel(document.documentType)}</span><h1 className="filename-title">{document.originalFilename}</h1><p>{patient && <Link className="text-link" to={`/patients/${patient.id}`}>{patient.firstName} {patient.lastName}</Link>} · {admission && <Link className="text-link" to={`/admissions/${admission.id}`}>Ricovero #{admission.id}</Link>}</p></div>
        <div className="button-row"><button className="button" onClick={() => void downloadDocument(document).catch((requestError) => setError(readableError(requestError)))}>↓ Scarica</button><button className="button danger" onClick={() => void remove()}>Elimina</button></div>
      </header>
      {error && <ErrorMessage message={error} />}
      <div className="detail-grid four">
        <div className="panel detail-card"><span>Stato OCR</span><StatusBadge status={ocr?.ocrStatus ?? document.ocrStatus} /></div>
        <div className="panel detail-card"><span>Dimensione</span><strong>{formatFileSize(document.fileSize)}</strong></div>
        <div className="panel detail-card"><span>Formato</span><strong>{document.contentType}</strong></div>
        <div className="panel detail-card"><span>Caricato</span><strong>{formatDate(document.uploadedAt)}</strong></div>
      </div>
      <div className="comparison-heading section-gap">
        <div><span className="eyebrow">Verifica documentale</span><h2>Originale e testo OCR</h2><p>Confronta visivamente il documento archiviato con il testo riconosciuto da Tesseract.</p></div>
      </div>
      <div className="document-comparison">
        <article className="comparison-pane panel original-pane">
          <header><div><span className="pane-index">01</span><h3>Documento originale</h3></div></header>
          <DocumentViewer document={document} previewUrl={previewUrl} loading={previewLoading} error={previewError} />
        </article>
        <article className="comparison-pane panel ocr-panel">
          <header><div><span className="pane-index">02</span><h3>Testo estratto</h3></div><button className="button primary" disabled={processing || ocr?.ocrStatus === "PROCESSING"} onClick={() => void runOcr()}>{processing ? "Elaborazione…" : ocr?.ocrStatus === "COMPLETED" ? "Ripeti OCR" : "Avvia OCR"}</button></header>
          {ocr?.ocrStatus === "FAILED" && <ErrorMessage message={ocr.ocrErrorMessage ?? "Elaborazione OCR fallita"} />}
          <pre className="ocr-text">{ocr?.extractedText || "Nessun testo estratto. Avvia l'OCR su un'immagine PNG o JPEG."}</pre>
          {ocr?.processedAt && <small>Ultima elaborazione: {formatDate(ocr.processedAt)}</small>}
        </article>
      </div>
    </section>
  );
}
