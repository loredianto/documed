import { Fade } from "@/lib/motion";

export function Loading({ label = "Caricamento…" }: { label?: string }) {
  return (
    <div className="d-flex align-items-center gap-2 p-4 text-secondary" role="status">
      <div className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <Fade>
      <div className="alert alert-danger" role="alert">{message}</div>
    </Fade>
  );
}

export function EmptyState({ children }: { children: string }) {
  return (
    <Fade>
      <div className="dm-empty">{children}</div>
    </Fade>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dm-skel-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="placeholder-glow dm-skel-list-row">
          <span className="placeholder flex-grow-1" style={{ height: 14 }} />
          <span className="placeholder" style={{ width: 80, height: 14 }} />
          <span className="placeholder" style={{ width: 64, height: 14 }} />
          <span className="placeholder rounded-pill" style={{ width: 56, height: 20 }} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton della tabella ricoveri (riusa le classi reali per combaciare col layout). */
export function RicoveriTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="table-wrap panel dm-acc-wrap placeholder-glow">
      <table className="dm-accordion dm-skel-table">
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
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><span className="placeholder" style={{ width: 14, height: 14 }} /></td>
              <td>
                <span className="placeholder d-block" style={{ width: "70%", height: 13, marginBottom: 5 }} />
                <span className="placeholder d-block" style={{ width: "45%", height: 10 }} />
              </td>
              <td><span className="placeholder" style={{ width: 70, height: 12 }} /></td>
              <td><span className="placeholder" style={{ width: "85%", height: 12 }} /></td>
              <td><span className="placeholder rounded-pill" style={{ width: 54, height: 20 }} /></td>
              <td><span className="placeholder" style={{ width: 26, height: 18 }} /></td>
              <td>
                <span className="placeholder d-block" style={{ width: 80, height: 13, marginBottom: 6 }} />
                <span className="placeholder rounded" style={{ width: 96, height: 22 }} />
              </td>
              <td><span className="placeholder rounded" style={{ width: 96, height: 30 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton della dashboard: i due pannelli (movimenti + lavoro in sospeso). */
export function DashboardSkeleton() {
  const barHeights = [70, 40, 85, 55, 90, 35];
  return (
    <div className="placeholder-glow">
      <div className="dm-skel-card">
        <span className="placeholder dm-skel-eyebrow" style={{ width: 150 }} />
        <span className="placeholder dm-skel-title" style={{ width: 230 }} />
        <div className="dm-skel-flow">
          <div className="dm-skel-metrics">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dm-skel-metric">
                <span className="placeholder" style={{ width: 44, height: 28 }} />
                <span className="placeholder" style={{ width: 76, height: 11 }} />
              </div>
            ))}
          </div>
          <div className="dm-skel-chart">
            {barHeights.map((h, i) => (
              <span key={i} className="placeholder dm-skel-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="dm-skel-card mt-3">
        <span className="placeholder dm-skel-eyebrow" style={{ width: 120 }} />
        <span className="placeholder dm-skel-title" style={{ width: 190 }} />
        <div className="dm-skel-worklist">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dm-skel-row">
              <span className="placeholder rounded" style={{ width: 36, height: 36 }} />
              <span className="placeholder" style={{ width: 30, height: 26 }} />
              <span className="dm-skel-row-text">
                <span className="placeholder d-block" style={{ width: "40%", height: 13, marginBottom: 6 }} />
                <span className="placeholder d-block" style={{ width: "60%", height: 10 }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
