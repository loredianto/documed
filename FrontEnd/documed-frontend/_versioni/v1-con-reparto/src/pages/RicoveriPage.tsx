import { ChangeEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, ChevronDown, FilePlus, FileText, LogOut, Plus, UploadCloud } from "lucide-react";
import { assignAdmissionDepartment, dischargeAdmission, listAdmissions, listPatients } from "../api/patients";
import { deleteDocument, listDocuments, uploadDocument } from "../api/documents";
import { listDepartments } from "../api/departments";
import { listClinicians } from "../api/clinicians";
import { EmptyState, ErrorMessage, RicoveriTableSkeleton } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmPopover } from "../components/ConfirmPopover";
import { DocumentRow } from "../components/DocumentRow";
import { Modal } from "../components/Modal";
import { DocumentModal } from "../components/DocumentModal";
import { NewAdmissionModal } from "../components/NewAdmissionModal";
import { AssignDepartmentPopover } from "../components/AssignDepartmentPopover";
import { Button } from "@/components/ui/button";
import { Pagination } from "../components/Pagination";
import { PeriodFilter } from "../components/PeriodFilter";

const PAGE_SIZE = 6;
/** Estensioni accettate dal file picker. */
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.tiff,.webp,image/*,application/pdf";
import { Admission, Clinico, DocumentType, OcrExtraction, Patient, PatientDocument } from "../types";
import { formatDate, readableError, todayIso } from "../utils/format";
import { Range, todayRange } from "../utils/period";

type ModalState = { kind: "view" | "scan"; doc: PatientDocument };

/** Una dimissione è possibile solo con la lettera di dimissione in cartella. */
function hasDischargeLetter(docs: PatientDocument[]): boolean {
  return docs.some((d) => d.documentType === "DISCHARGE_DOCUMENT");
}

/** Stato del caricamento in corso per un ricovero. */
type UploadState = { admissionId: number; total: number; done: number };

