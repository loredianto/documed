# Handoff al team Backend — Ricoveri, cartelle cliniche e OCR strutturato

**Data:** 28/06/2026
**Ambito:** solo **front-end**. Nessun servizio backend è stato modificato.
**Stato:** prototipo funzionante in **mock mode** (`VITE_MOCK_MODE=true`).
Questo documento dice **cosa resta uguale**, **cosa cambia / va implementato** e i **contratti** necessari per rendere reale il prototipo quando `VITE_MOCK_MODE` ≠ `true` (il ramo `requestJson(...)` è già predisposto con i path proposti).

Tutte le chiamate vivono in `FrontEnd/documed-frontend/src/api/*`. Interfacce e tipi sono in `src/types.ts`.

---

## Complessità e strategia (leggere prima)

Gli interventi **non sono tutti dello stesso peso**:

- **Quasi tutto è CRUD/query standard**, con contratti già fissati dal front-end → lavoro veloce e a basso rischio: elenco ricoveri (§2.2), attività giornaliera (§2.1), ricerca documenti (§2.3), clinici (§2.4), cancellazioni (§5), campo `filedInRecord` + archiviazione in cartella (§4.1, §6).
- **L'unico intervento davvero complesso è l'OCR strutturato** (§3): OCR + parsing in campi, classificazione della tipologia ed *entity resolution* (aggancio a paziente/medico). È un problema OCR/NLP e vale il grosso dell'effort; tutto il resto sono giorni-uomo prevedibili.

**Punto chiave: il prototipo NON dipende dall'OCR "intelligente".** Il front-end ha già i **fallback manuali**, quindi l'OCR si può consegnare a fasi senza snaturare il flusso:

- la tipologia, se `classification` è assente, ripiega sul `documentType` del caricamento ed è comunque modificabile dall'operatore (select);
- il paziente, se `resolution` è assente, ripiega sul paziente del ricovero (`doc.patientId`) ed è riassegnabile a mano;
- senza `patientMatch` non compare l'avviso "identità da verificare": l'operatore conferma e basta.

### Come gestire l'OCR in MVP

**Fase 1 — MVP (sufficiente per il prototipo).** `POST /api/documents/{id}/ocr` restituisce `ocrStatus`, `extractedText` e un `extraction` con **solo** `title`, `fields` (i campi che si riescono a estrarre, anche pochi) e `bodyText`. `classification` e `resolution` possono restare **assenti/`null`**. L'operatore conferma/corregge tipologia, paziente e medico e salva: il flusso "versione digitale → salva in cartella" funziona già tutto.

**Fase 1.5 — euristica leggera (opzionale, bassa complessità).** Popolare `classification` con semplici regole su parole chiave del testo (es. "dimissione" → LDO, "consenso" → consenso, "referto" → referto) e `status: "REVIEW"`: la UI **propone** e l'operatore **conferma**. Nessun modello ML necessario.

**Fase 2 — entity resolution (valore aggiunto, posticipabile).** Aggiungere `resolution.patientMatch` con il confronto CF/nome letti sul documento contro il paziente del ricovero (`score`, `candidates`): pre-compila i legami e segnala le discordanze. È la parte "intelligente", ma il prototipo gira benissimo anche senza.

> In breve: consegnare prima i CRUD/endpoint semplici (sblocca subito Dashboard, Ricoveri, archivio, cancellazioni e archiviazione in cartella), poi l'OCR in Fase 1, infine 1.5 e 2 come work-stream separato. Anche un OCR minimale che ritorna solo `extractedText` lascia il flusso usabile (l'operatore compila i campi dallo schema della tipologia), ma è preferibile restituire i `fields` già estratti.

---

## 0. Modello concettuale (per allinearsi)

- **Cartella clinica = un singolo ricovero** (`Admission`), identificata dal **numero nosologico**. Un paziente può avere più cartelle (più ricoveri).
- I **documenti** (`PatientDocument`) appartengono a una cartella tramite `admissionId`.
- **`filedInRecord`** distingue i documenti **archiviati nella cartella** (parte del fascicolo) da quelli ancora **in lavorazione** (workflow di acquisizione).
- Il **FSE** è la vista a livello di **cittadino** (chiave = codice fiscale): aggrega i documenti di tutti gli episodi.
- Lato FE: la **scheda paziente** e la **pagina della cartella** mostrano SOLO i documenti con `filedInRecord = true`; quelli non archiviati restano nella pagina **Ricoveri** (workspace).

---

## 1. Cosa NON cambia (contratti già esistenti, usati invariati)

Schemi `Patient`, `Admission`, `PatientDocument`, `PatientStatistics`, `DocumentStatistics` invariati nella forma (vedi §4 per i due **nuovi campi**).

