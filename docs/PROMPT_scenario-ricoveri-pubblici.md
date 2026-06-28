# Prompt per Claude Code — Adattamento al caso d'uso "Ospedale Pubblico · Ufficio Accettazione Ricoveri"

> Da incollare in Claude Code, eseguito nella root del progetto `documed`.
> Obiettivo: adattare **dati mock + microcopy** allo scenario reale di un'azienda
> ospedaliera pubblica (SSN) — registrazione dei **ricoveri programmati** e
> acquisizione documentale via OCR confluente nel **Fascicolo Sanitario
> Elettronico (FSE 2.0)** — **senza alterare la struttura del prodotto**.
> Nota trasversale: **il Pronto Soccorso NON esiste in questo scenario.** Nessun
> clinico, ricovero, documento, stringa o stile deve fare riferimento al PS.

---

# PARTE 1 — DATI MOCK

## OBIETTIVO
Adatta i SOLI DATI MOCK del frontend allo scenario di un'AZIENDA OSPEDALIERA
PUBBLICA italiana (SSN): gestione dei RICOVERI PROGRAMMATI/ELETTIVI con
acquisizione documentale via OCR confluente nel FSE 2.0. Solo valori realistici +
nomenclatura corretta. Niente Pronto Soccorso.

## VINCOLO ASSOLUTO — NON ALTERARE LA STRUTTURA
- Modifica ESCLUSIVAMENTE: `FrontEnd/documed-frontend/src/api/mock-data.ts`
- NON toccare `src/types.ts`: interfacce, type, enum (DocumentType, OcrStatus,
  AdmissionStatus, MatchStatus, FieldSource...) restano identici.
- NON modificare componenti, pagine, `api/`, `utils/`, né firme/nomi degli export
  (MOCK_PATIENTS, MOCK_ADMISSIONS, MOCK_DOCUMENTS, MOCK_CLINICIANS,
  MOCK_DAILY_ACTIVITY, MOCK_STATISTICS, MOCK_DOC_STATISTICS).
- Mantieni stessi nomi di campo, stessa forma degli oggetti, stesso schema di id e
  all'incirca lo stesso numero di record.
- Le statistiche derivate (MOCK_STATISTICS, MOCK_DOC_STATISTICS) sono CALCOLATE
  dagli array: non hardcodare i totali. Aggiorna solo i campi davvero fissi
  (es. admissionsToday/dischargesToday) per coerenza con le date.

## COSA RENDERE REALISTICO (solo valori)
1. **PAZIENTI**: nomi italiani plausibili; CODICE FISCALE VALIDO e coerente con
   nome/sesso/data di nascita/comune (calcola il carattere di controllo). Il CF è
   la chiave identificativa del cittadino nel FSE: deve essere corretto.
2. **RICOVERI (Admission)**: modella i veri REGIMI DI RICOVERO del SSN ed
   esplicitali nel campo `notes` (non esiste un campo dedicato, quindi usa notes):
   - Ricovero Ordinario programmato (RO), Day Hospital (DH), Day Surgery (DS),
     Ricovero elettivo. **NESSUN ricovero urgente da Pronto Soccorso.**
   - In `notes` includi anche: numero nosologico, disciplina di ricovero con il
     relativo codice disciplina ministeriale (es. 08 Cardiologia,
     36 Ortopedia e traumatologia, 26 Medicina generale, 09 Chirurgia generale,
     58 Gastroenterologia, 32 Neurologia, 64 Oncologia, 68 Pneumologia).
   - `department` = denominazione corretta dell'Unità Operativa/disciplina
     (**mai "Pronto Soccorso"**).
   - Date coerenti (admissionDate ≤ dischargeDate) e con oggi (giugno 2026).
3. **CLINICI (MOCK_CLINICIANS)**: ruoli reali (es. "Medico accettante",
   "Dirigente medico"); `department` combacia con i reparti dei ricoveri.
   **Rimuovi il clinico associato al Pronto Soccorso** (oggi id 6,
   "Dott.ssa Anna Ricci · Pronto Soccorso") e riassegnalo a una disciplina
   programmata reale (es. Medicina generale o Gastroenterologia).
