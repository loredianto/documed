import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { dischargeAdmission, getAdmission, getPatient } from "../api/patients";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { documentTypeLabel } from "../components/DocumentList";
import { Button } from "@/components/ui/button";
import { FadeIn, Fade } from "@/lib/motion";
import { Admission, Patient } from "../types";
import { formatDate, readableError, todayIso } from "../utils/format";
import { getAdmissionDocuments } from "../api/documents";
import { PatientDocument } from "../types";
import { parseAdmissionMeta } from "../utils/records";

export function AdmissionDetailPage() {
  const id = Number(useParams().id);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [patient, setPatient]     = useState<Patient | null>(null);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [dischargeDate, setDischargeDate] = useState(todayIso());
  const [showDischarge, setShowDischarge] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    try {
      const admissionResult = await getAdmission(id);
      setAdmission(admissionResult);
      const [patientResult, documentResult] = await Promise.all([
        getPatient(admissionResult.patientId),
        getAdmissionDocuments(id),
      ]);
      setPatient(patientResult);
      setDocuments(documentResult);
    } catch (e) { setError(readableError(e)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function discharge(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setAdmission(await dischargeAdmission(id, dischargeDate));
      setShowDischarge(false);
    } catch (e) { setError(readableError(e)); }
  }

  if (loading) return <Loading label="Caricamento ricovero…" />;
  if (!admission || !patient) return <ErrorMessage message={error || "Ricovero non trovato"} />;

  const { nosologico } = parseAdmissionMeta(admission.notes);
  // La cartella clinica mostra solo i documenti archiviati; quelli in lavorazione restano in Ricoveri.
  const filedDocuments = documents.filter((d) => d.filedInRecord);
  const detailCards = [
    { label: "Stato",      value: <StatusBadge status={admission.status} /> },
    { label: "Ingresso",   value: <strong>{formatDate(admission.admissionDate)}</strong> },
    { label: "Dimissione", value: <strong>{formatDate(admission.dischargeDate)}</strong> },
    { label: "Note",       value: <strong>{admission.notes ?? "—"}</strong> },
  ];

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">
            Cartella clinica{nosologico ? ` n. ${nosologico}` : ""} · Ricovero #{admission.id}
          </span>
          <h1>{admission.department}</h1>
          <p>
            <Link className="text-link" to={`/patients/${patient.id}`}>
              {patient.firstName} {patient.lastName}
            </Link>
          </p>
        </div>
        {admission.status === "ACTIVE" && (
          <Button onClick={() => setShowDischarge(true)}>Dimetti paziente</Button>
        )}
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

      {showDischarge && (
        <Fade>
          <form className="panel inline-form section-gap" onSubmit={discharge}>
            <label>
              Data di dimissione
              <input
                required type="date"
                min={admission.admissionDate} max={todayIso()}
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
              />
            </label>
            <Button type="submit">Conferma dimissione</Button>
            <Button type="button" variant="outline" onClick={() => setShowDischarge(false)}>
              Annulla
            </Button>
          </form>
        </Fade>
      )}

      <div className="section-heading">
        <div><span className="eyebrow">Archivio</span><h2>Documenti della cartella</h2></div>
        <Button variant="outline" asChild>
          <Link to={`/documents?admissionId=${admission.id}`} className="d-inline-flex align-items-center gap-1">Gestisci documenti <ArrowRight size={14} aria-hidden="true" /></Link>
        </Button>
      </div>

      {filedDocuments.length === 0 ? (
        <EmptyState>
          Nessun documento ancora archiviato in cartella clinica. I documenti in lavorazione si gestiscono dalla scheda Ricoveri.
        </EmptyState>
      ) : (
        <div className="mini-list">
          {filedDocuments.map((document, i) => (
            <FadeIn key={document.id} i={i}>
              <Link to={`/documents/${document.id}`}>
                <strong>{document.originalFilename}</strong>
                <span>{documentTypeLabel(document.documentType)}</span>
                <StatusBadge status={document.ocrStatus} />
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
