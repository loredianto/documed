import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPatient } from "../api/patients";
import { ErrorMessage } from "../components/Feedback";
import { PatientInput } from "../types";
import { readableError } from "../utils/format";

const EMPTY_PATIENT: PatientInput = { firstName: "", lastName: "", fiscalCode: "", birthDate: "", email: "", phone: "" };

export function PatientFormPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState(EMPTY_PATIENT);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function change(field: keyof PatientInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const patient = await createPatient({ ...input, fiscalCode: input.fiscalCode.toUpperCase() });
      navigate(`/patients/${patient.id}`);
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="narrow-page">
      <header className="page-header"><span className="eyebrow">Anagrafe</span><h1>Nuovo paziente</h1><p>Inserisci esclusivamente dati amministrativi necessari.</p></header>
      {error && <ErrorMessage message={error} />}
      <form className="panel form-grid" onSubmit={submit}>
        <label>Nome<input required maxLength={100} value={input.firstName} onChange={(e) => change("firstName", e.target.value)} /></label>
        <label>Cognome<input required maxLength={100} value={input.lastName} onChange={(e) => change("lastName", e.target.value)} /></label>
        <label>Codice fiscale<input required minLength={16} maxLength={16} pattern="[A-Za-z0-9]{16}" className="mono" value={input.fiscalCode} onChange={(e) => change("fiscalCode", e.target.value)} /></label>
        <label>Data di nascita<input required type="date" value={input.birthDate} onChange={(e) => change("birthDate", e.target.value)} /></label>
        <label>Email<input type="email" maxLength={255} value={input.email} onChange={(e) => change("email", e.target.value)} /></label>
        <label>Telefono<input maxLength={30} value={input.phone} onChange={(e) => change("phone", e.target.value)} /></label>
        <div className="form-actions full-column"><Link className="button" to="/patients">Annulla</Link><button className="button primary" disabled={submitting}>{submitting ? "Salvataggio…" : "Registra paziente"}</button></div>
      </form>
    </section>
  );
}
