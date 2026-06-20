import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  deleteDocument,
  DocumentSearchFilters,
  downloadDocument,
  listDocuments,
  processDocumentOcr,
  searchDocuments,
  uploadDocument,
} from "../api/documents";
import { listPatients } from "../api/patients";
import { DocumentList } from "../components/DocumentList";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { DocumentType, OcrStatus, PatientDocument } from "../types";
import { readableError } from "../utils/format";

const DOCUMENT_TYPES: DocumentType[] = ["IDENTITY_DOCUMENT", "ADMISSION_FORM", "CONSENT_FORM", "MEDICAL_REPORT", "DISCHARGE_DOCUMENT", "OTHER"];
const OCR_STATUSES: OcrStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

export function DocumentsPage() {
  const [urlParams] = useSearchParams();
  const initialAdmissionId = Number(urlParams.get("admissionId")) || undefined;
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});
  const [filterDraft, setFilterDraft] = useState<DocumentSearchFilters>({ admissionId: initialAdmissionId });
  const [filters, setFilters] = useState<DocumentSearchFilters>({ admissionId: initialAdmissionId });
  const [uploadOpen, setUploadOpen] = useState(Boolean(initialAdmissionId));
  const [admissionId, setAdmissionId] = useState(initialAdmissionId ? String(initialAdmissionId) : "");
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("ADMISSION_FORM");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasFilters = useMemo(() => Object.values(filters).some((value) => value !== undefined && value !== ""), [filters]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [documentResult, patients] = await Promise.all([
        hasFilters ? searchDocuments(filters) : listDocuments(),
        listPatients(),
      ]);
      setDocuments(documentResult);
      setPatientNames(Object.fromEntries(patients.map((patient) => [patient.id, `${patient.lastName} ${patient.firstName}`])));
    } catch (requestError) { setError(readableError(requestError)); }
    finally { setLoading(false); }
  }, [filters, hasFilters]);

  useEffect(() => { void load(); }, [load]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setFilters({ ...filterDraft });
  }

  async function submitUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusyId("upload"); setError(""); setNotice("");
    try {
      await uploadDocument(Number(admissionId), file, documentType, description);
      setFile(null); setDescription(""); setNotice("Documento caricato e pronto per l'OCR.");
      const input = window.document.querySelector<HTMLInputElement>("#document-file");
      if (input) input.value = "";
      await load();
    } catch (requestError) { setError(readableError(requestError)); }
    finally { setBusyId(""); }
  }

  async function runOcr(document: PatientDocument) {
    setBusyId(document.id); setError(""); setNotice("");
    try { await processDocumentOcr(document.id); setNotice(`OCR completato per ${document.originalFilename}.`); await load(); }
    catch (requestError) { setError(readableError(requestError)); await load(); }
    finally { setBusyId(""); }
  }

  async function remove(document: PatientDocument) {
    if (!window.confirm(`Eliminare definitivamente ${document.originalFilename}?`)) return;
    setBusyId(document.id); setError("");
    try { await deleteDocument(document.id); await load(); }
    catch (requestError) { setError(readableError(requestError)); }
    finally { setBusyId(""); }
  }

  return (
    <section>
      <header className="page-header with-action"><div><span className="eyebrow">GridFS + OCR</span><h1>Documenti</h1></div><button className="button primary" onClick={() => setUploadOpen((value) => !value)}>+ Carica documento</button></header>
      {uploadOpen && <form className="panel upload-grid" onSubmit={submitUpload}>
        <div className="full-column"><h2>Nuovo documento</h2><p>PNG, JPEG o PDF, massimo 10 MB. L’OCR accetta PNG e JPEG.</p></div>
        <label>Ricovero ID<input required min="1" type="number" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} /></label>
        <label>Tipologia<select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)}>{DOCUMENT_TYPES.map((type) => <option value={type} key={type}>{type.replace(/_/g, " ")}</option>)}</select></label>
        <label className="full-column file-field">File<input id="document-file" required type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
        <label className="full-column">Descrizione<textarea rows={2} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <div className="form-actions full-column"><button type="button" className="button" onClick={() => setUploadOpen(false)}>Chiudi</button><button className="button primary" disabled={busyId === "upload"}>{busyId === "upload" ? "Caricamento…" : "Carica in archivio"}</button></div>
      </form>}

      <form className="panel filters section-gap" onSubmit={submitSearch}>
        <label className="wide">Cerca nel testo OCR<input type="search" placeholder="Parola o frase" value={filterDraft.query ?? ""} onChange={(e) => setFilterDraft((current) => ({ ...current, query: e.target.value }))} /></label>
        <label>Ricovero<input min="1" type="number" value={filterDraft.admissionId ?? ""} onChange={(e) => setFilterDraft((current) => ({ ...current, admissionId: Number(e.target.value) || undefined }))} /></label>
        <label>Tipologia<select value={filterDraft.documentType ?? ""} onChange={(e) => setFilterDraft((current) => ({ ...current, documentType: e.target.value as DocumentType | "" }))}><option value="">Tutte</option>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Stato OCR<select value={filterDraft.ocrStatus ?? ""} onChange={(e) => setFilterDraft((current) => ({ ...current, ocrStatus: e.target.value as OcrStatus | "" }))}><option value="">Tutti</option>{OCR_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
        <button className="button primary">Cerca</button>
      </form>
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {error && <ErrorMessage message={error} />}
      {loading ? <Loading label="Caricamento documenti…" /> : documents.length === 0 ? <EmptyState>Nessun documento trovato.</EmptyState> : (
        <DocumentList documents={documents} patientNames={patientNames} busyId={busyId} onDownload={(document) => void downloadDocument(document).catch((requestError) => setError(readableError(requestError)))} onOcr={(document) => void runOcr(document)} onDelete={(document) => void remove(document)} />
      )}
    </section>
  );
}
