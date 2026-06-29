import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POPOVER_WIDTH = 252;

interface Props {
  /** Icona mostrata nel bottone trigger. */
  icon: ReactNode;
  /** Etichetta accessibile / tooltip del trigger. */
  label: string;
  /** Classi del bottone trigger (icon button). */
  triggerClassName?: string;
  /** Mostra il label come testo accanto all'icona (anziché tooltip). */
  showLabel?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Stile distruttivo per il bottone di conferma (rosso). */
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Icon button che apre un piccolo popover di conferma ancorato al bottone.
 * Il popover è renderizzato in un portal con position:fixed così da non essere
 * mai tagliato dall'overflow della tabella. Si chiude con Esc, click fuori o
 * allo scroll. Ferma la propagazione del click per non attivare l'onClick
 * della riga contenitore (toggle accordion).
 */
export function ConfirmPopover({
  icon,
  label,
  triggerClassName = "dm-icon-btn",
  showLabel = false,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  destructive = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    // bordo destro del popover allineato al bordo destro del trigger
    const left = Math.max(8, r.right - POPOVER_WIDTH);
    setPos({ top: r.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(t) &&
        popRef.current &&
        !popRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
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
        className={`${triggerClassName}${destructive ? " dm-icon-btn-danger" : ""}${showLabel ? "" : " dm-tip-row"}`}
        data-tooltip={showLabel ? undefined : label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {icon}
        {showLabel && <span className="dm-btn-label">{label}</span>}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            className="dm-popover"
            role="dialog"
            aria-label={title}
            style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <strong className="dm-popover-title">{title}</strong>
            <p className="dm-popover-msg">{message}</p>
            <div className="dm-popover-actions">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${destructive ? "btn-danger" : "btn-primary"}`}
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
