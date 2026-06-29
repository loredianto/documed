import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FolderOpen, Pencil } from "lucide-react";
import { getPatient, listPatientAdmissions, openAdmission } from "../api/patients";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { PatientStateBadge, StatusBadge } from "../components/StatusBadge";
import { documentTypeLabel } from "../components/DocumentList";
import { EditPatientModal } from "../components/EditPatientModal";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/lib/motion";
import { Admission, AdmissionInput, Patient } from "../types";
import { formatDate, readableError, todayIso } from "../utils/format";
import { searchDocuments } from "../api/documents";
import { PatientDocument } from "../types";
import { currentAdmission, parseAdmissionMeta, patientAdmissionState } from "../utils/records";
import { DISCIPLINES } from "../utils/disciplines";

export function PatientDetailPage() {
  const id = Number(useParams().id);
  const [searchParams] = useSearchParams();
  const [patient, setPatient]           = useState<Patient | null>(null);
  const [admissions, setAdmissions]     = useState<Admission[]>([]);
  const [documents, setDocuments]       = useState<PatientDocument[]>([]);
  const [editing, setEditing]           = useState(searchParams.get("edit") === "1");
  const [opening, setOpening]           = useState(false);
  const [admissionInput, setAdmissionInput] = useState<AdmissionInput>({
    admissionDate: todayIso(), department: "", notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    try {
      const [patientResult, admissionsResult, documentResult] = await Promise.all([
        getPatient(id),
        listPatientAdmissions(id),
        searchDocuments({ patientId: id }),
      ]);
      setPatient(patientResult);
      setAdmissions(admissionsResult);
      setDocuments(documentResult);
    } catch (e) { setError(readableError(e)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function createAdmission(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const admission = await openAdmission(id, admissionInput);
      setOpening(false);
      setAdmissionInput({ admissionDate: todayIso(), department: "", notes: "" });
      setAdmissions((current) => [admission, ...current]);
    } catch (e) { setError(readableError(e)); }
  }

  if (loading) return <Loading label="Caricamento paziente…" />;
  if (!patient) return <ErrorMessage message={error || "Paziente non trovato"} />;

  const hasActiveAdmission = admissions.some((a) => a.status === "ACTIVE");
  const state = patientAdmissionState(admissions);
  const current = currentAdmission(admissions);
  // Cartelle cliniche ordinate: prima il ricovero in corso, poi i pregressi dal più recente.
  const sortedAdmissions = [...admissions].sort((a, b) => {
    if ((a.status === "ACTIVE") !== (b.status === "ACTIVE")) return a.status === "ACTIVE" ? -1 : 1;
    return b.admissionDate.localeCompare(a.admissionDate);
  });

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <Link to="/patients" className="dm-back-link d-inline-flex align-items-center gap-1">
            <ArrowLeft size={16} aria-hidden="true" /> Pazienti
          </Link>
          <span className="eyebrow">Scheda paziente · #{patient.id}</span>
          <h1>{patient.firstName} {patient.lastName}</h1>
          <p className="mono">{patient.fiscalCode}</p>
          <div className="dm-patient-summary">
            <PatientStateBadge state={state} />
            <span>
              {state === "RICOVERATO" && current
                ? `In ${current.department} dal ${formatDate(current.admissionDate)}`
                : state === "DIMESSO" && current
                  ? `Ultimo ricovero: ${current.department} · ${formatDate(current.admissionDate)}`
                  : "Nessun ricovero registrato"}
            </span>
          </div>
        </div>
        <div className="button-row">
          <Button variant="outline" className="d-inline-flex align-items-center gap-2" onClick={() => setEditing(true)}>
            <Pencil size={16} aria-hidden="true" /> Modifica
          </Button>
          <Button disabled={hasActiveAdmission} onClick={() => setOpening(true)}>
            + Nuovo ricovero
          </Button>
        </div>
      </header>

      {error && <ErrorMessage message={error} />}

      <div className="detail-grid">
        {[
          { label: "Email",           value: patient.email     ?? "—" },
          { label: "Telefono",        value: patient.phone     ?? "—" },
          { label: "Data di nascita", value: formatDate(patient.birthDate) },
        ].map(({ label, value }, i) => (
          <FadeIn key={label} i={i}>
            <div className="panel detail-card">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </FadeIn>
        ))}
      </div>

      {editing && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setPatient(updated)}
        />
      )}

      {opening && (
        <form className="panel form-grid section-gap" onSubmit={createAdmission}>
          <div className="full-column">
            <h2>Nuovo ricovero</h2>
            <p>Il paziente può avere un solo ricovero attivo.</p>
          </div>
          <label>
            Data del ricovero
            <input
              required type="date" max={todayIso()}
              value={admissionInput.admissionDate}
              onChange={(e) => setAdmissionInput((c) => ({ ...c, admissionDate: e.target.value }))}
            />
          </label>
          <label>
            Disciplina di ricovero
            <select
              required
              value={admissionInput.department}
              onChange={(e) => setAdmissionInput((c) => ({ ...c, department: e.target.value }))}
            >
              <option value="" disabled>Seleziona la disciplina…</option>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="full-column">
            Quesito diagnostico o note amministrative
            <textarea
              rows={3} maxLength={2000}
              value={admissionInput.notes}
              onChange={(e) => setAdmissionInput((c) => ({ ...c, notes: e.target.value }))}
            />
          </label>
          <div className="form-actions full-column">
            <Button type="button" variant="outline" onClick={() => setOpening(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!admissionInput.department}>Conferma ricovero</Button>
          </div>
        </form>
      )}

      <div className="section-heading">
        <div><span className="eyebrow">Fascicolo</span><h2>Cartelle cliniche ({admissions.length})</h2></div>
        {documents.length > 0 && (
          <Button variant="outline" asChild>
            <Link to={`/documents?patientId=${patient.id}`} className="d-inline-flex align-items-center gap-1">
              <FolderOpen size={14} aria-hidden="true" /> Apri archivio documentale
            </Link>
          </Button>
        )}
      </div>
      <p className="dm-records-note">
        Ogni ricovero genera una cartella clinica, identificata dal numero nosologico, che raccoglie i
        documenti dell'episodio. Il Fascicolo Sanitario Elettronico (FSE) li aggrega a livello di cittadino.
      </p>
      {admissions.length === 0 ? (
        <EmptyState>Nessuna cartella clinica: il paziente non ha ricoveri registrati.</EmptyState>
      ) : (
        <div className="dm-records">
          {sortedAdmissions.map((admission, i) => {
            // Nel profilo (fascicolo) si mostrano SOLO i documenti archiviati in cartella clinica;
            // quelli non ancora aggiunti restano nella scheda Ricoveri (workflow di acquisizione).
            const filedDocs = documents.filter((d) => d.admissionId === admission.id && d.filedInRecord);
            const pending = documents.filter((d) => d.admissionId === admission.id && !d.filedInRecord).length;
            const { nosologico, regime } = parseAdmissionMeta(admission.notes);
            return (
              <FadeIn key={admission.id} i={i}>
                <div className="panel dm-record-card">
                  <div className="dm-record-head">
                    <div className="dm-record-head-main">
                      <div className="dm-record-title">
                        <strong>{admission.department}</strong>
                        <StatusBadge status={admission.status} />
                      </div>
                      <div className="dm-record-meta">
                        {nosologico ? `Cartella n. ${nosologico}` : `Ricovero #${admission.id}`}
                        {regime ? ` · ${regime}` : ""}
                        {` · Ingresso ${formatDate(admission.admissionDate)}`}
                        {admission.dischargeDate
                          ? ` · Dimissione ${formatDate(admission.dischargeDate)}`
                          : " · in corso"}
                      </div>
                    </div>
                    <Link className="text-link d-inline-flex align-items-center gap-1" to={`/admissions/${admission.id}`}>
                      Apri cartella <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>

                  {filedDocs.length === 0 ? (
                    <p className="dm-record-empty muted">
                      Nessun documento ancora archiviato in cartella clinica.
                      {pending > 0 && (
                        <> {pending} {pending === 1 ? "documento" : "documenti"} in lavorazione nella <Link to="/ricoveri">scheda Ricoveri</Link>.</>
                      )}
                    </p>
                  ) : (
                    <>
                      <span className="dm-record-docs-count">
                        {filedDocs.length} {filedDocs.length === 1 ? "documento" : "documenti"} in cartella clinica
                      </span>
                      <ul className="dm-record-docs">
                        {filedDocs.map((document) => (
                          <li key={document.id}>
                            <Link className="dm-record-doc-name" to={`/documents/${document.id}`}>
                              {documentTypeLabel(document.documentType)}
                            </Link>
                            <span className="dm-record-doc-file">{document.originalFilename}</span>
                          </li>
                        ))}
                      </ul>
                      {pending > 0 && (
                        <p className="dm-record-pending muted">
                          {pending} {pending === 1 ? "documento" : "documenti"} in lavorazione nella <Link to="/ricoveri">scheda Ricoveri</Link>.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}
    </section>
  );
}
