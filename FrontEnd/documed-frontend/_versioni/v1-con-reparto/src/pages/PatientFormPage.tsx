import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPatient } from "../api/patients";
import { ErrorMessage } from "../components/Feedback";
import { Button } from "@/components/ui/button";
import { Fade } from "@/lib/motion";
import { PatientInput } from "../types";
import { readableError } from "../utils/format";

const EMPTY_PATIENT: PatientInput = {
  firstName: "", lastName: "", fiscalCode: "", birthDate: "", email: "", phone: "",
};

const FIELDS: { key: keyof PatientInput; label: string; required?: boolean; type?: string; props?: Record<string, unknown> }[] = [
  { key: "firstName",  label: "Nome",             required: true,  props: { maxLength: 100 } },
  { key: "lastName",   label: "Cognome",           required: true,  props: { maxLength: 100 } },
  { key: "fiscalCode", label: "Codice fiscale",    required: true,  props: { minLength: 16, maxLength: 16, pattern: "[A-Za-z0-9]{16}", className: "mono" } },
  { key: "birthDate",  label: "Data di nascita",   required: true,  type: "date" },
  { key: "email",      label: "Email",                               type: "email", props: { maxLength: 255 } },
  { key: "phone",      label: "Telefono",                            props: { maxLength: 30 } },
];

export function PatientFormPage() {
  const navigate = useNavigate();
  const [input, setInput]         = useState(EMPTY_PATIENT);
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  function change(field: keyof PatientInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError("");
    try {
      const patient = await createPatient({ ...input, fiscalCode: input.fiscalCode.toUpperCase() });
      navigate(`/patients/${patient.id}`);
    } catch (e) { setError(readableError(e)); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="narrow-page">
      <header className="page-header">
        <span className="eyebrow">Anagrafe</span>
        <h1>Nuovo paziente</h1>
        <p>Inserisci esclusivamente dati amministrativi necessari.</p>
      </header>

      {error && <ErrorMessage message={error} />}

      <Fade>
        <form className="panel form-grid" onSubmit={submit}>
          {FIELDS.map(({ key, label, required, type, props }) => (
            <label key={key}>
              {label}
              <input
                required={required}
                type={type ?? "text"}
                value={input[key]}
                onChange={(e) => change(key, e.target.value)}
                {...props}
              />
            </label>
          ))}
          <div className="form-actions full-column">
            <Button type="button" variant="outline" asChild>
              <Link to="/patients">Annulla</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvataggio…" : "Registra paziente"}
            </Button>
          </div>
        </form>
      </Fade>
    </section>
  );
}