| Metodo | Path | Uso FE |
|--------|------|--------|
| GET  | `/api/patients` | lista pazienti |
| GET  | `/api/patients/{id}` | scheda paziente |
| POST | `/api/patients` | nuovo paziente (JSON `PatientInput`) |
| PUT  | `/api/patients/{id}` | modifica anagrafica (modale) |
| GET  | `/api/patients/{id}/admissions` | ricoveri del paziente |
| POST | `/api/patients/{id}/admissions` | apertura ricovero (`AdmissionInput`) |
| POST | `/api/admissions/{id}/discharge` | dimissione (body `{ dischargeDate }`) |
| GET  | `/api/admissions/{id}` | dettaglio ricovero/cartella |
| GET  | `/api/admissions/{id}/documents` | documenti del ricovero |
| GET  | `/api/patients/statistics` | KPI dashboard |
| GET  | `/api/documents` | elenco documenti |
| GET  | `/api/documents/{id}` | dettaglio documento |
| POST | `/api/admissions/{id}/documents` | upload (multipart) |
| GET  | `/api/documents/{id}/content` | download binario |
| DELETE | `/api/documents/{id}` | elimina documento |
| GET  | `/api/documents/statistics` | conteggi per tipo/stato OCR |
| OAuth2 | `POST /oauth/token` (password grant) | login (vedi `src/api/auth.ts`) |

---

## 2. Cosa cambia / da implementare (nuovi o estesi)

| # | Metodo | Path | Stato |
|---|--------|------|-------|
| 1 | GET  | `/api/patients/statistics/activity?from={ISO}&to={ISO}` | **da creare** |
| 2 | GET  | `/api/admissions` | **da creare** (esiste solo per-paziente) |
| 3 | GET  | `/api/documents/search?query=&patientId=&admissionId=&documentType=&ocrStatus=` | **da creare** |
| 4 | GET  | `/api/clinicians` | **da creare** |
| 5 | POST/GET | `/api/documents/{id}/ocr` → estendere con `extraction` strutturata | **da estendere** |
| 6 | POST | `/api/documents/{id}/file-in-record` | **da creare** |
| 7 | DELETE | `/api/patients/{id}` | **da creare** |
| 8 | DELETE | `/api/admissions/{id}` | **da creare** |

> **Non più necessari** (rimossi dal FE rispetto alla versione precedente di questo documento): l'inoltro documento a reparto (`POST /api/documents/{id}/forward`) e l'elenco reparti (`GET /api/departments`). Sostituiti dal flusso di risoluzione entità (§5) e da `GET /api/clinicians` (§2.4).

### 2.1 Attività giornaliera (dashboard)
`GET /api/patients/statistics/activity?from={ISO}&to={ISO}` → `DailyActivity[]`:
`[{ "date": "2026-06-21", "admissions": 1, "discharges": 0 }, …]`. Estremi inclusivi, granularità giornaliera. Funzione FE: `getActivityRange` (`src/api/patients.ts`).

### 2.2 Elenco ricoveri
`GET /api/admissions` → `Admission[]` (tutti i ricoveri). Idealmente paginabile/filtrabile (`?status=`, `?department=`, `?query=`). Funzione FE: `listAdmissions`.

### 2.3 Ricerca documenti
`GET /api/documents/search` con i filtri opzionali `query` (full-text su nome file/descrizione/testo OCR), `patientId`, `admissionId`, `documentType`, `ocrStatus`. Restituisce `PatientDocument[]`. Funzioni FE: `searchDocuments` / `buildDocumentSearchPath` (`src/api/documents.ts`). Usato dall'archivio per-paziente (`/documents?patientId=`) e per-ricovero (`/documents?admissionId=`).

### 2.4 Clinici/medici
`GET /api/clinicians` → `Clinico[]` (`{ id, name, department }`). Popolano la select "Medico firmatario" nella versione digitale. Funzione FE: `listClinicians` (`src/api/clinicians.ts`).

---

## 3. OCR strutturato — contratto chiave (estensione §5 della tabella)

`POST /api/documents/{id}/ocr` e `GET /api/documents/{id}/ocr` devono restituire, oltre al testo grezzo, un oggetto **`extraction`** ricco. È la parte più importante del lavoro backend.

