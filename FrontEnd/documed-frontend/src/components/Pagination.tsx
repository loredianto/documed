import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  /** Pagina corrente (1-based). */
  page: number;
  /** Numero totale di pagine. */
  pageCount: number;
  onChange: (page: number) => void;
}

/** Costruisce la sequenza di pagine con ellissi (es. 1 … 4 5 6 … 20). */
function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

/** Paginazione coerente con i token (riutilizzabile). Non si mostra con una sola pagina. */
export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;
  const pages = buildPages(page, pageCount);

  return (
    <nav className="dm-pagination" aria-label="Paginazione">
      <button
        type="button"
        className="dm-page-btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Pagina precedente"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="dm-page-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`dm-page-btn${p === page ? " is-active" : ""}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="dm-page-btn"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Pagina successiva"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
