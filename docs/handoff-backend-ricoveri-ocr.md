# Handoff backend — ricoveri, cartelle cliniche e OCR strutturato

**Stato aggiornato:** il frontend usa solo chiamate reali al backend tramite Auth
Gateway. Non esiste più una modalità dati locale nel codice runtime.

## Endpoint usati dal frontend

| Metodo | Path | Uso |
|---|---|---|
| `GET` | `/api/patients` | lista pazienti |
| `GET` | `/api/patients/{id}` | scheda paziente |
| `POST` | `/api/patients` | nuovo paziente |
| `PUT` | `/api/patients/{id}` | modifica paziente |
| `DELETE` | `/api/patients/{id}` | eliminazione paziente |
| `GET` | `/api/patients/{id}/admissions` | ricoveri paziente |
| `POST` | `/api/patients/{id}/admissions` | apertura ricovero |
| `GET` | `/api/admissions` | elenco ricoveri |
| `GET` | `/api/admissions/{id}` | dettaglio ricovero |
| `DELETE` | `/api/admissions/{id}` | eliminazione ricovero |
| `POST` | `/api/admissions/{id}/discharge` | dimissione |
| `GET` | `/api/patients/statistics` | KPI dashboard |
| `GET` | `/api/patients/statistics/activity` | ingressi/dimissioni per periodo |
| `GET` | `/api/clinicians` | medici firmatari selezionabili |
| `GET` | `/api/documents` | elenco documenti |
| `GET` | `/api/documents/search` | ricerca documenti |
| `GET` | `/api/documents/{id}` | dettaglio documento |
| `POST` | `/api/admissions/{id}/documents` | upload documento |
| `GET` | `/api/documents/{id}/content` | download/anteprima file |
| `POST` | `/api/documents/{id}/ocr` | esecuzione OCR |
| `GET` | `/api/documents/{id}/ocr` | stato/testo OCR |
| `PATCH` | `/api/documents/{id}/ocr` | conferma tipologia e struttura OCR |
| `POST` | `/api/documents/{id}/file-in-record` | archiviazione in cartella |
| `DELETE` | `/api/documents/{id}` | eliminazione documento |
| `GET` | `/api/documents/statistics` | statistiche documenti/OCR |

## Regole funzionali

- `filedInRecord=true` indica che il documento è effettivamente nella cartella
  clinica del ricovero.
- La dashboard considera incompleta una cartella clinica attiva se mancano in
  cartella i documenti obbligatori: identità, modulo di ricovero, consenso.
- La tipologia proposta dall'OCR può essere corretta dall'operatore; il salvataggio
  avviene con `PATCH /api/documents/{id}/ocr`.
- I documenti non archiviati restano nel workspace Ricoveri e non compaiono nel
  fascicolo/cartella del paziente.
