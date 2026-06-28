import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, BedDouble } from "lucide-react";

const POPOVER_WIDTH = 300;

interface Props {
  /** Reparto attuale del ricovero (per default "Pronto Soccorso"). */
  current: string;
  /** Reparti di degenza selezionabili. */
  departments: string[];
  /** Disabilita il controllo (es. ricovero già dimesso). */
  disabled?: boolean;
  onAssign: (department: string) => void;
}

/**
 * Assegnazione/trasferimento del ricovero a un reparto di degenza.
 * Apre un popover con la select dei reparti e la conferma: alla conferma
 * l'accettazione del reparto destinatario riceve la notifica di arrivo.
 * Finché il paziente è in Pronto Soccorso il controllo invita ad assegnarlo;
 * una volta in reparto consente il trasferimento.
 */
export function AssignDepartmentPopover({ current, departments, disabled = false, onAssign }: Props) {
  const inPS = current === "Pronto Soccorso";
  const wards = departments.filter((d) => d !== "Pronto Soccorso" && d !== current);

  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 8));
    setPos({ top: r.bottom + 8, left });
    setChoice(wards[0] ?? "");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) && popRef.current && !popRef.current.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`dm-assign-btn${inPS ? " is-pending" : ""}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {inPS ? <BedDouble size={15} aria-hidden="true" /> : <ArrowRightLeft size={15} aria-hidden="true" />}
        {inPS ? "Assegna a reparto" : "Trasferisci"}
      </button>

      {open && pos && createPortal(
        <div
          ref={popRef}
          className="dm-popover dm-assign-popover"
          role="dialog"
          aria-label="Assegna a un reparto di degenza"
          style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
          onClick={(e) => e.stopPropagation()}
        >
          <strong className="dm-popover-title">
            {inPS ? "Assegna a un reparto di degenza" : "Trasferisci in un altro reparto"}
          </strong>
          <p className="dm-popover-msg">
            L'accettazione del reparto destinatario riceverà la notifica di arrivo
            del paziente e predisporrà il posto letto.
          </p>

          <label className="dm-assign-field">
            <span>Reparto di degenza</span>
            <select
              className="form-select"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
            >
              {wards.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <div className="dm-popover-actions">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setOpen(false)}>
              Annulla
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!choice}
              onClick={() => {
                setOpen(false);
                if (choice) onAssign(choice);
              }}
            >
              Conferma e notifica
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
