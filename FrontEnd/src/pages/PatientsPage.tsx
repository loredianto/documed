import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { deletePatient, listAdmissions, listPatients } from "../api/patients";
import { listDocuments } from "../api/documents";
import { EmptyState, ErrorMessage, TableSkeleton } from "../components/Feedback";
import { PatientStateBadge } from "../components/StatusBadge";
import { ConfirmPopover } from "../components/ConfirmPopover";
import { EditPatientModal } from "../components/EditPatientModal";
import { Button } from "@/components/ui/button";
import { Pagination } from "../components/Pagination";
import { motion } from "@/lib/motion";
import { Admission, Patient } from "../types";
import { formatDate, readableError } from "../utils/format";
import { patientAdmissionState } from "../utils/records";

const PAGE_SIZE = 6;

interface PatientRow {
  patient: Patient;
  admissions: Admission[];
  /** Numero di cartelle cliniche presenti nel fascicolo: ricoveri con almeno un documento archiviato. */
  recordCount: number;
}

export function filterPatientRows<T extends { patient: Patient }>(rows: T[], query: string): T[] {
  const normalized = query.trim().toLocaleLowerCase("it");
  if (!normalized) return rows;
  return rows.filter(({ patient }) =>
    `${patient.firstName} ${patient.lastName} ${patient.fiscalCode}`
      .toLocaleLowerCase("it")
      .includes(normalized),
  );
}

/** Ordina la rubrica in ordine alfabetico per cognome (poi nome). */
function sortRows(rows: PatientRow[]): PatientRow[] {
  return [...rows].sort(
    (a, b) =>
      a.patient.lastName.localeCompare(b.patient.lastName, "it") ||
      a.patient.firstName.localeCompare(b.patient.firstName, "it"),
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
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Allinea la ricerca quando arriva dal search globale dell'header.
  useEffect(() => { setQuery(searchParams.get("q") ?? ""); }, [searchParams]);

  useEffect(() => {
    // Una sola lettura di ricoveri e documenti, poi raggruppati per paziente lato client.
    Promise.all([listPatients(), listAdmissions(), listDocuments()])
      .then(([patients, admissions, documents]) => {
        // Cartelle cliniche presenti = ricoveri (admissionId distinti) con almeno un documento archiviato.
        const recordAdmissions = new Map<number, Set<number>>();
        for (const d of documents) {
          if (!d.filedInRecord) continue;
          if (!recordAdmissions.has(d.patientId)) recordAdmissions.set(d.patientId, new Set());
          recordAdmissions.get(d.patientId)!.add(d.admissionId);
        }
        const built: PatientRow[] = patients.map((patient) => ({
          patient,
          admissions: admissions.filter((a) => a.patientId === patient.id),
          recordCount: recordAdmissions.get(patient.id)?.size ?? 0,
        }));
        setRows(sortRows(built));
      })
      .catch((e) => setError(readableError(e)))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => filterPatientRows(rows, query), [rows, query]);
  const activeCount = useMemo(
    () => rows.filter((r) => r.admissions.some((a) => a.status === "ACTIVE")).length,
    [rows],
  );

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  useEffect(() => setPage(1), [query]);
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function remove(patient: Patient) {
    setError("");
    try {
      await deletePatient(patient.id);
      setRows((rs) => rs.filter((r) => r.patient.id !== patient.id));
    } catch (e) { setError(readableError(e)); }
  }

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">Anagrafe e cartelle cliniche</span>
          <h1>Pazienti</h1>
          <p>Cerca un assistito e apri la sua scheda.</p>
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
            : `${filteredRows.length} pazienti in rubrica · ${activeCount} attualmente ricoverati`}
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
        <div className="table-wrap panel dm-patients-wrap">
          <table>
            <thead>
              <tr>
                <th>Paziente</th>
                <th>Nascita</th>
                <th>Stato</th>
                <th>Ricoveri</th>
                <th>Cartella clinica</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ patient, admissions, recordCount }, i) => {
                const state = patientAdmissionState(admissions);
                const hasActive = admissions.some((a) => a.status === "ACTIVE");
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
                      <small className="mono">{patient.fiscalCode}</small>
                    </td>
                    <td>{formatDate(patient.birthDate)}</td>
                    <td><PatientStateBadge state={state} /></td>
                    <td>{admissions.length}</td>
                    <td>
                      {recordCount > 0 ? (
                        <span className="dm-doc-count" title="Cartelle cliniche con documenti archiviati">
                          <FolderOpen size={14} aria-hidden="true" /> {recordCount}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="dm-row-actions">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="dm-icon-btn dm-tip-row"
                          data-tooltip="Apri scheda paziente"
                          aria-label="Apri scheda paziente"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className="dm-icon-btn dm-tip-row"
                          data-tooltip="Modifica anagrafica"
                          aria-label="Modifica anagrafica"
                          onClick={() => setEditingPatient(patient)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        {hasActive ? (
                          <button
                            type="button"
                            className="dm-icon-btn dm-icon-btn-danger dm-tip-row"
                            data-tooltip="Non eliminabile: ricovero in corso"
                            aria-disabled="true"
                            disabled
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        ) : (
                          <ConfirmPopover
                            icon={<Trash2 size={16} aria-hidden="true" />}
                            label="Elimina paziente"
                            title="Eliminare il paziente?"
                            message="L'anagrafica verrà rimossa dalla rubrica. L'operazione non è reversibile."
                            confirmLabel="Elimina"
                            destructive
                            onConfirm={() => void remove(patient)}
                          />
                        )}
                      </div>
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

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSaved={(updated) =>
            setRows((rs) => rs.map((r) => (r.patient.id === updated.id ? { ...r, patient: updated } : r)))
          }
        />
      )}
    </section>
  );
}