export function RicoveriPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Record<number, Patient>>({});
  const [docsByAdmission, setDocsByAdmission] = useState<Record<number, PatientDocument[]>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [clinicians, setClinicians] = useState<Clinico[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<Range>(() => todayRange());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [uploading, setUploading] = useState<UploadState | null>(null);
  const [justUploaded, setJustUploaded] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  function markProcessed(doc: PatientDocument, extraction: OcrExtraction, documentType: DocumentType) {
    const patientId = extraction.resolution?.patientId ?? doc.patientId;

    // Spostamento ad altro paziente: il documento migra al ricovero più recente di quel paziente,
    // così doc ↔ ricovero ↔ paziente restano coerenti (e l'accordion lo mostra sotto il nuovo ricovero).
    let admissionId = doc.admissionId;
    if (patientId !== doc.patientId) {
      const target = admissions
        .filter((a) => a.patientId === patientId)
        .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))[0];
      if (target) admissionId = target.id;
    }

    const resolution = extraction.resolution ? { ...extraction.resolution, admissionId } : extraction.resolution;
    const updated: PatientDocument = {
      ...doc,
      ocrStatus: "COMPLETED",
      ocrExtraction: { ...extraction, resolution },
      documentType,
      patientId,
      admissionId,
    };

    setDocsByAdmission((prev) => {
      const next = { ...prev };
      // via dal ricovero originale…
      next[doc.admissionId] = (next[doc.admissionId] ?? []).filter((d) => d.id !== doc.id);
      // …e nel ricovero di destinazione (rimpiazza se già presente).
      next[admissionId] = [...(next[admissionId] ?? []).filter((d) => d.id !== doc.id), updated];
      return next;
    });
  }

  function addDocument(newDoc: PatientDocument) {
    setDocsByAdmission((prev) => ({
      ...prev,
      [newDoc.admissionId]: [...(prev[newDoc.admissionId] ?? []), newDoc],
    }));
  }

  /** Apre il file picker del sistema (multi-selezione) per il ricovero indicato. */
  function pickFiles(admissionId: number) {
    uploadTargetRef.current = admissionId;
    fileInputRef.current?.click();
  }

  /** Carica i file selezionati uno a uno, mostrando il progress e popolando l'accordion. */
  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // consente di riselezionare gli stessi file
    const admissionId = uploadTargetRef.current;
    if (admissionId == null || files.length === 0) return;

    setExpanded(admissionId); // apre la riga: l'utente vede dove arriveranno i documenti
    setJustUploaded(null);
    setUploading({ admissionId, total: files.length, done: 0 });
    try {
      for (const file of files) {
        const doc = await uploadDocument(admissionId, file, "OTHER", "");
        addDocument(doc);
        setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
      }
      setJustUploaded(admissionId);
      window.setTimeout(() => setJustUploaded((id) => (id === admissionId ? null : id)), 2600);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setUploading(null);
    }
  }

  /** Aggiunge il ricovero appena aperto in cima alla lista e ne registra l'anagrafica. */
  function handleAdmissionCreated(admission: Admission, patient: Patient) {
    setPatients((prev) => ({ ...prev, [patient.id]: patient }));
    setAdmissions((prev) => [admission, ...prev]);
    setExpanded(admission.id);
  }

  function dischargeOne(a: Admission) {
    dischargeAdmission(a.id, todayIso())
      .then((updated) => setAdmissions((prev) => prev.map((x) => (x.id === a.id ? updated : x))))
      .catch((e) => setError(readableError(e)));
  }

  /** Assegna/trasferisce il ricovero a un reparto e notifica la sua accettazione. */
  function assignDept(a: Admission, department: string) {
    const patient = patients[a.patientId];
    const who = patient ? `${patient.lastName} ${patient.firstName}` : `il paziente`;
    assignAdmissionDepartment(a.id, department)
      .then((updated) => {
        setAdmissions((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
        setNotice(`Accettazione di ${department} notificata dell'arrivo di ${who}.`);
        window.setTimeout(() => setNotice((n) => (n.includes(department) ? "" : n)), 5000);
      })
      .catch((e) => setError(readableError(e)));
  }

  function removeDocument(doc: PatientDocument) {
    deleteDocument(doc.id)
      .then(() =>
        setDocsByAdmission((prev) => ({
          ...prev,
          [doc.admissionId]: (prev[doc.admissionId] ?? []).filter((d) => d.id !== doc.id),
        })),
      )
      .catch((e) => setError(readableError(e)));
  }

  useEffect(() => {
    Promise.all([listAdmissions(), listPatients(), listDocuments(), listDepartments(), listClinicians()])
      .then(([adms, pats, docs, deps, clis]) => {
        setAdmissions([...adms].sort((a, b) => b.admissionDate.localeCompare(a.admissionDate)));
        setPatients(Object.fromEntries(pats.map((p) => [p.id, p])));
        const grouped: Record<number, PatientDocument[]> = {};
        docs.forEach((d) => {
          (grouped[d.admissionId] ??= []).push(d);
        });
        setDocsByAdmission(grouped);
        setDepartments(deps);
        setClinicians(clis);
      })
      .catch((e) => setError(readableError(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const from = range.from.slice(0, 10);
    const to = range.to.slice(0, 10);
    // ricovero "presente" nel periodo: ingresso ≤ fine periodo e (ancora attivo o dimesso ≥ inizio periodo)
    return admissions.filter((a) => {
      if (a.admissionDate > to) return false;
      if (a.dischargeDate && a.dischargeDate < from) return false;
      return true;
    });
  }, [admissions, range]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [range]);
  useEffect(() => setPage((p) => Math.min(p, pageCount)), [pageCount]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPage(p: number) {
    setExpanded(null);
    setPage(p);
  }

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">Archivio clinico</span>
          <h1>Ricoveri</h1>
          <p>Espandi un ricovero per consultare i documenti correlati ed elaborarli con l'OCR.</p>
        </div>
        <div className="dm-header-tools">
          <PeriodFilter range={range} onChange={setRange} />
          <Button className="d-inline-flex align-items-center gap-2" onClick={() => setShowNew(true)}>
            <Plus size={16} aria-hidden="true" /> Nuovo ricovero
          </Button>
        </div>
      </header>

      {!loading && (
        <p className="result-count mb-3">{filtered.length} ricoveri presenti nel periodo</p>
      )}

      {notice && (
        <div className="dm-notice" role="status" aria-live="polite">
          <BellRing size={16} aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <RicoveriTableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState>Nessun ricovero corrisponde alla ricerca.</EmptyState>
      ) : (
        <>
        <div className="table-wrap panel dm-acc-wrap">
          <table className="dm-accordion">
            <thead>
              <tr>
                <th className="dm-acc-toggle-col" />
                <th>Paziente</th>
                <th>Ingresso</th>
                <th>Descrizione</th>
                <th>Stato</th>
                <th>Documenti</th>
                <th>Reparto</th>
                <th className="dm-acc-actions-col">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => {
                const p = patients[a.patientId];
                const docs = docsByAdmission[a.id] ?? [];
                const open = expanded === a.id;
                return (
                  <Fragment key={a.id}>
                    <tr
                      className={`dm-acc-row${open ? " open" : ""}`}
                      onClick={() => setExpanded(open ? null : a.id)}
                      aria-expanded={open}
                    >
                      <td className="dm-acc-toggle">
                        <ChevronDown size={18} aria-hidden="true" className={open ? "dm-chevron-open" : ""} />
                      </td>
                      <td>
                        <strong>{p ? `${p.lastName} ${p.firstName}` : `Paziente #${a.patientId}`}</strong>
                        <small className="mono">{p?.fiscalCode ?? "—"}</small>
                      </td>
                      <td>{formatDate(a.admissionDate)}</td>
                      <td className="dm-acc-desc">{a.notes || "—"}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <span className="dm-doc-count">
                          <FileText size={14} aria-hidden="true" /> {docs.length}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="dm-dept-cell">
                          <span className={`dm-dept-current${a.department === "Pronto Soccorso" ? " is-ps" : ""}`}>
                            {a.department}
                          </span>
                          {a.status === "ACTIVE" && (
                            <AssignDepartmentPopover
                              current={a.department}
                              departments={departments}
                              onAssign={(dept) => assignDept(a, dept)}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="dm-row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="dm-icon-btn dm-tip-row"
                            data-tooltip="Carica uno o più documenti da questo computer"
                            aria-label="Carica documenti"
                            disabled={uploading?.admissionId === a.id}
                            onClick={() => pickFiles(a.id)}
                          >
                            <FilePlus size={16} aria-hidden="true" />
                          </button>
                          {a.status === "ACTIVE" ? (
                            hasDischargeLetter(docs) ? (
                              <ConfirmPopover
                                icon={<LogOut size={16} aria-hidden="true" />}
                                label="Dimetti"
                                showLabel
                                triggerClassName="dm-btn-discharge"
                                title="Confermare la dimissione?"
                                message="Verificato: la lettera di dimissione è in cartella. Il ricovero verrà chiuso in data odierna e il posto letto liberato."
                                confirmLabel="Conferma dimissione"
                                onConfirm={() => dischargeOne(a)}
                              />
                            ) : (
                              <button
                                type="button"
                                className="dm-btn-discharge is-disabled dm-tip-row"
                                data-tooltip="Per dimettere è necessaria la lettera di dimissione in cartella"
                                aria-disabled="true"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LogOut size={16} aria-hidden="true" />
                                <span className="dm-btn-label">Dimetti</span>
                              </button>
                            )
                          ) : (
                            <span
                              className="dm-discharged-pill"
                              title={a.dischargeDate ? `Dimesso il ${formatDate(a.dischargeDate)}` : "Dimesso"}
                            >
                              Dimesso
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="dm-acc-panel-row">
                        <td colSpan={8}>
                          <div className={`dm-acc-panel${justUploaded === a.id ? " dm-acc-panel-flash" : ""}`}>
                            {uploading?.admissionId === a.id && (
                              <div className="dm-upload-progress" role="status" aria-live="polite">
                                <UploadCloud size={18} aria-hidden="true" />
                                <div className="dm-upload-progress-body">
                                  <span className="dm-upload-progress-label">
                                    Caricamento {Math.min(uploading.done + 1, uploading.total)} di{" "}
                                    {uploading.total}…
                                  </span>
                                  <div className="dm-upload-bar" aria-hidden="true"><span /></div>
                                </div>
                              </div>
                            )}
                            {docs.length === 0 && uploading?.admissionId !== a.id ? (
                              <button type="button" className="dm-upload-dropcue" onClick={() => pickFiles(a.id)}>
                                <UploadCloud size={22} aria-hidden="true" />
                                <span>Nessun documento. <strong>Carica un file</strong> da questo computer.</span>
                              </button>
                            ) : (
                              <div className="dm-ocr-list">
                                {docs.map((d) => (
                                  <DocumentRow
                                    key={d.id}
                                    document={d}
                                    onView={() => setModal({ kind: "view", doc: d })}
                                    onScanned={(extraction) =>
                                      setModal({ kind: "scan", doc: { ...d, ocrExtraction: extraction } })
                                    }
                                    onDelete={() => removeDocument(d)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
        </>
      )}

      {/* input nascosto: l'upload apre direttamente la directory del PC (multi-selezione) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="dm-visually-hidden"
        onChange={handleFiles}
      />

      {modal && (
        <Modal
          title={modal.kind === "view" ? "Documento digitale" : "Versione digitale · verifica i dati"}
          size="full"
          onClose={() => setModal(null)}
        >
          <DocumentModal
            document={modal.doc}
            mode={modal.kind}
            departments={departments}
            patients={Object.values(patients)}
            clinicians={clinicians}
            onProcessed={(ex, type) => markProcessed(modal.doc, ex, type)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {showNew && (
        <Modal title="Nuovo ricovero" size="lg" onClose={() => setShowNew(false)}>
          <NewAdmissionModal
            patients={Object.values(patients)}
            activePatientIds={new Set(
              admissions.filter((a) => a.status === "ACTIVE").map((a) => a.patientId),
            )}
            onCreated={handleAdmissionCreated}
            onClose={() => setShowNew(false)}
          />
        </Modal>
      )}
    </section>
  );
}
