/** Intervallo temporale selezionato, condiviso da Dashboard e Ricoveri. */
export interface Range {
  from: string;   // datetime-local "YYYY-MM-DDTHH:mm"
  to: string;
  preset: string; // chiave del preset attivo, o "custom"
}

function pad(n: number): string { return String(n).padStart(2, "0"); }

export function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ultimi `days` giorni fino a oggi (estremi inclusi). */
export function lastDays(days: number): Range {
  const to = new Date();   to.setHours(23, 59, 0, 0);
  const from = new Date(); from.setDate(from.getDate() - (days - 1)); from.setHours(0, 0, 0, 0);
  return { from: toLocalInput(from), to: toLocalInput(to), preset: String(days) };
}

/** Solo oggi. */
export function todayRange(): Range {
  const from = new Date(); from.setHours(0, 0, 0, 0);
  const to = new Date();   to.setHours(23, 59, 0, 0);
  return { from: toLocalInput(from), to: toLocalInput(to), preset: "oggi" };
}

export const PERIOD_PRESETS: { key: string; label: string; build: () => Range }[] = [
  { key: "oggi", label: "Oggi", build: todayRange },
  { key: "7",    label: "7g",   build: () => lastDays(7) },
  { key: "14",   label: "14g",  build: () => lastDays(14) },
  { key: "30",   label: "30g",  build: () => lastDays(30) },
];

/** Estremi in millisecondi, per i confronti di appartenenza al periodo. */
export function rangeBounds(r: Range): { fromMs: number; toMs: number } {
  return { fromMs: new Date(r.from).getTime(), toMs: new Date(r.to).getTime() };
}
