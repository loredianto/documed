import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listPatientAdmissions, listPatients } from "../api/patients";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { Admission, Patient } from "../types";
import { formatDate, readableError } from "../utils/format";

interface PatientRow {
  patient: Patient;
  admissions: Admission[];
}

export function filterPatientRows(rows: PatientRow[], query: string): PatientRow[] {
  const normalized = query.trim().toLocaleLowerCase("it");
  if (!normalized) return rows;
  return rows.filter(({ patient }) =>
    `${patient.firstName} ${patient.lastName} ${patient.fiscalCode}`.toLocaleLowerCase("it").includes(normalized),
  );
}

export function PatientsPage() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listPatients()
      .then(async (patients) => Promise.all(
        patients.map(async (patient) => ({ patient, admissions: await listPatientAdmissions(patient.id) })),
      ))
      .then(setRows)
      .catch((requestError) => setError(readableError(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => filterPatientRows(rows, query), [rows, query]);

  return (
    <section>
      <header className="page-header with-action">
        <div><span className="eyebrow">Anagrafe amministrativa</span><h1>Pazienti</h1></div>
        <Link className="button primary" to="/patients/new">+ Nuovo paziente</Link>
      </header>
      <div className="toolbar panel compact">
        <label className="search-field">Cerca per nome, cognome o codice fiscale
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Es. RSSMRA…" />
        </label>
        <span className="result-count">{filteredRows.length} risultati</span>
      </div>
      {error && <ErrorMessage message={error} />}
      {loading ? <Loading label="Caricamento pazienti…" /> : filteredRows.length === 0 ? (
        <EmptyState>Nessun paziente corrisponde alla ricerca.</EmptyState>
      ) : (
        <div className="table-wrap panel">
          <table>
            <thead><tr><th>Paziente</th><th>Codice fiscale</th><th>Nascita</th><th>Ricovero</th><th>Ingresso</th><th /></tr></thead>
            <tbody>{filteredRows.map(({ patient, admissions }) => {
              const current = admissions.find((item) => item.status === "ACTIVE") ?? admissions[0];
              return (
                <tr key={patient.id}>
                  <td><strong>{patient.lastName} {patient.firstName}</strong><small>{patient.email ?? "Nessuna email"}</small></td>
                  <td className="mono">{patient.fiscalCode}</td>
                  <td>{formatDate(patient.birthDate)}</td>
                  <td>{current ? <StatusBadge status={current.status} /> : <span className="muted">Nessuno</span>}</td>
                  <td>{formatDate(current?.admissionDate)}</td>
                  <td><Link className="text-link" to={`/patients/${patient.id}`}>Apri →</Link></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
