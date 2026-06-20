import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDocumentStatistics } from "../api/documents";
import { getPatientStatistics } from "../api/patients";
import { ErrorMessage, Loading } from "../components/Feedback";
import { DocumentStatistics, DocumentType, PatientStatistics } from "../types";
import { formatDate, readableError } from "../utils/format";

const TYPE_COLORS: Record<DocumentType, string> = {
  IDENTITY_DOCUMENT: "#174b57",
  ADMISSION_FORM: "#d9913b",
  CONSENT_FORM: "#4b8374",
  MEDICAL_REPORT: "#8b5e4a",
  DISCHARGE_DOCUMENT: "#79a5ad",
  OTHER: "#c3b59b",
};

const TYPE_LABELS: Record<DocumentType, string> = {
  IDENTITY_DOCUMENT: "Identità",
  ADMISSION_FORM: "Ricovero",
  CONSENT_FORM: "Consenso",
  MEDICAL_REPORT: "Referto",
  DISCHARGE_DOCUMENT: "Dimissione",
  OTHER: "Altro",
};

export function calculateOcrSuccess(completed: number, failed: number): number {
  const processed = completed + failed;
  return processed === 0 ? 0 : Math.round((completed / processed) * 100);
}

function donutGradient(statistics: DocumentStatistics): string {
  if (statistics.totalDocuments === 0) return "#e1e5e0";
  let cursor = 0;
  const segments = (Object.keys(TYPE_COLORS) as DocumentType[]).map((type) => {
    const start = cursor;
    cursor += ((statistics.documentsByType[type] ?? 0) / statistics.totalDocuments) * 100;
    return `${TYPE_COLORS[type]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${segments.join(",")})`;
}

export function DashboardPage() {
  const [patients, setPatients] = useState<PatientStatistics | null>(null);
  const [documents, setDocuments] = useState<DocumentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [patientResult, documentResult] = await Promise.all([getPatientStatistics(), getDocumentStatistics()]);
      setPatients(patientResult); setDocuments(documentResult);
    } catch (requestError) { setError(readableError(requestError)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const completed = documents?.documentsByOcrStatus.COMPLETED ?? 0;
  const failed = documents?.documentsByOcrStatus.FAILED ?? 0;
  const success = calculateOcrSuccess(completed, failed);
  const maxDaily = useMemo(() => Math.max(1, ...(patients?.lastSevenDays.flatMap((day) => [day.admissions, day.discharges]) ?? [0])), [patients]);

  if (loading) return <Loading label="Calcolo indicatori…" />;

  return (
    <section>
      <header className="page-header with-action">
        <div><span className="eyebrow">Quadro operativo</span><h1>Dashboard</h1><p>Dati aggiornati dai servizi pazienti e documenti.</p></div>
        <button className="button" onClick={() => void load()}>Aggiorna</button>
      </header>
      {error && <ErrorMessage message={error} />}
      {patients && documents && <>
        <div className="stats-grid">
          <StatCard label="Pazienti" value={patients.totalPatients} accent="01" />
          <StatCard label="Ricoveri attivi" value={patients.activeAdmissions} accent="02" />
          <StatCard label="Ingressi oggi" value={patients.admissionsToday} accent="03" />
          <StatCard label="Dimissioni oggi" value={patients.dischargesToday} accent="04" />
          <StatCard label="Documenti" value={documents.totalDocuments} accent="05" />
          <StatCard label="OCR completati" value={completed} accent="06" />
          <StatCard label="OCR falliti" value={failed} accent="07" danger={failed > 0} />
        </div>

        <div className="dashboard-grid">
          <article className="panel chart-panel">
            <header><div><span className="eyebrow">Archivio</span><h2>Documenti per tipologia</h2></div><Link className="text-link" to="/documents">Dettaglio →</Link></header>
            <div className="donut-layout">
              <div className="donut" style={{ background: donutGradient(documents) }}><span><strong>{documents.totalDocuments}</strong>totali</span></div>
              <div className="legend">{(Object.keys(TYPE_COLORS) as DocumentType[]).map((type) => <div key={type}><i style={{ background: TYPE_COLORS[type] }} /><span>{TYPE_LABELS[type]}</span><strong>{documents.documentsByType[type] ?? 0}</strong></div>)}</div>
            </div>
          </article>

          <article className="panel chart-panel daily-panel">
            <header><div><span className="eyebrow">Ultimi 7 giorni</span><h2>Ingressi e dimissioni</h2></div></header>
            <div className="bars" aria-label="Ingressi e dimissioni degli ultimi sette giorni">{patients.lastSevenDays.map((day) => (
              <div className="bar-day" key={day.date} title={`${formatDate(day.date)}: ${day.admissions} ingressi, ${day.discharges} dimissioni`}>
                <div className="bar-pair"><i className="bar admissions" style={{ "--bar-height": `${(day.admissions / maxDaily) * 100}%` } as CSSProperties}><span>{day.admissions}</span></i><i className="bar discharges" style={{ "--bar-height": `${(day.discharges / maxDaily) * 100}%` } as CSSProperties}><span>{day.discharges}</span></i></div>
                <small>{new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(new Date(`${day.date}T00:00:00`))}</small>
              </div>
            ))}</div>
            <div className="chart-key"><span><i className="admission-key" />Ingressi</span><span><i className="discharge-key" />Dimissioni</span></div>
          </article>

          <article className="panel chart-panel success-panel">
            <header><div><span className="eyebrow">Qualità elaborazione</span><h2>Successo OCR</h2></div></header>
            <div className="success-gauge" style={{ "--success": success } as CSSProperties}><span><strong>{success}%</strong>su {completed + failed} elaborati</span></div>
            <p>{completed + failed === 0 ? "Non ci sono ancora elaborazioni concluse." : `${completed} completate e ${failed} fallite.`}</p>
          </article>
        </div>
      </>}
    </section>
  );
}

function StatCard({ label, value, accent, danger = false }: { label: string; value: number; accent: string; danger?: boolean }) {
  return <article className={`stat-card panel${danger ? " stat-danger" : ""}`}><span>{accent}</span><strong>{value}</strong><p>{label}</p></article>;
}