```jsonc
{
  "documentId": "doc-001",
  "ocrStatus": "COMPLETED",                 // PENDING | PROCESSING | COMPLETED | FAILED
  "extractedText": "…",                     // testo grezzo (già presente)
  "extraction": {                            // NUOVO oggetto strutturato (null finché non COMPLETED)
    "title": "Proposta di ricovero programmato",
    "fields": [                              // chiave/valore, dipende dal documentType
      { "key": "patientName", "label": "Paziente", "value": "Marco Rossi", "confidence": 0.98, "source": "ocr" },
      { "key": "fiscalCode",  "label": "Codice fiscale", "value": "RSSMRC80A01H501W", "confidence": 0.95, "source": "ocr" }
    ],
    "bodyText": "…",                          // testo libero, opzionale

    "classification": {                       // tipologia DEDOTTA dall'OCR
      "type": "ADMISSION_FORM",               // DocumentType | null
      "confidence": 0.91,
      "status": "AUTO",                       // AUTO (applicata) | REVIEW (incerta) | CONFIRMED (confermata operatore)
      "candidates": [ { "type": "ADMISSION_FORM", "confidence": 0.91 }, { "type": "OTHER", "confidence": 0.2 } ]
    },

    "resolution": {                           // legami entità + verifica identità
      "patientId": 1,
      "doctorId": 2,
      "admissionId": 101,
      "patientMatch": {
        "status": "MATCHED",                  // MATCHED | REVIEW | UNRESOLVED
        "score": 1,
        "extractedName": "Marco Rossi",       // identità letta sul documento
        "extractedFiscalCode": "RSSMRC80A01H501W",
        "candidates": [1]                     // patientId proposti, ordinati per score
      }
    }
  },
  "ocrErrorMessage": null,
  "processedAt": "2026-06-15T09:05:00Z"
}
```

Note:
- I tipi sono in `src/types.ts`: `OcrField`, `OcrExtraction`, `TypeClassification`, `DocumentResolution`, `MatchStatus`, `FieldSource`.
- La **mappatura `documentType → campi attesi`** (chiavi canoniche dei `fields`) è definita lato FE in `src/utils/ocrSchema.ts` (`DOC_TYPE_FIELDS`/`DOC_TYPE_TITLES`): **allineare** le chiavi (`patientName`, `fiscalCode`, `department`, `admissionDate`, `dischargeDate`, …).
- `patientMatch` confronta CF/nome letti col paziente del ricovero: `MATCHED` se il CF coincide, `REVIEW` se diverso, `UNRESOLVED` se assente. Guida l'avviso "identità da verificare" in UI.
- Documenti con `ocrStatus = FAILED` sono mostrati in dashboard come "OCR da rilavorare" e riprocessabili dalla riga documento.

---

## 4. Nuovi campi sugli schemi esistenti

### 4.1 `PatientDocument.filedInRecord: boolean` (NUOVO)
- Indica se la versione digitale è **archiviata in cartella clinica**. Va restituito da tutte le GET sui documenti.
- `POST /api/documents/{id}/file-in-record` (idempotente) lo porta a `true`; valutare anche `filedAt`. Funzione FE: `saveDocumentToRecord`.
- Impatto UI: scheda paziente e pagina cartella filtrano su `filedInRecord = true`; il resto resta nel workspace Ricoveri.

### 4.2 `PatientDocument.ocrExtraction: OcrExtraction | null`
- Già introdotto: incorpora `extraction` di §3 sul documento (oltre che nella risposta OCR).

### 4.3 `Admission.notes` — nosologico/regime/disciplina
- Numero nosologico, regime (RO/DH/DS/elettivo) e codice disciplina ministeriale sono oggi **testo dentro `notes`** (nessun campo dedicato). Il FE li estrae con `parseAdmissionMeta` (`src/utils/records.ts`).
- Se in futuro il backend vuole strutturarli (campi dedicati), concordare prima: oggi NON è richiesto, lo schema `Admission` resta invariato.

---

## 5. Eliminazioni (cancellazione record)

- `DELETE /api/patients/{id}` — elimina un'anagrafica dalla rubrica (azione in lista pazienti, disabilitata se ricovero attivo). Funzione FE: `deletePatient`.
- `DELETE /api/admissions/{id}` — già previsto lato FE (`deleteAdmission`), endpoint da creare.

---

## File front-end di riferimento

- `src/types.ts` — tipi: `OcrField`, `OcrExtraction`, `TypeClassification`, `DocumentResolution`, `DailyActivity`; campi `ocrExtraction` e **`filedInRecord`** su `PatientDocument`.
- `src/api/patients.ts` — `listAdmissions`, `getActivityRange`, `deletePatient`, `deleteAdmission`.
- `src/api/documents.ts` — OCR strutturato, `searchDocuments`/`buildDocumentSearchPath`, `saveDocumentToRecord`.
- `src/api/clinicians.ts` — `listClinicians`.
- `src/utils/ocrSchema.ts` — mappatura tipo documento → campi.
- `src/utils/records.ts` — `parseAdmissionMeta`, stato paziente, cartelle.
- `src/pages/` — `DashboardPage`, `RicoveriPage`, `PatientsPage`, `PatientDetailPage`, `AdmissionDetailPage`, `DocumentsPage`.

> Le funzioni mock contengono già il ramo `requestJson(...)` con i path proposti: al passaggio a backend reale basterà che gli endpoint rispettino i contratti sopra.
