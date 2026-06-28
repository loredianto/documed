import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Clinico, DocumentType, OcrExtraction, Patient, PatientDocument } from "../types";
import { DocPreview, FieldsEditor, FileActions } from "./documentModalParts";
import { documentTypeLabel } from "./DocumentList";
import {
  DOC_TYPE_FIELDS,
  DOC_TYPE_TITLES,
  extractionToValues,
  valuesToFields,
} from "../utils/ocrSchema";

const DOCUMENT_TYPES: DocumentType[] = [
  "IDENTITY_DOCUMENT", "ADMISSION_FORM", "CONSENT_FORM",
  "MEDICAL_REPORT", "DISCHARGE_DOCUMENT", "OTHER",
];

interface Props {
  document: PatientDocument;
  mode: "view" | "scan";
  departments: string[];
  patients: Patient[];
  clinicians: Clinico[];
  onProcessed: (extraction: OcrExtraction, documentType: DocumentType) => void;
  onClose: () => void;
}

/**
 * Modale documento a schermata singola (full-height): anteprima + dati riconosciuti.
 * - mode "scan": si parte in editing. La prima cosa è la TIPOLOGIA (select): cambiandola
 *   cambia l'insieme dei campi mostrati, ma i valori condivisi già letti (nome, codice
 *   fiscale, …) restano perché conservati per chiave canonica. Le date sono in sola lettura.
 *   Dopo "Conferma e salva" la modale passa a sola lettura con le azioni di archiviazione.
 * - mode "view": versione digitale già in sola lettura, con le azioni disponibili.
 * La scansione OCR è già avvenuta a monte (dal bottone nella riga).
 */
