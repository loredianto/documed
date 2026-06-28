import { FormEvent, useState } from "react";
import { updatePatient } from "../api/patients";
import { Patient, PatientInput } from "../types";
import { Modal } from "./Modal";
import { ErrorMessage } from "./Feedback";
import { Button } from "@/components/ui/button";
import { readableError } from "../utils/format";

const FIELD_LABELS: Record<keyof PatientInput, string> = {
  firstName: "Nome",
  lastName: "Cognome",
  fiscalCode: "Codice fiscale",
  birthDate: "Data di nascita",
  email: "Email",
  phone: "Telefono",
};

const REQUIRED: (keyof PatientInput)[] = ["firstName", "lastName", "fiscalCode", "birthDate"];

interface Props {
  patient: Patient;
  onClose: () => void;
  /** Invocato con l'anagrafica aggiornata dopo il salvataggio. */
  onSaved: (updated: Patient) => void;
}

/** Modale per la modifica dell'anagrafica paziente (riutilizzata da lista e scheda). */
export function EditPatientModal({ patient, onClose, onSaved }: Props) {
  const [input, setInput] = useState<PatientInput>({
    firstName: patient.firstName,
    lastName: patient.lastName,
    fiscalCode: patient.fiscalCode,
    birthDate: patient.birthDate,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await updatePatient(patient.id, {
        ...input,
        fiscalCode: input.fiscalCode.toUpperCase(),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(readableError(err));
      setBusy(false);
    }
  }

  return (
    <Modal title="Modifica anagrafica" onClose={onClose} size="lg">
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit}>
        <dl className="dm-ocr-fields dm-fields-editor dm-edit-fields">
          {(["firstName", "lastName", "fiscalCode", "birthDate", "email", "phone"] as const).map((field) => (
            <div key={field}>
              <dt>{FIELD_LABELS[field]}</dt>
              <input
                className="form-control form-control-sm"
                required={REQUIRED.includes(field)}
                type={field === "birthDate" ? "date" : field === "email" ? "email" : "text"}
                value={input[field]}
                aria-label={FIELD_LABELS[field]}
                onChange={(e) => setInput((c) => ({ ...c, [field]: e.target.value }))}
              />
            </div>
          ))}
        </dl>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
