import { useState } from "react";
import { Dropdown, DropdownMenu, DropdownToggle, LinkList, LinkListItem } from "design-react-kit";
import { CheckCircle2, ChevronDown, FileText, FolderPlus, Send } from "lucide-react";
import { forwardDocumentToDepartment, saveDocumentToRecord } from "../api/documents";
import { readableError } from "../utils/format";
import { FieldDef } from "../utils/ocrSchema";

/**
 * Bottone "Invia a reparto" con dropdown Designers Italia integrato: un solo
 * controllo invece di select + bottone. Aprendolo si scelgono i reparti e la
 * selezione esegue subito l'invio (una decisione = un'azione).
 */
function ForwardDepartmentButton({
  departments,
  busy,
  onSelect,
}: {
  departments: string[];
  busy: boolean;
  onSelect: (department: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      isOpen={open}
      toggle={() => !busy && setOpen((o) => !o)}
      className="dm-dept-dropdown"
    >
      <DropdownToggle color="" className="btn btn-outline-primary dm-forward-toggle">
        <Send size={16} aria-hidden="true" />
        {busy ? "Invio…" : "Invia a reparto"}
        <ChevronDown size={15} aria-hidden="true" className="dm-forward-caret" />
      </DropdownToggle>
      {/* strategy/container sono inoltrati a reactstrap ma non tipizzati da design-react-kit:
          'fixed' + portal su body evitano il clipping dentro la modale scrollabile. */}
      <DropdownMenu
        className="dm-dept-menu"
        {...({ strategy: "fixed", container: "body" } as object)}
      >
        <LinkList header={<span className="dm-dept-menu-title">Scegli il reparto destinatario</span>}>
          {departments.map((d) => (
            <LinkListItem
              key={d}
              inDropdown
              onClick={() => {
                setOpen(false);
                onSelect(d);
              }}
            >
              {d}
            </LinkListItem>
          ))}
        </LinkList>
      </DropdownMenu>
    </Dropdown>
  );
}

/** Indicatore di avanzamento a step (numero variabile di step). */
export function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <ol className="dm-stepper">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "todo";
        return (
          <li key={label} className={`dm-step ${state}`}>
            <span className="dm-step-num">{n}</span>
            <span className="dm-step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Anteprima del documento: immagine se disponibile, altrimenti placeholder. */
export function DocPreview({ filename, url }: { filename: string; url: string | null }) {
  return (
    <div className="dm-doc-preview">
      {url ? (
        <img src={url} alt={`Anteprima di ${filename}`} />
      ) : (
        <div className="dm-doc-preview-placeholder">
          <FileText size={48} aria-hidden="true" />
          <span>{filename}</span>
          <small>Anteprima non disponibile</small>
        </div>
      )}
    </div>
  );
}

/** "DD/MM/YYYY" ↔ "YYYY-MM-DD" per il controllo <input type="date">. */
const itToIso = (s: string) => (/^\d{2}\/\d{2}\/\d{4}$/.test(s) ? s.split("/").reverse().join("-") : "");
const isoToIt = (s: string) => (s ? s.split("-").reverse().join("/") : "");

/**
 * Campi della versione digitale, guidati dallo schema della tipologia.
 * Le date dedotte dalla lettura del documento (valore presente) sono correggibili con un date
 * picker; quelle marcate `editable` (es. data firma) lo sono sempre. Le date non rilevate
 * restano in sola lettura ("—").
 */
export function FieldsEditor({
  defs,
  values,
  onChange,
  readOnly,
}: {
  defs: FieldDef[];
  values: Record<string, string>;
  onChange?: (key: string, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <dl className="dm-ocr-fields dm-fields-editor">
      {defs.map((def) => {
        const value = values[def.key] ?? "";
        // Una data è correggibile se sempre editabile (es. data firma) o se dedotta dall'OCR (ha un valore).
        const editableDate = def.kind === "date" && !readOnly && (def.editable || value !== "");
        const locked = readOnly || (def.kind === "date" && !editableDate);
        return (
          <div key={def.key}>
            <dt>{def.label}</dt>
            {editableDate ? (
              <input
                type="date"
                className="form-control form-control-sm"
                value={itToIso(value)}
                aria-label={def.label}
                onChange={(e) => onChange?.(def.key, isoToIt(e.target.value))}
              />
            ) : locked ? (
              <dd className={def.kind === "date" && !readOnly ? "dm-field-locked" : undefined}>
                {value || "—"}
              </dd>
            ) : (
              <input
                className="form-control form-control-sm"
                value={value}
                aria-label={def.label}
                onChange={(e) => onChange?.(def.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </dl>
  );
}

/** Azioni finali: aggiungi a cartella clinica / manda a reparto. */
export function FileActions({
  docId,
  departments,
  compact = false,
}: {
  docId: string;
  departments: string[];
  /** Layout inline e compatto, pensato per il footer della modale. */
  compact?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [forwardedTo, setForwardedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveDocumentToRecord(docId);
      setSaved(true);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setSaving(false);
    }
  }
  async function forward(department: string) {
    setForwarding(true);
    setError(null);
    try {
      await forwardDocumentToDepartment(docId, department);
      setForwardedTo(department);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setForwarding(false);
    }
  }

  if (compact) {
    return (
      <div className="dm-footer-actions">
        {error && <span className="dm-footer-error" role="alert">{error}</span>}
        {saved ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> In cartella clinica</span>
        ) : (
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            disabled={saving}
            onClick={() => void save()}
          >
            <FolderPlus size={16} aria-hidden="true" /> {saving ? "Aggiunta…" : "Cartella Clinica"}
          </button>
        )}
        {forwardedTo ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> Inviato a {forwardedTo}</span>
        ) : (
          <ForwardDepartmentButton
            departments={departments}
            busy={forwarding}
            onSelect={(d) => void forward(d)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="dm-modal-action-grid">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="dm-action-card">
        <FolderPlus size={20} aria-hidden="true" />
        <div>
          <strong>Aggiungi a cartella clinica</strong>
          <small>Archivia la versione digitale nel fascicolo del paziente.</small>
        </div>
        {saved ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> Aggiunto</span>
        ) : (
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "Aggiunta…" : "Aggiungi"}
          </button>
        )}
      </div>

      <div className="dm-action-card">
        <Send size={20} aria-hidden="true" />
        <div>
          <strong>Manda a reparto</strong>
          <small>Inoltra il documento al reparto destinatario.</small>
        </div>
        {forwardedTo ? (
          <span className="dm-ocr-done"><CheckCircle2 size={16} aria-hidden="true" /> Inviato a {forwardedTo}</span>
        ) : (
          <ForwardDepartmentButton
            departments={departments}
            busy={forwarding}
            onSelect={(d) => void forward(d)}
          />
        )}
      </div>
    </div>
  );
}
