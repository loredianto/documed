import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getPatient, listPatientAdmissions, openAdmission, updatePatient } from "../api/patients";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/lib/motion";
import { Admission, AdmissionInput, Patient, PatientInput } from "../types";
import { formatDate, readableError, todayIso } from "../utils/format";
import { searchDocuments } from "../api/documents";
import { PatientDocument } from "../types";

export function PatientDetailPage() {
  const id = Number(useParams().id);
  const [patient, setPatient]           = useState<Patient | null>(null);
  const [admissions, setAdmissions]     = useState<Admission[]>([]);
  const [documents, setDocuments]       = useState<PatientDocument[]>([]);
  const [editing, setEditing]           = useState(false);
  const [opening, setOpening]           = useState(false);
  const [patientInput, setPatientInput] = useState<PatientInput | null>(null);
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
      setPatientInput({
        firstName: patientResult.firstName,
        lastName:  patientResult.lastName,
        fiscalCode: patientResult.fiscalCode,
        birthDate: patientResult.birthDate,
        email:  patientResult.email  ?? "",
        phone:  patientResult.phone  ?? "",
      });
      setAdmissions(admissionsResult);
      setDocuments(documentResult);
    } catch (e) { setError(readableError(e)); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function savePatient(event: FormEvent) {
    event.preventDefault();
    if (!patientInput) return;
    setError("");
    try {
      await updatePatient(id, { ...patientInput, fiscalCode: patientInput.fiscalCode.toUpperCase() });
      setEditing(false);
      await load();
    } catch (e) { setError(readableError(e)); }
  }

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
  if (!patient || !patientInput) return <ErrorMessage message={error || "Paziente non trovato"} />;

  const hasActiveAdmission = admissions.some((a) => a.status === "ACTIVE");

  const fieldLabels: Record<keyof PatientInput, string> = {
    firstName: "Nome", lastName: "Cognome", fiscalCode: "Codice fiscale",
    birthDate: "Data di nascita", email: "Email", phone: "Telefono",
  };

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">Scheda paziente · #{patient.id}</span>
          <h1>{patient.firstName} {patient.lastName}</h1>
          <p className="mono">{patient.fiscalCode}</p>
        </div>
        <div className="button-row">
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>
            Modifica
          </Button>
          <Button disabled={hasActiveAdmission} onClick={() => setOpening(true)}>
            + Nuovo ricovero
          </Button>
        </div>
      </header>

      {error && <ErrorMessage message={error} />}

      {editing ? (
        <form className="panel form-grid" onSubmit={savePatient}>
          {(["firstName", "lastName", "fiscalCode", "birthDate", "email", "phone"] as const).map((field) => (
            <label key={field}>
              {fieldLabels[field]}
              <input
                required={["firstName", "lastName", "fiscalCode", "birthDate"].includes(field)}
                type={field === "birthDate" ? "date" : field === "email" ? "email" : "text"}
                value={patientInput[field]}
                onChange={(e) => setPatientInput((current) => current && ({ ...current, [field]: e.target.value }))}
              />
            </label>
          ))}
          <div className="form-actions full-column">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Annulla
            </Button>
            <Button type="submit">Salva modifiche</Button>
          </div>
        </form>
      ) : (
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
      )}

      {opening && (
        <form className="panel form-grid section-gap" onSubmit={createAdmission}>
          <div className="full-column">
            <h2>Nuovo ricovero</h2>
            <p>Il paziente può avere un solo ricovero attivo.</p>
          </div>
          <label>
            Data ingresso
            <input
              required type="date" max={todayIso()}
              value={admissionInput.admissionDate}
              onChange={(e) => setAdmissionInput((c) => ({ ...c, admissionDate: e.target.value }))}
            />
          </label>
          <label>
            Reparto
            <input
              required maxLength={120}
              value={admissionInput.department}
              onChange={(e) => setAdmissionInput((c) => ({ ...c, department: e.target.value }))}
            />
          </label>
          <label className="full-column">
            Note
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
            <Button type="submit">Conferma ricovero</Button>
          </div>
        </form>
      )}

      <div className="section-heading">
        <div><span className="eyebrow">Percorso</span><h2>Storico ricoveri</h2></div>
      </div>
      {admissions.length === 0 ? (
        <EmptyState>Nessun ricovero registrato.</EmptyState>
      ) : (
        <div className="timeline">
          {admissions.map((admission, i) => (
            <FadeIn key={admission.id} i={i}>
              <Link className="timeline-item panel" to={`/admissions/${admission.id}`}>
                <span className="timeline-date">{formatDate(admission.admissionDate)}</span>
                <div>
                  <strong>{admission.department}</strong>
                  <small>Ricovero #{admission.id}</small>
                </div>
                <StatusBadge status={admission.status} />
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </FadeIn>
          ))}
        </div>
      )}

      <div className="section-heading">
        <div><span className="eyebrow">Archivio</span><h2>Documenti associati</h2></div>
        <Button variant="outline" asChild>
          <Link to="/ricoveri" className="d-inline-flex align-items-center gap-1">Apri archivio <ArrowRight size={14} aria-hidden="true" /></Link>
        </Button>
      </div>
      {documents.length === 0 ? (
        <EmptyState>Nessun documento associato al paziente.</EmptyState>
      ) : (
        <div className="mini-list">
          {documents.slice(0, 5).map((document, i) => (
            <FadeIn key={document.id} i={i}>
              <Link to={`/documents/${document.id}`}>
                <strong>{document.originalFilename}</strong>
                <span>{document.documentType.replace(/_/g, " ")}</span>
                <StatusBadge status={document.ocrStatus} />
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </section>
  );
}
