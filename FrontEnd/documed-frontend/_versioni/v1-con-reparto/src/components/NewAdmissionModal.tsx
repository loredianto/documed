import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Stethoscope, UserPlus } from "lucide-react";
import { openAdmission } from "../api/patients";
import { Admission, AdmissionInput, Patient } from "../types";
import { readableError, todayIso } from "../utils/format";

/** Reparto di ingresso: ogni ricovero entra dal Pronto Soccorso e viene poi
 *  assegnato a un reparto di degenza dalla pagina Ricoveri. */
const ENTRY_DEPARTMENT = "Pronto Soccorso";

interface Props {
  /** Anagrafiche già registrate: un ricovero può aprirsi solo su un paziente esistente. */
  patients: Patient[];
  /** Pazienti con un ricovero già attivo: non possono averne un secondo. */
  activePatientIds: Set<number>;
  onCreated: (admission: Admission, patient: Patient) => void;
  onClose: () => void;
}

/**
 * Apertura di un nuovo ricovero. Il ricovero esiste solo per un paziente già
 * registrato in anagrafe: prima si seleziona (o si registra) il paziente, poi si
 * compilano i dati di ingresso. Niente paziente registrato → niente ricovero.
 * L'ingresso avviene sempre dal Pronto Soccorso (reparto di partenza).
 */
export function NewAdmissionModal({ patients, activePatientIds, onCreated, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [input, setInput] = useState<AdmissionInput>({
    admissionDate: todayIso(),
    department: ENTRY_DEPARTMENT,
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("it");
    const sorted = [...patients].sort((a, b) => a.lastName.localeCompare(b.lastName, "it"));
    if (!q) return sorted.slice(0, 8);
    return sorted
      .filter((p) =>
        `${p.firstName} ${p.lastName} ${p.fiscalCode}`.toLocaleLowerCase("it").includes(q),
      )
      .slice(0, 8);
  }, [patients, query]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const admission = await openAdmission(selected.id, {
        ...input,
        department: input.department.trim(),
        notes: input.notes.trim(),
      });
      onCreated(admission, selected);
      onClose();
    } catch (err) {
      setError(readableError(err));
      setBusy(false);
    }
  }

  // ── Passo 1: scelta del paziente ─────────────────────────────────────────
  if (!selected) {
    return (
      <div className="dm-new-adm">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <div className="dm-new-adm-note">
          <UserPlus size={18} aria-hidden="true" />
          <span>
            Il ricovero si apre su un paziente già registrato in anagrafe.
            Non lo trovi? <Link to="/patients/new">Registra prima il paziente</Link>.
          </span>
        </div>

        <label className="dm-add-field">
          <span>Cerca il paziente</span>
          <span className="dm-new-adm-search">
            <Search size={16} aria-hidden="true" />
            <input
              className="form-control"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, cognome o codice fiscale"
            />
          </span>
        </label>

        <ul className="dm-new-adm-list">
          {matches.length === 0 ? (
            <li className="dm-new-adm-empty">
              Nessun paziente registrato corrisponde alla ricerca.
            </li>
          ) : (
            matches.map((p) => {
              const hasActive = activePatientIds.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="dm-new-adm-pick"
                    disabled={hasActive}
                    onClick={() => setSelected(p)}
                  >
                    <span className="dm-new-adm-pick-main">
                      <strong>{p.lastName} {p.firstName}</strong>
                      <small className="mono">{p.fiscalCode}</small>
                    </span>
                    {hasActive
                      ? <span className="dm-new-adm-active">Ricovero già attivo</span>
                      : <span className="dm-new-adm-go">Seleziona</span>}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annulla
          </button>
        </div>
      </div>
    );
  }

  // ── Passo 2: dati del ricovero per il paziente scelto ────────────────────
  return (
    <form className="dm-new-adm" onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="dm-new-adm-selected">
        <span className="dm-new-adm-pick-main">
          <strong>{selected.lastName} {selected.firstName}</strong>
          <small className="mono">{selected.fiscalCode}</small>
        </span>
        <button type="button" className="dm-new-adm-change" onClick={() => setSelected(null)}>
          <ArrowLeft size={14} aria-hidden="true" /> Cambia paziente
        </button>
      </div>

      <div className="dm-add-fields">
        <label className="dm-add-field">
          <span>Data ingresso</span>
          <input
            type="date"
            className="form-control"
            required
            max={todayIso()}
            value={input.admissionDate}
            onChange={(e) => setInput((c) => ({ ...c, admissionDate: e.target.value }))}
          />
        </label>
        <div className="dm-add-field">
          <span>Reparto di ingresso</span>
          <span className="dm-entry-dept">
            <Stethoscope size={16} aria-hidden="true" />
            {ENTRY_DEPARTMENT}
          </span>
        </div>
      </div>

      <label className="dm-add-field mb-4">
        <span>Descrizione <small>(facoltativa)</small></span>
        <textarea
          className="form-control"
          rows={3}
          maxLength={2000}
          value={input.notes}
          onChange={(e) => setInput((c) => ({ ...c, notes: e.target.value }))}
          placeholder="Motivo dell'accesso o annotazioni cliniche"
        />
      </label>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Annulla
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Apertura…" : "Conferma ricovero"}
        </button>
      </div>
    </form>
  );
}
