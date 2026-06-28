import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody } from "design-react-kit";
import { AlertTriangle, ArrowRight, FileSearch, FolderClock, RefreshCw, UserPlus } from "lucide-react";
import { listDocuments } from "../api/documents";
import { getActivityRange, getPatientStatistics, listAdmissions, listPatients } from "../api/patients";
import { DashboardSkeleton, ErrorMessage } from "../components/Feedback";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "../components/PeriodFilter";
import { Fade } from "@/lib/motion";
import { Admission, DailyActivity, Patient, PatientDocument, PatientStatistics } from "../types";
import { formatDate, readableError } from "../utils/format";
import { averageActiveStayDays, incompleteAdmissions, incompletePatients } from "../utils/records";
import { lastDays, Range } from "../utils/period";

interface Task {
  key: string;
  to: string;
  count: number;
  label: string;
  hint: string;
  icon: typeof FolderClock;
  tone: "danger" | "warn" | "review" | "info";
}

export function DashboardPage() {
  const [patients, setPatients]       = useState<PatientStatistics | null>(null);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [admissions, setAdmissions]   = useState<Admission[]>([]);
  const [documents, setDocuments]     = useState<PatientDocument[]>([]);
  const [range, setRange]             = useState<Range>(() => lastDays(7));
  const [activity, setActivity]       = useState<DailyActivity[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [stats, pts, adms, docs] = await Promise.all([
        getPatientStatistics(),
        listPatients(),
        listAdmissions(),
        listDocuments(),
      ]);
      setPatients(stats);
      setPatientList(pts);
      setAdmissions(adms);
      setDocuments(docs);
    } catch (e) { setError(readableError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    void getActivityRange(range.from, range.to).then((a) => { if (active) setActivity(a); });
    return () => { active = false; };
  }, [range]);

  // Il periodo selezionato governa i Movimenti (grafico/metriche); le code di lavoro
  // riflettono invece TUTTO l'arretrato presente nei dati, a prescindere dal periodo.
  const incomplete = useMemo(
    () => incompleteAdmissions(admissions, documents),
    [admissions, documents],
  );
  const pendingOcr = useMemo(
    () => documents.filter((d) => d.ocrStatus === "PENDING" || d.ocrStatus === "PROCESSING"),
    [documents],
  );
  const failedOcr = useMemo(
    () => documents.filter((d) => d.ocrStatus === "FAILED"),
    [documents],
  );
  const incompleteAn = useMemo(() => incompletePatients(patientList), [patientList]);

  const tasks: Task[] = useMemo(() => [
    { key: "records",     to: "/ricoveri",                  count: incomplete.length,   label: "Cartelle cliniche incomplete", hint: "ricoveri senza identità, modulo o consenso", icon: FolderClock,    tone: "warn" },
    { key: "ocr-failed",  to: "/documents?ocrStatus=FAILED",count: failedOcr.length,    label: "OCR da rilavorare",            hint: "documenti non riconosciuti, da ricaricare",  icon: AlertTriangle,  tone: "danger" },
    { key: "ocr-pending", to: "/documents?ocrStatus=PENDING",count: pendingOcr.length,  label: "Documenti da elaborare",       hint: "in coda per la versione digitale",           icon: FileSearch,     tone: "info" },
    { key: "registry",    to: "/patients",                  count: incompleteAn.length, label: "Anagrafiche incomplete",       hint: "manca un recapito o il codice fiscale",      icon: UserPlus,       tone: "info" },
  ], [incomplete.length, failedOcr.length, pendingOcr.length, incompleteAn.length]);

  const openTasks   = useMemo(() => tasks.reduce((s, t) => s + t.count, 0), [tasks]);
  const maxDaily    = useMemo(() => Math.max(1, ...activity.flatMap((d) => [d.admissions, d.discharges])), [activity]);
  const periodAdmissions = useMemo(() => activity.reduce((s, d) => s + d.admissions, 0), [activity]);
  const periodDischarges = useMemo(() => activity.reduce((s, d) => s + d.discharges, 0), [activity]);
  const avgStay = useMemo(() => averageActiveStayDays(admissions, new Date()), [admissions]);

  return (
    <section>
      <header className="page-header with-action">
        <div>
          <span className="eyebrow">Quadro operativo</span>
          <h1>Dashboard</h1>
          <p>Controlla i movimenti e smaltisci il lavoro in sospeso.</p>
        </div>
        <div className="dm-header-tools">
          <PeriodFilter range={range} onChange={setRange} />
          <Button variant="outline" className="d-inline-flex align-items-center gap-2" onClick={() => void load()}>
            <RefreshCw size={16} aria-hidden="true" /> Aggiorna
          </Button>
        </div>
      </header>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <DashboardSkeleton />
      ) : patients && (
        <>
          {/* ── Movimenti nel periodo (metriche + grafico, un pannello) ─ */}
          <Fade>
            <Card border={true}>
              <CardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="eyebrow">Ultimi {activity.length} giorni</span>
                    <h2 className="panel-title">Ingressi e dimissioni</h2>
                  </div>
                  <Link className="text-link d-inline-flex align-items-center gap-1" to="/ricoveri">Vai ai ricoveri <ArrowRight size={14} aria-hidden="true" /></Link>
                </div>

                <div className="dm-flow">
                  <div className="dm-flow-metrics">
                    <div className="dm-flow-metric" data-tone="admission">
                      <span className="dm-flow-value">{periodAdmissions}</span>
                      <span className="dm-flow-label">Ingressi</span>
                    </div>
                    <div className="dm-flow-metric" data-tone="discharge">
                      <span className="dm-flow-value">{periodDischarges}</span>
                      <span className="dm-flow-label">Dimissioni</span>
                    </div>
                    <div className="dm-flow-metric dm-flow-live">
                      <span className="dm-flow-value">{patients.activeAdmissions}</span>
                      <span className="dm-flow-label">Ricoveri attivi <em>ora</em></span>
                    </div>
                    <div className="dm-flow-metric dm-flow-live">
                      <span className="dm-flow-value">{avgStay}<small className="dm-flow-unit"> gg</small></span>
                      <span className="dm-flow-label">Degenza media</span>
                    </div>
                  </div>

                  <div className="dm-flow-chart">
                    {activity.length === 0 ? (
                      <div className="dm-empty">Nessuna attività nell'intervallo selezionato.</div>
                    ) : (
                      <div
                        className="bars"
                        style={{ gridTemplateColumns: `repeat(${activity.length}, 1fr)` }}
                        aria-label="Ingressi e dimissioni nel periodo selezionato"
                      >
                        {activity.map((day) => (
                          <div className="bar-day" key={day.date}>
                            <div className="bar-tip" role="tooltip">
                              <span className="bar-tip-date">{formatDate(day.date)}</span>
                              <span className="bar-tip-row"><i className="admission-key" />{day.admissions} ingressi</span>
                              <span className="bar-tip-row"><i className="discharge-key" />{day.discharges} dimissioni</span>
                            </div>
                            <div className="bar-pair">
                              <i className="bar admissions" style={{ "--bar-height": `${(day.admissions / maxDaily) * 100}%` } as CSSProperties}><span>{day.admissions}</span></i>
                              <i className="bar discharges" style={{ "--bar-height": `${(day.discharges / maxDaily) * 100}%` } as CSSProperties}><span>{day.discharges}</span></i>
                            </div>
                            <small>
                              {activity.length <= 8
                                ? new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(new Date(`${day.date}T00:00:00`))
                                : Number(day.date.slice(8, 10))}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="chart-key">
                      <span><i className="admission-key" />Ingressi</span>
                      <span><i className="discharge-key" />Dimissioni</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Fade>

          {/* ── Da fare ora (lista di lavoro, un pannello) ─────────── */}
          <Fade>
            <Card border={true} className="mt-3">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    <span className="eyebrow">Priorità operative</span>
                    <h2 className="panel-title">Completa le attività in sospeso</h2>
                  </div>
                  <span className={`dm-worklist-total${openTasks === 0 ? " is-clear" : ""}`}>
                    {openTasks === 0 ? "tutto in ordine" : `${openTasks} attività aperte`}
                  </span>
                </div>

                <ul className="dm-worklist">
                  {tasks.map((t) => {
                    const Icon = t.icon;
                    const empty = t.count === 0;
                    return (
                      <li key={t.key}>
                        <Link to={t.to} className="dm-worklist-row" data-tone={empty ? "done" : t.tone}>
                          <span className="dm-worklist-icon"><Icon size={18} aria-hidden="true" /></span>
                          <span className="dm-worklist-count">{t.count}</span>
                          <span className="dm-worklist-text">
                            <span className="dm-worklist-label">{t.label}</span>
                            <span className="dm-worklist-hint">{empty ? "nessun arretrato" : t.hint}</span>
                          </span>
                          <ArrowRight className="dm-worklist-go" size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          </Fade>
        </>
      )}
    </section>
  );
}
