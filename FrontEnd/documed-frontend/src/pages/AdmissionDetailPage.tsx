import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dischargeAdmission, getAdmission, getPatient } from "../api/patients";
import { ErrorMessage, Loading } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { Admission, Patient } from "../types";
import { formatDate, readableError, todayIso } from "../utils/format";
import { getAdmissionDocuments } from "../api/documents";
import { PatientDocument } from "../types";

export function AdmissionDetailPage() {
  const id = Number(useParams().id);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [dischargeDate, setDischargeDate] = useState(todayIso());
  const [showDischarge, setShowDischarge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const admissionResult = await getAdmission(id);
      setAdmission(admissionResult);
      const [patientResult, documentResult] = await Promise.all([getPatient(admissionResult.patientId), getAdmissionDocuments(id)]);
      setPatient(patientResult);
      setDocuments(documentResult);
    } catch (requestError) { setError(readableError(requestError)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function discharge(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setAdmission(await dischargeAdmission(id, dischargeDate));
      setShowDischarge(false);
    } catch (requestError) { setError(readableError(requestError)); }
  }

  if (loading) return <Loading label="Caricamento ricovero…" />;
  if (!admission || !patient) return <ErrorMessage message={error || "Ricovero non trovato"} />;

  return (
    <section>
      <header className="page-header with-action">
        <div><span className="eyebrow">Ricovero #{admission.id}</span><h1>{admission.department}</h1><p><Link className="text-link" to={`/patients/${patient.id}`}>{patient.firstName} {patient.lastName}</Link></p></div>
        {admission.status === "ACTIVE" && <button className="button primary" onClick={() => setShowDischarge(true)}>Dimetti paziente</button>}
      </header>
      {error && <ErrorMessage message={error} />}
      <div className="detail-grid four">
        <div className="panel detail-card"><span>Stato</span><StatusBadge status={admission.status} /></div>
        <div className="panel detail-card"><span>Ingresso</span><strong>{formatDate(admission.admissionDate)}</strong></div>
        <div className="panel detail-card"><span>Dimissione</span><strong>{formatDate(admission.dischargeDate)}</strong></div>
        <div className="panel detail-card"><span>Note</span><strong>{admission.notes ?? "—"}</strong></div>
      </div>
      {showDischarge && <form className="panel inline-form section-gap" onSubmit={discharge}><label>Data di dimissione<input required type="date" min={admission.admissionDate} max={todayIso()} value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} /></label><button className="button primary">Conferma dimissione</button><button type="button" className="button" onClick={() => setShowDischarge(false)}>Annulla</button></form>}
      <div className="section-heading"><div><span className="eyebrow">Archivio</span><h2>Documenti del ricovero</h2></div><Link className="button" to={`/documents?admissionId=${admission.id}`}>Gestisci documenti →</Link></div>
      {documents.length === 0 ? <div className="empty-state">Nessun documento caricato.</div> : <div className="mini-list">{documents.map((document) => <Link key={document.id} to={`/documents/${document.id}`}><strong>{document.originalFilename}</strong><span>{document.documentType.replace(/_/g, " ")}</span><StatusBadge status={document.ocrStatus} /></Link>)}</div>}
    </section>
  );
}
