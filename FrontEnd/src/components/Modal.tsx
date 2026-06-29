import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "full";
}

/** Modale riutilizzabile: overlay, chiusura con Esc o click sullo sfondo, blocco scroll body. */
export function Modal({ title, onClose, children, size = "md" }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="dm-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`dm-modal dm-modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="dm-modal-head">
          <h2>{title}</h2>
          <button type="button" className="dm-modal-close" onClick={onClose} aria-label="Chiudi">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="dm-modal-body">{children}</div>
      </div>
    </div>
  );
}
