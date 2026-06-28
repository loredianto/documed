# v1 — con gestione reparto

Snapshot di riferimento dei sorgenti `src/` **prima** della pulizia del
2026-06-28, congelato su richiesta.

Questa versione include le due funzioni poi rimosse dall'app principale:

- **Assegnazione / cambio reparto** del ricovero
  (`components/AssignDepartmentPopover.tsx`, usato in `pages/RicoveriPage.tsx`).
- **Invia documento a reparto** dalla modale documento
  (`components/documentModalParts.tsx`, `components/DocumentModal.tsx`,
  mock in `api/documents.ts`).

È solo un archivio: non è incluso nella build (`tsconfig` → `include: ["src"]`)
e non è avviabile da solo. Per ripristinare una funzione, copiare i file
rilevanti da qui dentro `../../src/`.