4. **DOCUMENTI (PatientDocument)**: l'enum DocumentType NON cambia, ma fai sì che
   description/originalFilename/ocrExtraction riflettano le vere CLASSI
   DOCUMENTALI del FSE 2.0 (standard HL7 CDA R2). Mappa così:
   - DISCHARGE_DOCUMENT → "Lettera di Dimissione Ospedaliera (LDO)" con allegata
     Scheda di Dimissione Ospedaliera (SDO): diagnosi principale/secondarie in
     ICD-9-CM e DRG.
   - MEDICAL_REPORT → "Referto" di radiologia/laboratorio (CDA R2).
   - ADMISSION_FORM → "Proposta/Modulo di accettazione del ricovero" (proposta del
     medico curante / accettazione amministrativa). **Niente "Verbale di Pronto
     Soccorso": il documento doc-009 va riconvertito** in una proposta/modulo di
     ricovero programmato.
   - CONSENT_FORM → "Consenso informato" e/o "Consenso al trattamento dei dati e
     all'alimentazione/consultazione del FSE".
   - IDENTITY_DOCUMENT → Carta d'Identità Elettronica (CIE) o Tessera Sanitaria;
     nei campi OCR evidenzia il codice fiscale come chiave FSE.
   - OTHER → "Profilo Sanitario Sintetico (Patient Summary)" del MMG, o proposta di
     ricovero del medico curante.
5. **ESTRAZIONI OCR (OcrExtraction)**: label realistiche, es. Numero nosologico,
   Regime di ricovero, Disciplina/Reparto, Codice disciplina, Diagnosi principale
   (ICD-9-CM), DRG, Medico accettante, Medico di Medicina Generale,
   Azienda Ospedaliera/Presidio. `bodyText` ed `extractedText` con prosa clinica
   verosimile e coerente col tipo di documento (mai riferita al PS).

## COERENZA REFERENZIALE (obbligatoria)
- Ogni document.patientId e document.admissionId puntano a record esistenti e
  coerenti (paziente del documento = paziente del ricovero collegato).
- admission.department combacia con il department del clinico citato.
- Nome e codice fiscale letti dall'OCR coincidono col paziente reale.
- MOCK_DAILY_ACTIVITY coerente con admissionDate/dischargeDate dei ricoveri.
- Date plausibili rispetto a oggi (giugno 2026; FSE 2.0 in vigore dal 31/03/2026).
- **Nessuna occorrenza della stringa "Pronto Soccorso" in tutto il file.**

## COMMENTI
Aggiungi brevi commenti in italiano accanto ai valori che introducono termini
tecnici (SDO, DRG, LDO, regime di ricovero, codice disciplina, FSE), così il file
resta leggibile e difendibile in una tesi.

---

# PARTE 2 — MICROCOPY, RUOLO UTENTE E BRANDING

Stesso vincolo: non cambiare interfacce, type, enum, né lo schema dati. Qui si
interviene su STRINGHE D'INTERFACCIA + un'UNICA regola di business autorizzata
(punto 3). Tutto deve riflettere l'utente reale: un'operatrice dell'UFFICIO
ACCETTAZIONE RICOVERI di un OSPEDALE PUBBLICO che gestisce ricoveri
PROGRAMMATI/ELETTIVI e ne digitalizza i documenti verso il FSE. **Il Pronto
Soccorso non compare da nessuna parte.**

## 1) BRANDING — sostituzione testuale
In DUE punti il brand recita "Azienda Ospedaliera · Pronto Soccorso":
- `src/components/AppLayout.tsx` (header slim, ~riga 78)
- `src/pages/LoginPage.tsx` (~riga 42)
Sostituisci con:
  `Ospedale Pubblico · Ufficio Accettazione Ricoveri`
Mantieni invariata la struttura JSX (resta lo `<span className="dm-brand-unit">`
per la parte dopo il "·"): cambia solo il testo, non i tag/classi.

## 2) RUOLO E IDENTITÀ DELL'UTENTE LOGGATO
In `src/components/AppLayout.tsx` (~righe 17-19) rendi la figura professionale
chiara e corretta per la sanità pubblica:
```
const userName = "Valentina Marchetti";
const userRole = "Assistente amministrativo · Ufficio Accettazione Ricoveri";
```
È personale del ruolo AMMINISTRATIVO del SSN (NON personale clinico): il microcopy
non deve mai suggerire che l'utente faccia diagnosi o atti medici. Il suo compito è
accettare il ricovero, registrare anagrafica/identità e acquisire i documenti.
Verifica che ruolo/nome siano coerenti ovunque compaiano (dropdown utente, ecc.).