export function DocumentModal({ document: doc, mode, departments, patients, clinicians, onProcessed, onClose }: Props) {
  const classification = doc.ocrExtraction?.classification;
  const patientMatch = doc.ocrExtraction?.resolution?.patientMatch;
  // La tipologia parte da quella dedotta dall'OCR; resta correggibile (è la conferma operatore).
  const [docType, setDocType] = useState<DocumentType>(classification?.type ?? doc.documentType);
  // Risoluzione entità: paziente e medico sono LEGAMI (select), non testo libero.
  const [patientId, setPatientId] = useState<number | null>(
    doc.ocrExtraction?.resolution?.patientId ?? doc.patientId ?? null,
  );
  const [doctorId, setDoctorId] = useState<number | null>(
    doc.ocrExtraction?.resolution?.doctorId ?? null,
  );
  const [values, setValues] = useState<Record<string, string>>(
    () => extractionToValues(doc.ocrExtraction?.fields ?? []),
  );
  const [view, setView] = useState(mode === "view");
  const [justSaved, setJustSaved] = useState(false);
  const editable = !view;

  // Candidati suggeriti dall'OCR in cima alla select, poi gli altri pazienti in ordine alfabetico.
  const candidateIds = patientMatch?.candidates ?? [];
  const orderedPatients = [...patients].sort((a, b) => {
    const ai = candidateIds.indexOf(a.id);
    const bi = candidateIds.indexOf(b.id);
    const ar = ai === -1 ? Infinity : ai;
    const br = bi === -1 ? Infinity : bi;
    return ar - br || a.lastName.localeCompare(b.lastName);
  });
  const assignedPatient = patients.find((p) => p.id === patientId) ?? null;
  const assignedDoctor = clinicians.find((c) => c.id === doctorId) ?? null;
  const movedToOtherPatient = patientId !== null && patientId !== doc.patientId;
  // Nei campi "letti sul documento" il nome paziente è sostituito dalla select Paziente.
  const readDefs = DOC_TYPE_FIELDS[docType].filter((d) => d.key !== "patientName");

  // Esito della verifica identità, mostrato come icona con tooltip accanto al campo Paziente
  // (niente più riga-banner dedicata nella modale).
  function patientCheck() {
    if (!patientMatch || movedToOtherPatient) return null;
    if (patientMatch.status === "MATCHED") {
      return (
        <span
          className="dm-field-check dm-field-check-ok"
          data-tip="Paziente confermato dall'identità sul documento"
          aria-label="Paziente confermato dall'identità sul documento"
        >
          <CheckCircle2 size={15} aria-hidden="true" />
        </span>
      );
    }
    const msg = `Identità da verificare — sul documento risulta ${patientMatch.extractedName ?? "—"} (${patientMatch.extractedFiscalCode ?? "—"}). Conferma il paziente o spostalo ad un altro.`;
    return (
      <span className="dm-field-check dm-field-check-warn" data-tip={msg} aria-label={msg}>
        <AlertTriangle size={15} aria-hidden="true" />
      </span>
    );
  }

  function handleSave() {
    const baseRes = doc.ocrExtraction?.resolution;
    onProcessed(
      {
        title: DOC_TYPE_TITLES[docType],
        fields: valuesToFields(values, docType),
        bodyText: doc.ocrExtraction?.bodyText ?? null,
        classification: classification ? { ...classification, type: docType, status: "CONFIRMED" } : undefined,
        resolution: {
          patientId,
          doctorId,
          admissionId: baseRes?.admissionId ?? doc.admissionId ?? null,
          patientMatch: baseRes?.patientMatch ?? {
            status: "UNRESOLVED",
            score: 0,
            extractedName: null,
            extractedFiscalCode: null,
            candidates: [],
          },
        },
      },
      docType,
    );
    setView(true);
    setJustSaved(true);
  }

  return (
    <div className="dm-scan-layout">
      <div className="dm-scan-body">
        {justSaved && (
          <div className="dm-save-banner" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            Versione digitale salvata. Scegli dove archiviarla o a quale reparto inoltrarla.
          </div>
        )}
        <div className="dm-doc-modal-split">
          <DocPreview filename={doc.originalFilename} url={null} />
          <div className="dm-doc-modal-detail">
            <div className="dm-modal-patient">
              <span className="dm-modal-patient-label">Paziente assegnato</span>
              <strong>{assignedPatient ? `${assignedPatient.lastName} ${assignedPatient.firstName}` : "—"}</strong>
              {patientCheck()}
            </div>

            <span className="dm-ocr-digital-eyebrow">
              {editable ? "Dati riconosciuti · correggi se necessario" : "Versione digitale · OCR"}
            </span>

            {editable ? (
              <label className="dm-doc-type-field">
                <span>Tipologia documento</span>
                <select
                  className="form-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{documentTypeLabel(t)}</option>
                  ))}
                </select>
                {classification && (
                  <small className="text-muted">
                    Tipologia rilevata dall'OCR · {Math.round(classification.confidence * 100)}%
                    {classification.status === "REVIEW" ? " · conferma o correggi" : ""}
                  </small>
                )}
              </label>
            ) : (
              <h3>{DOC_TYPE_TITLES[docType]}</h3>
            )}

            {editable ? (
              <>
                <dl className="dm-ocr-fields">
                  <div>
                    <dt>Paziente</dt>
                    <select
                      className="form-select form-select-sm"
                      aria-label="Paziente"
                      value={patientId ?? ""}
                      onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : null)}
                    >
                      {orderedPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.lastName} {p.firstName} · {p.fiscalCode}
                          {candidateIds.includes(p.id) ? " · suggerito" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <dt>Medico firmatario</dt>
                    <select
                      className="form-select form-select-sm"
                      aria-label="Medico firmatario"
                      value={doctorId ?? ""}
                      onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">— Non firmato da un medico —</option>
                      {clinicians.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} · {c.department}</option>
                      ))}
                    </select>
                  </div>
                </dl>
                {movedToOtherPatient && (
                  <small className="text-muted dm-moved-note">Documento spostato dal paziente del ricovero a questo paziente.</small>
                )}
                <FieldsEditor
                  defs={readDefs}
                  values={values}
                  readOnly={false}
                  onChange={(key, val) => setValues((v) => ({ ...v, [key]: val }))}
                />
              </>
            ) : (
              <>
                <dl className="dm-ocr-fields">
                  <div>
                    <dt>Paziente</dt>
                    <dd>{assignedPatient ? `${assignedPatient.lastName} ${assignedPatient.firstName}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Medico firmatario</dt>
                    <dd>{assignedDoctor ? assignedDoctor.name : "—"}</dd>
                  </div>
                </dl>
                <FieldsEditor defs={readDefs} values={values} readOnly onChange={() => {}} />
              </>
            )}

            {!editable && doc.ocrExtraction?.bodyText && (
              <p className="dm-ocr-body">{doc.ocrExtraction.bodyText}</p>
            )}
          </div>
        </div>
      </div>

      <footer className="dm-scan-footer">
        <button type="button" className="btn dm-footer-close" onClick={onClose}>
          Chiudi
        </button>
        <div className="dm-scan-footer-actions">
          {editable ? (
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Conferma e salva
            </button>
          ) : (
            <FileActions docId={doc.id} departments={departments} compact />
          )}
        </div>
      </footer>
    </div>
  );
}
