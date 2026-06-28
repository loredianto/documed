import type {
  Patient,
  Admission,
  Clinico,
  PatientStatistics,
  PatientDocument,
  DocumentStatistics,
  OcrExtraction,
  DailyActivity,
} from "../types";

/**
 * Medici/clinici selezionabili come riferimento dei documenti (mock front-end).
 * `department` = denominazione dell'Unità Operativa/disciplina di ricovero;
 * tra parentesi il relativo codice disciplina ministeriale (flusso SDO).
 */
export const MOCK_CLINICIANS: Clinico[] = [
  { id: 1, name: "Dott.ssa Elena Conti",      department: "Cardiologia" },               // disciplina 08
  { id: 2, name: "Dott. Paolo Neri",          department: "Cardiologia" },               // disciplina 08
  { id: 3, name: "Dott. Marco Vitale",        department: "Ortopedia e traumatologia" }, // disciplina 36
  { id: 4, name: "Dott.ssa Chiara Fontana",   department: "Geriatria" },                 // disciplina 21
  { id: 5, name: "Dott. Luca Ferraro",        department: "Neurologia" },                // disciplina 32
  { id: 6, name: "Dott.ssa Anna Ricci",       department: "Gastroenterologia" },         // disciplina 58 — riassegnata da un reparto di emergenza a una disciplina programmata
  { id: 7, name: "Dott. Stefano Gallo",       department: "Chirurgia generale" },        // disciplina 09
  { id: 8, name: "Dott.ssa Federica Moretti", department: "Oncologia" },                 // disciplina 64
];

// Codici fiscali calcolati con carattere di controllo corretto e coerenti con
// nome/sesso/data di nascita/comune: il CF è la chiave identificativa del cittadino nel FSE.
export const MOCK_PATIENTS: Patient[] = [
  { id: 1, firstName: "Marco",     lastName: "Rossi",    fiscalCode: "RSSMRC80A01H501W", birthDate: "1980-01-01", email: "marco.rossi@email.it",     phone: "3201234567", createdAt: "2024-01-10T09:00:00Z", updatedAt: "2026-06-15T12:00:00Z" },
  { id: 2, firstName: "Giulia",    lastName: "Bianchi",  fiscalCode: "BNCGLI92C41F205N", birthDate: "1992-03-01", email: "giulia.bianchi@email.it",   phone: "3397654321", createdAt: "2024-02-14T10:30:00Z", updatedAt: "2026-06-18T08:00:00Z" },
  { id: 3, firstName: "Antonio",   lastName: "Ferrari",  fiscalCode: "FRRNTN55T12L219Y", birthDate: "1955-12-12", email: null,                       phone: "0632100001", createdAt: "2024-03-05T14:00:00Z", updatedAt: "2026-06-20T16:00:00Z" },
  { id: 4, firstName: "Lucia",     lastName: "Esposito", fiscalCode: "SPSLCU70E44F839G", birthDate: "1970-05-04", email: "lucia.esposito@email.it",  phone: null,         createdAt: "2024-04-22T11:00:00Z", updatedAt: "2026-06-19T09:00:00Z" },
  { id: 5, firstName: "Francesco", lastName: "Romano",   fiscalCode: "RMNFNC63H22F839B", birthDate: "1963-06-22", email: "francesco.romano@email.it", phone: "3471122334", createdAt: "2024-05-02T09:30:00Z", updatedAt: "2026-06-22T10:00:00Z" },
  { id: 6, firstName: "Sara",      lastName: "Greco",    fiscalCode: "GRCSRA88M55L736Q", birthDate: "1988-08-15", email: "sara.greco@email.it",       phone: "3289988776", createdAt: "2024-05-18T13:00:00Z", updatedAt: "2026-06-21T17:00:00Z" },
  { id: 7, firstName: "Giuseppe",  lastName: "Conti",    fiscalCode: "CNTGPP49P10H501V", birthDate: "1949-09-10", email: null,                       phone: "0655512345", createdAt: "2024-06-01T08:00:00Z", updatedAt: "2026-06-25T11:00:00Z" },
  { id: 8, firstName: "Martina",   lastName: "Galli",    fiscalCode: "GLLMTN95R66A662U", birthDate: "1995-10-26", email: "martina.galli@email.it",    phone: "3331239870", createdAt: "2024-06-12T15:30:00Z", updatedAt: "2026-06-24T14:00:00Z" },
  // Pazienti aggiuntivi per coprire tutte le combinazioni della rubrica (stato ricovero × cartella documentale).
  { id: 9,  firstName: "Giovanni", lastName: "Abbate",   fiscalCode: "BBTGNN58C14F839I", birthDate: "1958-03-14", email: "giovanni.abbate@email.it",  phone: "3398812345", createdAt: "2024-02-03T09:00:00Z", updatedAt: "2026-06-12T10:00:00Z" },
  { id: 10, firstName: "Rosa",     lastName: "Adinolfi", fiscalCode: "DNLRSO67S42H703L", birthDate: "1967-11-02", email: "rosa.adinolfi@email.it",    phone: "3401239876", createdAt: "2024-03-19T11:00:00Z", updatedAt: "2026-06-27T16:00:00Z" },
  { id: 11, firstName: "Pietro",   lastName: "Amato",    fiscalCode: "MTAPTR72L19H501T", birthDate: "1972-07-19", email: null,                       phone: "0651234567", createdAt: "2024-04-08T08:30:00Z", updatedAt: "2026-05-30T09:00:00Z" },
  { id: 12, firstName: "Elena",    lastName: "Damiani",  fiscalCode: "DMNLNE85P70F205C", birthDate: "1985-09-30", email: "elena.damiani@email.it",   phone: "3477654321", createdAt: "2024-05-21T13:30:00Z", updatedAt: "2026-06-27T09:00:00Z" },
  { id: 13, firstName: "Carla",    lastName: "Marino",   fiscalCode: "MRNCRL61D48A662S", birthDate: "1961-04-08", email: null,                       phone: "0805551234", createdAt: "2024-01-30T10:00:00Z", updatedAt: "2026-06-16T12:00:00Z" },
  { id: 14, firstName: "Luca",     lastName: "Verdi",    fiscalCode: "VRDLCU90T01L219N", birthDate: "1990-12-01", email: "luca.verdi@email.it",      phone: "3486543210", createdAt: "2024-06-20T15:00:00Z", updatedAt: "2026-06-05T11:00:00Z" },
  { id: 15, firstName: "Davide",   lastName: "Costa",    fiscalCode: "CSTDVD76B17H501K", birthDate: "1976-02-17", email: "davide.costa@email.it",     phone: "3492345678", createdAt: "2024-04-15T10:00:00Z", updatedAt: "2026-06-28T10:00:00Z" },
];

