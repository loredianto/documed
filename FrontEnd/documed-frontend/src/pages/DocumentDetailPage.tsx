import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteDocument, downloadDocument, getDocument, getDocumentOcr, processDocumentOcr } from "../api/documents";
import { getAdmission, getPatient } from "../api/patients";
import { Download } from "lucide-react";
import { documentTypeLabel } from "../components/DocumentList";
import { DocPreview } from "../components/documentModalParts";
import { ErrorMessage, Loading } from "../components/Feedback";
import { RecordFlag, StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FadeIn, Fade } from "@/lib/motion";
import { Admission, DocumentOcrResult, Patient, PatientDocument } from "../types";
import { formatDate, formatFileSize, readableError } from "../utils/format";

export function DocumentDetailPage() {
  const id = useParams().id ?? "";
  const navigate = useNavigate();
  const [document, setDocument]   = useState<PatientDocument | null>(null);
  const [ocr, setOcr]             = useState<DocumentOcrResult | null>(null);
  const [patient, setPatient]     = useState<Patient | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    try {
      const documentResult = await getDocument(id);
      setDocument(documentResult);
      const [ocrResult, patientResult, admissionResult] = await Promise.all([
        getDocumentOcr(id),
        getPatient(documentResult.patientId),
        getAdmission(documentResult.admissionId),
      ]);
      setOcr(ocrResult); setPatient(patientResult); setAdmission(admissionResult);
    } catch (e) { setError(readableError(e)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function runOcr() {
    setProcessing(true); setError("");
    try {
      setOcr(await processDocumentOcr(id));
      setDocument(await getDocument(id));
    } catch (e) { setError(readableError(e)); await load(); }
    finally { setProcessing(false); }
  }

  async function remove() {
    if (!document || !window.confirm(`Eliminare definitivamente ${document.originalFilename}?`)) return;
    try { await deleteDocument(id); navigate("/documents"); }
    catch (e) { setError(readableError(e)); }
  }

  if (loading) return <Loading label="Caricamento documento…" />;
  if (!document) return <ErrorMessage message={error || "Documento non trovato"} />;

  const detailCards = [
    { label: "Stato OCR",   value: <StatusBadge status={ocr?.ocrStatus ?? document.ocrStatus} /> },
    { label: "Cartella clinica", value: <RecordFlag filed={document.filedInRecord} /> },
    { label: "Dimensione",  value: <strong>{formatFileSize(document.fileSize)}</strong> },
    { label: "Formato",     value: <strong>{document.contentType}</strong> },
    { label: "Caricato",    value: <strong>{formatDate(document.uploadedAt)}</strong> },
  ];

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">
            Documento · {(ocr?.ocrStatus ?? document.ocrStatus) === "COMPLETED"
              ? documentTypeLabel(document.documentType)
              : "tipologia da assegnare"}
          </span>
          <h1 className="filename-title">{document.originalFilename}</h1>
          <p>
            {patient && (
              <Link className="text-link" to={`/patients/${patient.id}`}>
                {patient.firstName} {patient.lastName}
              </Link>
            )}
            {" · "}
            {admission && (
              <Link className="text-link" to={`/admissions/${admission.id}`}>
                Ricovero #{admission.id}
              </Link>
            )}
          </p>
        </div>
        <div className="button-row">
          <Button
            variant="outline"
            className="d-inline-flex align-items-center gap-2"
            onClick={() => void downloadDocument(document).catch((e) => setError(readableError(e)))}
          >
            <Download size={16} aria-hidden="true" /> Scarica
          </Button>
          <Button variant="destructive" onClick={() => void remove()}>
            Elimina
          </Button>
        </div>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="detail-grid four">
        {detailCards.map(({ label, value }, i) => (
          <FadeIn key={label} i={i}>
            <div className="panel detail-card">
              <span>{label}</span>
              {value}
            </div>
          </FadeIn>
        ))}
      </div>

      <Fade>
        <div className="panel section-gap">
          <header>
            <div>
              <span className="eyebrow">Documento originale</span>
              <h2>Anteprima</h2>
            </div>
          </header>
          <DocPreview document={document} />
        </div>
      </Fade>

      <Fade>
        <div className="ocr-panel panel section-gap">
          <header>
            <div>
              <span className="eyebrow">Riconoscimento testo</span>
              <h2>Testo estratto</h2>
            </div>
            <Button
              disabled={processing || ocr?.ocrStatus === "PROCESSING"}
              onClick={() => void runOcr()}
            >
              {processing ? "Elaborazione…" : ocr?.ocrStatus === "COMPLETED" ? "Ripeti OCR" : "Avvia OCR"}
            </Button>
          </header>
          {ocr?.ocrStatus === "FAILED" && (
            <ErrorMessage message={ocr.ocrErrorMessage ?? "Elaborazione OCR fallita"} />
          )}
          <pre className="ocr-text">
            {ocr?.extractedText || "Nessun testo estratto. Avvia l'OCR su un'immagine PNG o JPEG."}
          </pre>
          {ocr?.processedAt && (
            <small>Ultima elaborazione: {formatDate(ocr.processedAt)}</small>
          )}
        </div>
      </Fade>
    </section>
  );
}