## 3) FLUSSO "NUOVO RICOVERO" — da ingresso-PS a ricovero programmato
File: `src/components/NewAdmissionModal.tsx`
Oggi il flusso forza ogni ricovero a entrare dal Pronto Soccorso
(`const ENTRY_DEPARTMENT = "Pronto Soccorso"`, campo "Reparto di ingresso" fisso).
È l'unica modifica di logica autorizzata. Allinealo al ricovero programmato:
- **Elimina del tutto ENTRY_DEPARTMENT e ogni riferimento al PS.** Il campo diventa
  "Disciplina di ricovero" SCELTA dall'operatore (l'interfaccia AdmissionInput ha
  già `department`: usalo, NON aggiungere campi né cambiare il type).
- Rendi il campo un `<select>` (o input con datalist) popolato dalle discipline
  reali presenti nei dati mock (Cardiologia, Ortopedia e traumatologia, Geriatria,
  Neurologia, Chirurgia generale, Pneumologia, Oncologia, Medicina generale...).
  Nessun default "Pronto Soccorso", nessuna disciplina di default obbligatoria.
- Aggiorna i COMMENTI del file (righe ~8-10 e ~25) che descrivono "ogni ricovero
  entra dal Pronto Soccorso": ora descrivono un ricovero programmato in cui
  l'operatore dell'accettazione seleziona la disciplina di destinazione.
- Microcopy nel modale:
  - "Reparto di ingresso" → "Disciplina di ricovero"
  - "Data ingresso" → "Data del ricovero"
  - placeholder note "Motivo dell'accesso o annotazioni cliniche" →
    "Quesito diagnostico o note amministrative del ricovero"
  - "Conferma ricovero" resta.
  - La nota "Il ricovero si apre su un paziente già registrato in anagrafe" resta.

## 4) REVISIONE GENERALE DEL MICROCOPY (sweep su tutto `src/`)
Rileggi le stringhe visibili e contestualizzale all'accettazione ricoveri pubblica
e al FSE, mantenendo tono istituzionale e sobrietà (applicativo PA, stile
Bootstrap Italia). Punti noti:
- `src/pages/LoginPage.tsx`: titolo "Accedi a DocuMed" ok; footer (~riga 133)
  "DocuMed — Archivio Sanitario · Solo per uso interno" →
  "DocuMed · Accettazione ricoveri e fascicolo documentale — Uso interno autorizzato".
- `src/components/AppLayout.tsx` (~riga 145): tagline "Archivio Sanitario" →
  "Accettazione ricoveri" (o "Fascicolo documentale ricoveri"). Nome "DocuMed" resta.
- `src/pages/DashboardPage.tsx` (~riga 104): il sottotitolo deve parlare di movimenti
  dei ricoveri e lavoro documentale da completare (già vicino: rifinisci).
- `src/pages/RicoveriPage.tsx` (~riga 253): **rimuovi lo stile/condizione speciale
  per la disciplina "Pronto Soccorso" (classe `is-ps`)** e ogni microcopy che
  presenti il PS come reparto di partenza: il PS non esiste più nello scenario.
Regole di stile microcopy:
- Italiano istituzionale, conciso; nessun termine da clinico in bocca a un
  amministrativo. Usa: "ricovero", "accettazione", "disciplina", "documento",
  "fascicolo", "anagrafe", "codice fiscale".
- Dove l'utente acquisisce documenti, è chiaro che alimentano il fascicolo del
  paziente (coerente con FSE), non che servano a "refertare".

## 5) VERIFICA FINALE
- `grep -rni "pronto soccorso\|ENTRY_DEPARTMENT\|is-ps\|Azienda Ospedaliera\|Archivio Sanitario" src/`
  NON deve restituire più nulla di rilevante (residui del vecchio scenario).
- `npx tsc --noEmit` → nessun errore di tipo (prova che la struttura è intatta).
- `npm test` → i test esistenti restano verdi (aggiorna eventuali test che
  asserivano stringhe di branding/PS modificate, senza cambiare la logica testata).
- `npm run build` → build ok.
- Conferma che type/enum/interfacce e gli export NON sono cambiati: l'unica
  modifica di logica è il campo "Disciplina di ricovero" in NewAdmissionModal.
- Riepiloga i valori e le stringhe cambiate.
```