/**
 * Ricoveri programmati/elettivi (nessun accesso da emergenza-urgenza).
 * In `notes` si esplicita il REGIME DI RICOVERO del SSN — Ricovero Ordinario
 * programmato (RO), Day Hospital (DH), Day Surgery (DS), ricovero elettivo —
 * insieme al numero nosologico (identificativo della cartella), alla disciplina
 * di ricovero e al relativo codice disciplina ministeriale.
 */
export const MOCK_ADMISSIONS: Admission[] = [
  { id: 101, patientId: 1, admissionDate: "2026-06-15", dischargeDate: null,         department: "Cardiologia",               notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004512. Disciplina: Cardiologia (cod. 08). Quesito diagnostico: studio elettrofisiologico per aritmia sopraventricolare in elezione.", status: "ACTIVE",     createdAt: "2026-06-15T08:00:00Z", updatedAt: "2026-06-15T08:00:00Z" },
  { id: 102, patientId: 2, admissionDate: "2026-06-10", dischargeDate: "2026-06-18", department: "Ortopedia e traumatologia", notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004488. Disciplina: Ortopedia e traumatologia (cod. 36). Intervento di artroprotesi d'anca destra eseguito in elezione.", status: "DISCHARGED", createdAt: "2026-06-10T07:30:00Z", updatedAt: "2026-06-18T15:00:00Z" },
  { id: 103, patientId: 3, admissionDate: "2026-06-20", dischargeDate: null,         department: "Geriatria",                 notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004531. Disciplina: Geriatria (cod. 21). Valutazione multidimensionale geriatrica programmata.", status: "ACTIVE",     createdAt: "2026-06-20T09:00:00Z", updatedAt: "2026-06-20T09:00:00Z" },
  { id: 104, patientId: 4, admissionDate: "2026-06-19", dischargeDate: null,         department: "Neurologia",                notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004527. Disciplina: Neurologia (cod. 32). Quesito diagnostico: cefalea persistente, RMN encefalo programmata.", status: "ACTIVE",     createdAt: "2026-06-19T11:00:00Z", updatedAt: "2026-06-19T11:00:00Z" },
  { id: 105, patientId: 5, admissionDate: "2026-06-22", dischargeDate: null,         department: "Gastroenterologia",         notes: "Ricovero elettivo in Day Hospital (DH). Nosologico 2026/004540. Disciplina: Gastroenterologia (cod. 58). Esofagogastroduodenoscopia (EGDS) programmata con biopsie.", status: "ACTIVE",     createdAt: "2026-06-22T08:20:00Z", updatedAt: "2026-06-22T08:20:00Z" },
  { id: 106, patientId: 6, admissionDate: "2026-06-12", dischargeDate: "2026-06-21", department: "Pneumologia",               notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004470. Disciplina: Pneumologia (cod. 68). Broncoscopia in elezione per studio di nodulo polmonare.", status: "DISCHARGED", createdAt: "2026-06-12T10:15:00Z", updatedAt: "2026-06-21T09:30:00Z" },
  { id: 107, patientId: 7, admissionDate: "2026-06-25", dischargeDate: null,         department: "Chirurgia generale",        notes: "Ricovero in Day Surgery (DS). Nosologico 2026/004556. Disciplina: Chirurgia generale (cod. 09). Colecistectomia laparoscopica programmata.", status: "ACTIVE",     createdAt: "2026-06-25T07:00:00Z", updatedAt: "2026-06-25T07:00:00Z" },
  { id: 108, patientId: 1, admissionDate: "2026-06-08", dischargeDate: "2026-06-14", department: "Cardiologia",               notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004455. Disciplina: Cardiologia (cod. 08). Controllo programmato del compenso emodinamico.", status: "DISCHARGED", createdAt: "2026-06-08T08:45:00Z", updatedAt: "2026-06-14T12:00:00Z" },
  { id: 109, patientId: 8, admissionDate: "2026-06-24", dischargeDate: null,         department: "Oncologia",                 notes: "Ricovero in Day Hospital (DH). Nosologico 2026/004549. Disciplina: Oncologia (cod. 64). Ciclo di terapia antineoplastica programmata.", status: "ACTIVE",     createdAt: "2026-06-24T09:10:00Z", updatedAt: "2026-06-24T09:10:00Z" },
  { id: 110, patientId: 2, admissionDate: "2026-06-26", dischargeDate: null,         department: "Ortopedia e traumatologia", notes: "Ricovero in Day Surgery (DS). Nosologico 2026/004562. Disciplina: Ortopedia e traumatologia (cod. 36). Rimozione programmata di mezzi di sintesi.", status: "ACTIVE",     createdAt: "2026-06-26T11:30:00Z", updatedAt: "2026-06-26T11:30:00Z" },
  // Ricovero attivo con cartella ancora vuota (nessun documento caricato).
  { id: 111, patientId: 12, admissionDate: "2026-06-27", dischargeDate: null,         department: "Medicina generale",         notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004570. Disciplina: Medicina generale (cod. 26). Quesito diagnostico: inquadramento di anemia in elezione.", status: "ACTIVE",     createdAt: "2026-06-27T08:30:00Z", updatedAt: "2026-06-27T08:30:00Z" },
  // Cartella di un paziente dimesso, completa e tutta archiviata.
  { id: 112, patientId: 9,  admissionDate: "2026-06-05", dischargeDate: "2026-06-12", department: "Chirurgia generale",        notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004401. Disciplina: Chirurgia generale (cod. 09). Ernioplastica inguinale programmata.", status: "DISCHARGED", createdAt: "2026-06-05T07:30:00Z", updatedAt: "2026-06-12T12:00:00Z" },
  // Paziente con DUE cartelle cliniche (due episodi distinti): documenti in parte archiviati, in parte in lavorazione.
  { id: 113, patientId: 10, admissionDate: "2026-06-03", dischargeDate: "2026-06-09", department: "Oncologia",                 notes: "Ricovero in Day Hospital (DH). Nosologico 2026/004388. Disciplina: Oncologia (cod. 64). Ciclo di terapia antineoplastica programmata.", status: "DISCHARGED", createdAt: "2026-06-03T09:00:00Z", updatedAt: "2026-06-09T12:00:00Z" },
  { id: 114, patientId: 10, admissionDate: "2026-06-23", dischargeDate: "2026-06-27", department: "Medicina generale",         notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004533. Disciplina: Medicina generale (cod. 26). Controllo programmato e rivalutazione della terapia.", status: "DISCHARGED", createdAt: "2026-06-23T10:00:00Z", updatedAt: "2026-06-27T11:00:00Z" },
  // Cartella di un dimesso con la lettera di dimissione non ancora archiviata in cartella.
  { id: 115, patientId: 13, admissionDate: "2026-06-10", dischargeDate: "2026-06-16", department: "Pneumologia",               notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004460. Disciplina: Pneumologia (cod. 68). Broncoscopia in elezione.", status: "DISCHARGED", createdAt: "2026-06-10T08:00:00Z", updatedAt: "2026-06-16T12:00:00Z" },
  // Ricovero dimesso in data odierna (28/06/2026): visibile nel filtro "Oggi" della pagina Ricoveri.
  { id: 116, patientId: 15, admissionDate: "2026-06-22", dischargeDate: "2026-06-28", department: "Cardiologia",               notes: "Ricovero Ordinario programmato (RO). Nosologico 2026/004575. Disciplina: Cardiologia (cod. 08). Monitoraggio post-procedura, dimissione odierna.", status: "DISCHARGED", createdAt: "2026-06-22T09:00:00Z", updatedAt: "2026-06-28T09:30:00Z" },
];

/**
 * Estrazioni OCR strutturate (la "versione digitale" del documento) per i documenti
 * già elaborati, modellate sulle classi documentali del FSE 2.0 (standard HL7 CDA R2).
 */

// ADMISSION_FORM → proposta/modulo di accettazione del ricovero programmato.
const EXTRACTION_ADMISSION_ROSSI: OcrExtraction = {
  title: "Proposta di ricovero programmato",
  fields: [
    { label: "Paziente", value: "Marco Rossi" },
    { label: "Codice fiscale", value: "RSSMRC80A01H501W" }, // chiave identificativa nel FSE
    { label: "Regime di ricovero", value: "Ricovero Ordinario programmato (RO)" },
    { label: "Disciplina/Reparto", value: "Cardiologia" },
    { label: "Codice disciplina", value: "08" }, // codice disciplina ministeriale
    { label: "Numero nosologico", value: "2026/004512" },
    { label: "Data del ricovero", value: "15/06/2026" },
    { label: "Medico accettante", value: "Dott.ssa Elena Conti" },
    { label: "Medico di Medicina Generale", value: "Dott. Giorgio Sala" },
  ],
  bodyText:
    "Proposta di ricovero ordinario programmato in Cardiologia per studio elettrofisiologico di aritmia sopraventricolare. Paziente in classe di priorità elettiva, parametri vitali stabili. Accettazione amministrativa registrata dall'Ufficio Accettazione Ricoveri.",
};

// CONSENT_FORM → consenso informato + consenso all'alimentazione/consultazione del FSE.
const EXTRACTION_CONSENT_ROSSI: OcrExtraction = {
  title: "Consenso informato e consenso al FSE",
  fields: [
    { label: "Paziente", value: "Marco Rossi" },
    { label: "Codice fiscale", value: "RSSMRC80A01H501W" },
    { label: "Trattamento", value: "Studio elettrofisiologico cardiologico" },
    { label: "Consenso al trattamento dei dati (FSE 2.0)", value: "Prestato" },
    { label: "Alimentazione/consultazione FSE", value: "Autorizzata" },
    { label: "Data firma", value: "15/06/2026" },
  ],
  bodyText:
    "Il paziente dichiara di essere stato informato su natura, rischi e benefici della procedura proposta e presta il proprio consenso. Autorizza inoltre l'alimentazione e la consultazione del Fascicolo Sanitario Elettronico (FSE 2.0).",
};

// DISCHARGE_DOCUMENT → Lettera di Dimissione Ospedaliera (LDO) con Scheda di Dimissione Ospedaliera (SDO): diagnosi in ICD-9-CM e DRG.
const EXTRACTION_DISCHARGE_BIANCHI: OcrExtraction = {
  title: "Lettera di Dimissione Ospedaliera (LDO)",
  fields: [
    { label: "Paziente", value: "Giulia Bianchi" },
    { label: "Codice fiscale", value: "BNCGLI92C41F205N" },
    { label: "Disciplina/Reparto", value: "Ortopedia e traumatologia" },
    { label: "Codice disciplina", value: "36" },
    { label: "Diagnosi principale (ICD-9-CM)", value: "715.95 — Osteoartrosi primaria dell'anca" },
    { label: "Diagnosi secondaria (ICD-9-CM)", value: "268.9 — Carenza di vitamina D" },
    { label: "Intervento principale (ICD-9-CM)", value: "81.51 — Sostituzione totale dell'anca" },
    { label: "DRG", value: "470 — Sostituzione di articolazione maggiore dell'arto inferiore" }, // Diagnosis Related Group: raggruppamento per il rimborso
    { label: "Data dimissione", value: "18/06/2026" },
  ],
  bodyText:
    "Lettera di Dimissione Ospedaliera con allegata Scheda di Dimissione Ospedaliera (SDO). Intervento di artroprotesi d'anca destra eseguito senza complicanze. Dimissione a domicilio con programma riabilitativo e controllo ortopedico a 30 giorni.",
};

// MEDICAL_REPORT → referto di radiologia/laboratorio in standard CDA R2.
const EXTRACTION_REPORT_GRECO: OcrExtraction = {
  title: "Referto di Radiologia (CDA R2)",
  fields: [
    { label: "Paziente", value: "Sara Greco" },
    { label: "Codice fiscale", value: "GRCSRA88M55L736Q" },
    { label: "Esame", value: "Radiografia del torace in due proiezioni" },
    { label: "Disciplina/Reparto", value: "Pneumologia" },
    { label: "Data esecuzione", value: "13/06/2026" },
    { label: "Conclusioni", value: "Addensamento basale destro in risoluzione" },
  ],
  bodyText:
    "Referto strutturato in standard HL7 CDA R2. Rispetto al precedente si osserva netta riduzione dell'addensamento basale destro, senza versamento pleurico. Si consiglia controllo radiografico a distanza.",
};

// IDENTITY_DOCUMENT → Carta d'Identità Elettronica (CIE): il CF è la chiave del cittadino nel FSE.
const EXTRACTION_IDENTITY_CONTI: OcrExtraction = {
  title: "Carta d'Identità Elettronica (CIE)",
  fields: [
    { label: "Cognome e nome", value: "Conti Giuseppe" },
    { label: "Codice fiscale", value: "CNTGPP49P10H501V" }, // chiave identificativa del cittadino nel FSE
    { label: "Data di nascita", value: "10/09/1949" },
    { label: "Tipo documento", value: "Carta d'Identità Elettronica (CIE)" },
    { label: "Scadenza", value: "04/2031" },
  ],
  bodyText: null,
};

// `filedInRecord`: true = versione digitale già archiviata nella cartella clinica/fascicolo
// del paziente; false = non ancora acquisita (in attesa di OCR o di archiviazione).
export const MOCK_DOCUMENTS: PatientDocument[] = [
  { id: "doc-001", patientId: 1, admissionId: 101, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_rossi.pdf",      description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 204800,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Marco Rossi\nDisciplina: Cardiologia (cod. 08)\nRegime: Ricovero Ordinario programmato (RO)\nData: 15/06/2026", ocrExtraction: EXTRACTION_ADMISSION_ROSSI, ocrErrorMessage: null, uploadedAt: "2026-06-15T09:00:00Z", processedAt: "2026-06-15T09:05:00Z", filedInRecord: true },
  { id: "doc-002", patientId: 1, admissionId: 101, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_rossi.pdf",     description: "Consenso informato e consenso al FSE",                contentType: "application/pdf", fileSize: 102400,  ocrStatus: "COMPLETED",  extractedText: "CONSENSO INFORMATO\nIo sottoscritto Marco Rossi acconsento al trattamento e all'alimentazione del Fascicolo Sanitario Elettronico...", ocrExtraction: EXTRACTION_CONSENT_ROSSI, ocrErrorMessage: null, uploadedAt: "2026-06-15T09:10:00Z", processedAt: "2026-06-15T09:12:00Z", filedInRecord: true },
  { id: "doc-003", patientId: 1, admissionId: 101, documentType: "MEDICAL_REPORT",     originalFilename: "referto_ecg_rossi.jpg",            description: "Referto ECG di ingresso",                            contentType: "image/jpeg",      fileSize: 358400,  ocrStatus: "COMPLETED",  extractedText: "REFERTO ECG\nPaziente: Marco Rossi\nRitmo sinusale, frequenza nella norma", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-15T10:00:00Z", processedAt: "2026-06-15T10:06:00Z", filedInRecord: true },
  { id: "doc-004", patientId: 2, admissionId: 102, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_bianchi.pdf",                  description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 256000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Giulia Bianchi\nDiagnosi principale (ICD-9-CM): 715.95\nDRG: 470", ocrExtraction: EXTRACTION_DISCHARGE_BIANCHI, ocrErrorMessage: null, uploadedAt: "2026-06-18T15:30:00Z", processedAt: "2026-06-18T15:34:00Z", filedInRecord: true },
  { id: "doc-005", patientId: 2, admissionId: 102, documentType: "MEDICAL_REPORT",     originalFilename: "referto_operatorio_bianchi.pdf",   description: "Referto operatorio",                                 contentType: "application/pdf", fileSize: 512000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-18T16:00:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-006", patientId: 3, admissionId: 103, documentType: "IDENTITY_DOCUMENT",  originalFilename: "tessera_sanitaria_ferrari.jpg",    description: null,                                                  contentType: "image/jpeg",      fileSize: 1048576, ocrStatus: "FAILED",     extractedText: null, ocrExtraction: null, ocrErrorMessage: "Qualità immagine insufficiente per il riconoscimento OCR", uploadedAt: "2026-06-20T09:30:00Z", processedAt: "2026-06-20T09:35:00Z", filedInRecord: false },
  { id: "doc-007", patientId: 3, admissionId: 103, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_ferrari.pdf",    description: "Proposta di ricovero del medico curante",            contentType: "application/pdf", fileSize: 198000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-20T09:40:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-008", patientId: 4, admissionId: 104, documentType: "MEDICAL_REPORT",     originalFilename: "referto_rmn_encefalo_esposito.pdf", description: "Referto RMN encefalo",                              contentType: "application/pdf", fileSize: 880000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-19T12:00:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-009", patientId: 5, admissionId: 105, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_romano.pdf",     description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 162000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-22T08:40:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-010", patientId: 6, admissionId: 106, documentType: "MEDICAL_REPORT",     originalFilename: "referto_rx_torace_greco.jpg",      description: "Referto radiologico — RX torace",                    contentType: "image/jpeg",      fileSize: 742000,  ocrStatus: "COMPLETED",  extractedText: "REFERTO DI RADIOLOGIA (CDA R2)\nPaziente: Sara Greco\nEsame: RX torace\nConclusioni: addensamento basale destro in risoluzione", ocrExtraction: EXTRACTION_REPORT_GRECO, ocrErrorMessage: null, uploadedAt: "2026-06-13T11:00:00Z", processedAt: "2026-06-13T11:06:00Z", filedInRecord: true },
  { id: "doc-011", patientId: 6, admissionId: 106, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_greco.pdf",                    description: "Lettera di Dimissione Ospedaliera (LDO)",             contentType: "application/pdf", fileSize: 234000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-21T09:00:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-012", patientId: 7, admissionId: 107, documentType: "IDENTITY_DOCUMENT",  originalFilename: "cie_conti.jpg",                    description: "Carta d'Identità Elettronica (CIE)",                  contentType: "image/jpeg",      fileSize: 612000,  ocrStatus: "COMPLETED",  extractedText: "CARTA D'IDENTITÀ ELETTRONICA\nConti Giuseppe\nCF CNTGPP49P10H501V\n10/09/1949", ocrExtraction: EXTRACTION_IDENTITY_CONTI, ocrErrorMessage: null, uploadedAt: "2026-06-25T07:30:00Z", processedAt: "2026-06-25T07:33:00Z", filedInRecord: false }, // digitalizzato ma non ancora archiviato in cartella
  { id: "doc-013", patientId: 7, admissionId: 107, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_conti.pdf",     description: "Consenso informato all'intervento",                  contentType: "application/pdf", fileSize: 145000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-25T08:00:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-014", patientId: 8, admissionId: 109, documentType: "OTHER",              originalFilename: "patient_summary_galli.pdf",        description: "Profilo Sanitario Sintetico (Patient Summary) del MMG", contentType: "application/pdf", fileSize: 121000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-24T09:30:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-015", patientId: 1, admissionId: 101, documentType: "IDENTITY_DOCUMENT",  originalFilename: "cie_rossi.jpg",                    description: "Carta d'Identità Elettronica (CIE)",                  contentType: "image/jpeg",      fileSize: 528000,  ocrStatus: "COMPLETED",  extractedText: "CARTA D'IDENTITÀ ELETTRONICA\nRossi Marco\nCF RSSMRC80A01H501W\n01/01/1980", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-15T08:30:00Z", processedAt: "2026-06-15T08:34:00Z", filedInRecord: true },
  { id: "doc-016", patientId: 7, admissionId: 107, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_conti.pdf",      description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 176000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Giuseppe Conti\nDisciplina: Chirurgia generale (cod. 09)\nRegime: Day Surgery (DS)", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-25T07:45:00Z", processedAt: "2026-06-25T07:49:00Z", filedInRecord: false }, // digitalizzato ma non ancora archiviato in cartella
  // Cartella clinica del ricovero 108 (episodio pregresso di Marco Rossi, già dimesso): chiusa e completa di LDO.
  { id: "doc-017", patientId: 1, admissionId: 108, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_rossi_pregresso.pdf", description: "Proposta/Modulo di accettazione del ricovero",     contentType: "application/pdf", fileSize: 188000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Marco Rossi\nDisciplina: Cardiologia (cod. 08)\nRegime: Ricovero Ordinario programmato (RO)\nData: 08/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-08T09:00:00Z", processedAt: "2026-06-08T09:04:00Z", filedInRecord: true },
  { id: "doc-018", patientId: 1, admissionId: 108, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_rossi_pregresso.pdf", description: "Consenso informato e consenso al FSE",              contentType: "application/pdf", fileSize: 99000,   ocrStatus: "COMPLETED",  extractedText: "CONSENSO INFORMATO\nMarco Rossi acconsente al trattamento e all'alimentazione del Fascicolo Sanitario Elettronico...", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-08T09:10:00Z", processedAt: "2026-06-08T09:12:00Z", filedInRecord: true },
  { id: "doc-019", patientId: 1, admissionId: 108, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_rossi.pdf",                    description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 241000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Marco Rossi\nDisciplina: Cardiologia (cod. 08)\nData dimissione: 14/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-14T11:30:00Z", processedAt: "2026-06-14T11:34:00Z", filedInRecord: true },
  // Cartella clinica del ricovero 110 (Day Surgery di Giulia Bianchi, appena aperto): documenti in lavorazione.
  { id: "doc-020", patientId: 2, admissionId: 110, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_bianchi.pdf",    description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 171000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-26T11:40:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-021", patientId: 2, admissionId: 110, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_bianchi.pdf",   description: "Consenso informato all'intervento",                  contentType: "application/pdf", fileSize: 138000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-26T11:45:00Z", processedAt: null, filedInRecord: false },
  // Cartella 112 (Abbate, dimesso): completa e interamente archiviata in cartella clinica.
  { id: "doc-022", patientId: 9,  admissionId: 112, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_abbate.pdf",     description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 182000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Giovanni Abbate\nDisciplina: Chirurgia generale (cod. 09)\nRegime: Ricovero Ordinario programmato (RO)", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-05T08:00:00Z", processedAt: "2026-06-05T08:05:00Z", filedInRecord: true },
  { id: "doc-023", patientId: 9,  admissionId: 112, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_abbate.pdf",    description: "Consenso informato e consenso al FSE",                contentType: "application/pdf", fileSize: 96000,   ocrStatus: "COMPLETED",  extractedText: "CONSENSO INFORMATO\nGiovanni Abbate acconsente al trattamento e all'alimentazione del Fascicolo Sanitario Elettronico...", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-05T08:10:00Z", processedAt: "2026-06-05T08:12:00Z", filedInRecord: true },
  { id: "doc-024", patientId: 9,  admissionId: 112, documentType: "IDENTITY_DOCUMENT",  originalFilename: "cie_abbate.jpg",                   description: "Carta d'Identità Elettronica (CIE)",                  contentType: "image/jpeg",      fileSize: 540000,  ocrStatus: "COMPLETED",  extractedText: "CARTA D'IDENTITÀ ELETTRONICA\nAbbate Giovanni\nCF BBTGNN58C14F839I\n14/03/1958", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-05T08:15:00Z", processedAt: "2026-06-05T08:18:00Z", filedInRecord: true },
  { id: "doc-025", patientId: 9,  admissionId: 112, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_abbate.pdf",                   description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 248000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Giovanni Abbate\nDisciplina: Chirurgia generale (cod. 09)\nData dimissione: 12/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-12T11:00:00Z", processedAt: "2026-06-12T11:04:00Z", filedInRecord: true },
  // Cartella 113 (Adinolfi, 1° episodio): documenti archiviati in cartella.
  { id: "doc-026", patientId: 10, admissionId: 113, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_adinolfi.pdf",   description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 169000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Rosa Adinolfi\nDisciplina: Oncologia (cod. 64)\nRegime: Day Hospital (DH)", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-03T09:10:00Z", processedAt: "2026-06-03T09:14:00Z", filedInRecord: true },
  { id: "doc-027", patientId: 10, admissionId: 113, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_adinolfi.pdf",                 description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 226000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Rosa Adinolfi\nDisciplina: Oncologia (cod. 64)\nData dimissione: 09/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-09T10:00:00Z", processedAt: "2026-06-09T10:05:00Z", filedInRecord: true },
  // Cartella 114 (Adinolfi, 2° episodio): documenti ancora in lavorazione, non archiviati.
  { id: "doc-028", patientId: 10, admissionId: 114, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_adinolfi_2.pdf", description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 164000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-23T10:20:00Z", processedAt: null, filedInRecord: false },
  { id: "doc-029", patientId: 10, admissionId: 114, documentType: "MEDICAL_REPORT",     originalFilename: "referto_emocromo_adinolfi.pdf",    description: "Referto di laboratorio",                            contentType: "application/pdf", fileSize: 312000,  ocrStatus: "COMPLETED",  extractedText: "REFERTO DI LABORATORIO\nPaziente: Rosa Adinolfi\nEmocromo nei limiti", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-24T09:00:00Z", processedAt: "2026-06-24T09:05:00Z", filedInRecord: false },
  // Cartella 115 (Marino, dimessa): lettera di dimissione digitalizzata ma non ancora archiviata in cartella.
  { id: "doc-030", patientId: 13, admissionId: 115, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_marino.pdf",     description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 173000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Carla Marino\nDisciplina: Pneumologia (cod. 68)\nRegime: Ricovero Ordinario programmato (RO)", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-10T08:20:00Z", processedAt: "2026-06-10T08:24:00Z", filedInRecord: true },
  { id: "doc-031", patientId: 13, admissionId: 115, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_marino.pdf",                   description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 231000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Carla Marino\nDisciplina: Pneumologia (cod. 68)\nData dimissione: 16/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-16T11:00:00Z", processedAt: "2026-06-16T11:05:00Z", filedInRecord: false },
  // Cartella 116 (Costa, dimesso oggi): proposta e LDO archiviate.
  { id: "doc-032", patientId: 15, admissionId: 116, documentType: "ADMISSION_FORM",     originalFilename: "proposta_ricovero_costa.pdf",      description: "Proposta/Modulo di accettazione del ricovero",        contentType: "application/pdf", fileSize: 179000,  ocrStatus: "COMPLETED",  extractedText: "PROPOSTA DI RICOVERO PROGRAMMATO\nPaziente: Davide Costa\nDisciplina: Cardiologia (cod. 08)\nRegime: Ricovero Ordinario programmato (RO)", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-22T09:10:00Z", processedAt: "2026-06-22T09:14:00Z", filedInRecord: true },
  { id: "doc-033", patientId: 15, admissionId: 116, documentType: "DISCHARGE_DOCUMENT", originalFilename: "ldo_costa.pdf",                    description: "Lettera di Dimissione Ospedaliera (LDO) con SDO",     contentType: "application/pdf", fileSize: 238000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE OSPEDALIERA (LDO)\nPaziente: Davide Costa\nDisciplina: Cardiologia (cod. 08)\nData dimissione: 28/06/2026", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-28T09:00:00Z", processedAt: "2026-06-28T09:05:00Z", filedInRecord: true },
];

/** Serie attività giornaliera (ingressi/dimissioni) usata dal range picker della dashboard. */
export const MOCK_DAILY_ACTIVITY: DailyActivity[] = [
  { date: "2026-06-07", admissions: 0, discharges: 0 },
  { date: "2026-06-08", admissions: 1, discharges: 0 },
  { date: "2026-06-09", admissions: 0, discharges: 1 },
  { date: "2026-06-10", admissions: 2, discharges: 0 },
  { date: "2026-06-11", admissions: 0, discharges: 0 },
  { date: "2026-06-12", admissions: 1, discharges: 1 },
  { date: "2026-06-13", admissions: 0, discharges: 0 },
  { date: "2026-06-14", admissions: 0, discharges: 1 },
  { date: "2026-06-15", admissions: 1, discharges: 0 },
  { date: "2026-06-16", admissions: 0, discharges: 1 },
  { date: "2026-06-17", admissions: 0, discharges: 0 },
  { date: "2026-06-18", admissions: 0, discharges: 1 },
  { date: "2026-06-19", admissions: 1, discharges: 0 },
  { date: "2026-06-20", admissions: 1, discharges: 0 },
  { date: "2026-06-21", admissions: 0, discharges: 1 },
  { date: "2026-06-22", admissions: 2, discharges: 0 },
  { date: "2026-06-23", admissions: 1, discharges: 0 },
  { date: "2026-06-24", admissions: 1, discharges: 0 },
  { date: "2026-06-25", admissions: 1, discharges: 0 },
  { date: "2026-06-26", admissions: 1, discharges: 0 },
  { date: "2026-06-27", admissions: 1, discharges: 1 },
  { date: "2026-06-28", admissions: 0, discharges: 1 },
];

export const MOCK_STATISTICS: PatientStatistics = {
  totalPatients: MOCK_PATIENTS.length,
  activeAdmissions: MOCK_ADMISSIONS.filter((a) => a.status === "ACTIVE").length,
  admissionsToday: 0, // nessun ingresso registrato in data odierna (28/06/2026)
  dischargesToday: 1, // una dimissione in data odierna (ricovero 116)
  lastSevenDays: MOCK_DAILY_ACTIVITY.slice(-7),
};

export const MOCK_DOC_STATISTICS: DocumentStatistics = {
  totalDocuments: MOCK_DOCUMENTS.length,
  documentsByType: {
    ADMISSION_FORM: MOCK_DOCUMENTS.filter((d) => d.documentType === "ADMISSION_FORM").length,
    CONSENT_FORM: MOCK_DOCUMENTS.filter((d) => d.documentType === "CONSENT_FORM").length,
    MEDICAL_REPORT: MOCK_DOCUMENTS.filter((d) => d.documentType === "MEDICAL_REPORT").length,
    DISCHARGE_DOCUMENT: MOCK_DOCUMENTS.filter((d) => d.documentType === "DISCHARGE_DOCUMENT").length,
    IDENTITY_DOCUMENT: MOCK_DOCUMENTS.filter((d) => d.documentType === "IDENTITY_DOCUMENT").length,
    OTHER: MOCK_DOCUMENTS.filter((d) => d.documentType === "OTHER").length,
  },
  documentsByOcrStatus: {
    COMPLETED: MOCK_DOCUMENTS.filter((d) => d.ocrStatus === "COMPLETED").length,
    PENDING: MOCK_DOCUMENTS.filter((d) => d.ocrStatus === "PENDING").length,
    FAILED: MOCK_DOCUMENTS.filter((d) => d.ocrStatus === "FAILED").length,
  },
};
