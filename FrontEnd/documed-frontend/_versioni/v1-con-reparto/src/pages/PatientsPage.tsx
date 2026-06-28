import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { listPatientAdmissions, listPatients } from "../api/patients";
import { EmptyState, ErrorMessage, TableSkeleton } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pagination } from "../components/Pagination";
import { motion } from "@/lib/motion";
import { Admission, Patient } from "../types";
import { formatDate, readableError } from "../utils/format";

const PAGE_SIZE = 6;

interface PatientRow {
  patient: Patient;
  admissions: Admission[];
}

export function filterPatientRows(rows: PatientRow[], query: string): PatientRow[] {
  const normalized = query.trim().toLocaleLowerCase("it");
  if (!normalized) return rows;
  return rows.filter(({ patient }) =>
    `${patient.firstName} ${patient.lastName} ${patient.fiscalCode}`
      .toLocaleLowerCase("it")
      .includes(normalized),
  );
}

const rowVariants = {
  hidden:  { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.03, duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

export function PatientsPage() {
  const [searchParams] = useSearchParams();
  const [rows, setRows]       = useState<PatientRow[]>([]);
  const [query, setQuery]     = useState(searchParams.get("q") ?? "");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Allinea la ricerca quando arriva dal search globale dell'header.
  useEffect(() => { setQuery(searchParams.get("q") ?? ""); }, [searchParams]);

  useEffect(() => {
    listPatients()
      .then(async (patients) =>
        Promise.all(patients.map(async (patient) => ({
          patient,
          admissions: await listPatientAdmissions(patient.id),
        }))),
      )
      .then(setRows)
      .catch((e) => setError(readableError(e)))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => filterPatientRows(rows, query), [rows, query]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  useEffect(() => setPage(1), [query]);
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">Anagrafe amministrativa</span>
          <h1>Pazienti</h1>
          <p>Le anagrafiche registrate: apri una scheda per consultare i dati e gestirne i ricoveri.</p>
        </div>
        <Button asChild>
          <Link to="/patients/new" className="d-inline-flex align-items-center gap-2">
            <Plus size={16} aria-hidden="true" /> Nuovo paziente
          </Link>
        </Button>
      </header>

      <div className="dm-toolbar">
        <span className="result-count">
          {query
            ? `${filteredRows.length} risultati per «${query}»`
            : `${filteredRows.length} pazienti registrati`}
        </span>
        {query && (
          <Link to="/patients" className="text-link">
            Mostra tutti
          </Link>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredRows.length === 0 ? (
        <EmptyState>Nessun paziente corrisponde alla ricerca.</EmptyState>
      ) : (
        <>
        <div className="table-wrap panel">
          <table>
            <thead>
              <tr>
                <th>Paziente</th>
                <th>Codice fiscale</th>
                <th>Nascita</th>
                <th>Ricovero</th>
                <th>Ingresso</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ patient, admissions }, i) => {
                const current =
                  admissions.find((a) => a.status === "ACTIVE") ?? admissions[0];
                return (
                  <motion.tr
                    key={patient.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td>
                      <strong>{patient.lastName} {patient.firstName}</strong>
                      <small>{patient.email ?? "Nessuna email"}</small>
                    </td>
                    <td className="mono">{patient.fiscalCode}</td>
                    <td>{formatDate(patient.birthDate)}</td>
                    <td>
                      {current
                        ? <StatusBadge status={current.status} />
                        : <span className="muted">Nessuno</span>}
                    </td>
                    <td>{formatDate(current?.admissionDate)}</td>
                    <td>
                      <Link className="text-link d-inline-flex align-items-center gap-1" to={`/patients/${patient.id}`}>
                        Apri <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </section>
  );
}
