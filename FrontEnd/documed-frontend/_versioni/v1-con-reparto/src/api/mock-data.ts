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

/** Reparti ospedalieri disponibili per l'inoltro dei documenti (mock front-end). */
export const MOCK_DEPARTMENTS: string[] = [
  "Cardiologia",
  "Ortopedia",
  "Geriatria",
  "Neurologia",
  "Pronto Soccorso",
  "Pneumologia",
  "Chirurgia Generale",
  "Oncologia",
  "Radiologia",
  "Pediatria",
];

/** Medici/clinici selezionabili come riferimento dei documenti (mock front-end). */
export const MOCK_CLINICIANS: Clinico[] = [
  { id: 1, name: "Dott.ssa Elena Conti",      department: "Cardiologia" },
  { id: 2, name: "Dott. Paolo Neri",          department: "Cardiologia" },
  { id: 3, name: "Dott. Marco Vitale",        department: "Ortopedia" },
  { id: 4, name: "Dott.ssa Chiara Fontana",   department: "Geriatria" },
  { id: 5, name: "Dott. Luca Ferraro",        department: "Neurologia" },
  { id: 6, name: "Dott.ssa Anna Ricci",       department: "Pronto Soccorso" },
  { id: 7, name: "Dott. Stefano Gallo",       department: "Chirurgia Generale" },
  { id: 8, name: "Dott.ssa Federica Moretti", department: "Oncologia" },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 1, firstName: "Marco",     lastName: "Rossi",    fiscalCode: "RSSMRC80A01H501Z", birthDate: "1980-01-01", email: "marco.rossi@email.it",     phone: "3201234567", createdAt: "2024-01-10T09:00:00Z", updatedAt: "2026-06-15T12:00:00Z" },
  { id: 2, firstName: "Giulia",    lastName: "Bianchi",  fiscalCode: "BNCGLI92C41F205X", birthDate: "1992-03-01", email: "giulia.bianchi@email.it",   phone: "3397654321", createdAt: "2024-02-14T10:30:00Z", updatedAt: "2026-06-18T08:00:00Z" },
  { id: 3, firstName: "Antonio",   lastName: "Ferrari",  fiscalCode: "FRRNTN55T12L219W", birthDate: "1955-12-12", email: null,                       phone: "0632100001", createdAt: "2024-03-05T14:00:00Z", updatedAt: "2026-06-20T16:00:00Z" },
  { id: 4, firstName: "Lucia",     lastName: "Esposito", fiscalCode: "SPSLCU70E44F839P", birthDate: "1970-05-04", email: "lucia.esposito@email.it",  phone: null,         createdAt: "2024-04-22T11:00:00Z", updatedAt: "2026-06-19T09:00:00Z" },
  { id: 5, firstName: "Francesco", lastName: "Romano",   fiscalCode: "RMNFNC63H22F839K", birthDate: "1963-06-22", email: "francesco.romano@email.it", phone: "3471122334", createdAt: "2024-05-02T09:30:00Z", updatedAt: "2026-06-22T10:00:00Z" },
  { id: 6, firstName: "Sara",      lastName: "Greco",    fiscalCode: "GRCSRA88M55L736T", birthDate: "1988-08-15", email: "sara.greco@email.it",       phone: "3289988776", createdAt: "2024-05-18T13:00:00Z", updatedAt: "2026-06-21T17:00:00Z" },
  { id: 7, firstName: "Giuseppe",  lastName: "Conti",    fiscalCode: "CNTGPP49P10H501B", birthDate: "1949-09-10", email: null,                       phone: "0655512345", createdAt: "2024-06-01T08:00:00Z", updatedAt: "2026-06-25T11:00:00Z" },
  { id: 8, firstName: "Martina",   lastName: "Galli",    fiscalCode: "GLLMTN95R66A662D", birthDate: "1995-10-26", email: "martina.galli@email.it",    phone: "3331239870", createdAt: "2024-06-12T15:30:00Z", updatedAt: "2026-06-24T14:00:00Z" },
];

export const MOCK_ADMISSIONS: Admission[] = [
  { id: 101, patientId: 1, admissionDate: "2026-06-15", dischargeDate: null,         department: "Cardiologia",        notes: "Dolore toracico acuto, monitoraggio in corso.",          status: "ACTIVE",     createdAt: "2026-06-15T08:00:00Z", updatedAt: "2026-06-15T08:00:00Z" },
  { id: 102, patientId: 2, admissionDate: "2026-06-10", dischargeDate: "2026-06-18", department: "Ortopedia",          notes: "Frattura tibia destra, intervento eseguito con successo.", status: "DISCHARGED", createdAt: "2026-06-10T07:30:00Z", updatedAt: "2026-06-18T15:00:00Z" },
  { id: 103, patientId: 3, admissionDate: "2026-06-20", dischargeDate: null,         department: "Geriatria",          notes: null,                                                     status: "ACTIVE",     createdAt: "2026-06-20T09:00:00Z", updatedAt: "2026-06-20T09:00:00Z" },
  { id: 104, patientId: 4, admissionDate: "2026-06-19", dischargeDate: null,         department: "Neurologia",         notes: "Cefalea persistente, risonanza magnetica programmata.",  status: "ACTIVE",     createdAt: "2026-06-19T11:00:00Z", updatedAt: "2026-06-19T11:00:00Z" },
  { id: 105, patientId: 5, admissionDate: "2026-06-22", dischargeDate: null,         department: "Pronto Soccorso",    notes: "Accesso per trauma da caduta, in osservazione.",         status: "ACTIVE",     createdAt: "2026-06-22T18:20:00Z", updatedAt: "2026-06-22T18:20:00Z" },
  { id: 106, patientId: 6, admissionDate: "2026-06-12", dischargeDate: "2026-06-21", department: "Pneumologia",        notes: "Polmonite, terapia antibiotica completata.",             status: "DISCHARGED", createdAt: "2026-06-12T10:15:00Z", updatedAt: "2026-06-21T09:30:00Z" },
  { id: 107, patientId: 7, admissionDate: "2026-06-25", dischargeDate: null,         department: "Chirurgia Generale", notes: "Colecistectomia programmata.",                           status: "ACTIVE",     createdAt: "2026-06-25T07:00:00Z", updatedAt: "2026-06-25T07:00:00Z" },
  { id: 108, patientId: 1, admissionDate: "2026-06-08", dischargeDate: "2026-06-14", department: "Cardiologia",        notes: "Episodio precedente, controllo aritmia.",                status: "DISCHARGED", createdAt: "2026-06-08T08:45:00Z", updatedAt: "2026-06-14T12:00:00Z" },
  { id: 109, patientId: 8, admissionDate: "2026-06-24", dischargeDate: null,         department: "Oncologia",          notes: "Day hospital per ciclo terapeutico.",                    status: "ACTIVE",     createdAt: "2026-06-24T09:10:00Z", updatedAt: "2026-06-24T09:10:00Z" },
  { id: 110, patientId: 2, admissionDate: "2026-06-26", dischargeDate: null,         department: "Ortopedia",          notes: "Controllo post-operatorio, riammissione.",               status: "ACTIVE",     createdAt: "2026-06-26T11:30:00Z", updatedAt: "2026-06-26T11:30:00Z" },
];

/** Estrazioni OCR strutturate (la "versione digitale" del documento) per i documenti già elaborati. */
const EXTRACTION_ADMISSION_ROSSI: OcrExtraction = {
  title: "Modulo di ricovero",
  fields: [
    { label: "Paziente", value: "Marco Rossi" },
    { label: "Codice fiscale", value: "RSSMRC80A01H501Z" },
    { label: "Reparto", value: "Cardiologia" },
    { label: "Data ricovero", value: "15/06/2026" },
    { label: "Medico accettante", value: "Dott.ssa Elena Moretti" },
  ],
  bodyText: "Ricovero ordinario per dolore toracico acuto. Paziente cosciente, parametri vitali stabili all'ingresso.",
};

const EXTRACTION_CONSENT_ROSSI: OcrExtraction = {
  title: "Consenso informato",
  fields: [
    { label: "Paziente", value: "Marco Rossi" },
    { label: "Trattamento", value: "Monitoraggio cardiologico ed esami diagnostici" },
    { label: "Data firma", value: "15/06/2026" },
    { label: "Esito", value: "Consenso prestato" },
  ],
  bodyText: "Il paziente dichiara di essere stato informato su natura, rischi e benefici del trattamento proposto e presta il proprio consenso.",
};

const EXTRACTION_DISCHARGE_BIANCHI: OcrExtraction = {
  title: "Lettera di dimissione",
  fields: [
    { label: "Paziente", value: "Giulia Bianchi" },
    { label: "Reparto", value: "Ortopedia" },
    { label: "Data dimissione", value: "18/06/2026" },
    { label: "Diagnosi", value: "Frattura biossea tibia destra" },
    { label: "Terapia a domicilio", value: "Antidolorifico al bisogno, controllo a 30 giorni" },
  ],
  bodyText: "Intervento di riduzione e sintesi eseguito senza complicanze. Dimissione con indicazioni per la riabilitazione.",
};

const EXTRACTION_REPORT_GRECO: OcrExtraction = {
  title: "Referto pneumologico",
  fields: [
    { label: "Paziente", value: "Sara Greco" },
    { label: "Esame", value: "Radiografia del torace" },
    { label: "Data", value: "13/06/2026" },
    { label: "Conclusioni", value: "Addensamento basale destro in risoluzione" },
  ],
  bodyText: "Quadro compatibile con polmonite in fase di risoluzione. Si consiglia controllo radiografico a distanza.",
};

const EXTRACTION_IDENTITY_CONTI: OcrExtraction = {
  title: "Documento di identità",
  fields: [
    { label: "Cognome e nome", value: "Conti Giuseppe" },
    { label: "Codice fiscale", value: "CNTGPP49P10H501B" },
    { label: "Data di nascita", value: "10/09/1949" },
    { label: "Tipo documento", value: "Carta d'identità" },
    { label: "Scadenza", value: "04/2031" },
  ],
  bodyText: null,
};

export const MOCK_DOCUMENTS: PatientDocument[] = [
  { id: "doc-001", patientId: 1, admissionId: 101, documentType: "ADMISSION_FORM",     originalFilename: "modulo_ricovero_rossi.pdf",       description: "Modulo di ammissione firmato",  contentType: "application/pdf", fileSize: 204800,  ocrStatus: "COMPLETED",  extractedText: "MODULO DI RICOVERO\nPaziente: Marco Rossi\nReparto: Cardiologia\nData: 15/06/2026", ocrExtraction: EXTRACTION_ADMISSION_ROSSI, ocrErrorMessage: null, uploadedAt: "2026-06-15T09:00:00Z", processedAt: "2026-06-15T09:05:00Z" },
  { id: "doc-002", patientId: 1, admissionId: 101, documentType: "CONSENT_FORM",       originalFilename: "consenso_informato_rossi.pdf",    description: "Consenso informato trattamenti", contentType: "application/pdf", fileSize: 102400,  ocrStatus: "COMPLETED",  extractedText: "CONSENSO INFORMATO\nIo sottoscritto Marco Rossi acconsento al trattamento...", ocrExtraction: EXTRACTION_CONSENT_ROSSI, ocrErrorMessage: null, uploadedAt: "2026-06-15T09:10:00Z", processedAt: "2026-06-15T09:12:00Z" },
  { id: "doc-003", patientId: 1, admissionId: 101, documentType: "MEDICAL_REPORT",     originalFilename: "ecg_rossi.jpg",                   description: "Tracciato ECG ingresso",         contentType: "image/jpeg",      fileSize: 358400,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-15T10:00:00Z", processedAt: null },
  { id: "doc-004", patientId: 2, admissionId: 102, documentType: "DISCHARGE_DOCUMENT", originalFilename: "lettera_dimissione_bianchi.pdf",  description: "Lettera di dimissione",          contentType: "application/pdf", fileSize: 256000,  ocrStatus: "COMPLETED",  extractedText: "LETTERA DI DIMISSIONE\nPaziente: Giulia Bianchi\nDiagnosi: frattura tibia destra", ocrExtraction: EXTRACTION_DISCHARGE_BIANCHI, ocrErrorMessage: null, uploadedAt: "2026-06-18T15:30:00Z", processedAt: "2026-06-18T15:34:00Z" },
  { id: "doc-005", patientId: 2, admissionId: 102, documentType: "MEDICAL_REPORT",     originalFilename: "referto_ortopedico_bianchi.pdf",  description: "Referto post-operatorio",        contentType: "application/pdf", fileSize: 512000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-18T16:00:00Z", processedAt: null },
  { id: "doc-006", patientId: 3, admissionId: 103, documentType: "IDENTITY_DOCUMENT",  originalFilename: "documento_identita_ferrari.jpg",  description: null,                              contentType: "image/jpeg",      fileSize: 1048576, ocrStatus: "FAILED",     extractedText: null, ocrExtraction: null, ocrErrorMessage: "Qualità immagine insufficiente per il riconoscimento OCR", uploadedAt: "2026-06-20T09:30:00Z", processedAt: "2026-06-20T09:35:00Z" },
  { id: "doc-007", patientId: 3, admissionId: 103, documentType: "ADMISSION_FORM",     originalFilename: "modulo_ricovero_ferrari.pdf",     description: "Modulo di ammissione",           contentType: "application/pdf", fileSize: 198000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-20T09:40:00Z", processedAt: null },
  { id: "doc-008", patientId: 4, admissionId: 104, documentType: "MEDICAL_REPORT",     originalFilename: "rmn_encefalo_esposito.pdf",       description: "Risonanza magnetica encefalo",    contentType: "application/pdf", fileSize: 880000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-19T12:00:00Z", processedAt: null },
  { id: "doc-009", patientId: 5, admissionId: 105, documentType: "ADMISSION_FORM",     originalFilename: "verbale_ps_romano.pdf",           description: "Verbale di Pronto Soccorso",      contentType: "application/pdf", fileSize: 162000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-22T18:40:00Z", processedAt: null },
  { id: "doc-010", patientId: 6, admissionId: 106, documentType: "MEDICAL_REPORT",     originalFilename: "rx_torace_greco.jpg",             description: "Radiografia del torace",          contentType: "image/jpeg",      fileSize: 742000,  ocrStatus: "COMPLETED",  extractedText: "RX TORACE\nPaziente: Sara Greco\nConclusioni: addensamento basale destro", ocrExtraction: EXTRACTION_REPORT_GRECO, ocrErrorMessage: null, uploadedAt: "2026-06-13T11:00:00Z", processedAt: "2026-06-13T11:06:00Z" },
  { id: "doc-011", patientId: 6, admissionId: 106, documentType: "DISCHARGE_DOCUMENT", originalFilename: "lettera_dimissione_greco.pdf",    description: "Lettera di dimissione",          contentType: "application/pdf", fileSize: 234000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-21T09:00:00Z", processedAt: null },
  { id: "doc-012", patientId: 7, admissionId: 107, documentType: "IDENTITY_DOCUMENT",  originalFilename: "carta_identita_conti.jpg",        description: "Carta d'identità",               contentType: "image/jpeg",      fileSize: 612000,  ocrStatus: "COMPLETED",  extractedText: "CARTA D'IDENTITÀ\nConti Giuseppe\n10/09/1949", ocrExtraction: EXTRACTION_IDENTITY_CONTI, ocrErrorMessage: null, uploadedAt: "2026-06-25T07:30:00Z", processedAt: "2026-06-25T07:33:00Z" },
  { id: "doc-013", patientId: 7, admissionId: 107, documentType: "CONSENT_FORM",       originalFilename: "consenso_chirurgico_conti.pdf",   description: "Consenso all'intervento",        contentType: "application/pdf", fileSize: 145000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-25T08:00:00Z", processedAt: null },
  { id: "doc-014", patientId: 8, admissionId: 109, documentType: "OTHER",              originalFilename: "scheda_terapia_galli.pdf",        description: "Scheda terapia day hospital",     contentType: "application/pdf", fileSize: 121000,  ocrStatus: "PENDING",    extractedText: null, ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-24T09:30:00Z", processedAt: null },
  { id: "doc-015", patientId: 1, admissionId: 101, documentType: "IDENTITY_DOCUMENT",  originalFilename: "carta_identita_rossi.jpg",        description: "Carta d'identità",               contentType: "image/jpeg",      fileSize: 528000,  ocrStatus: "COMPLETED",  extractedText: "CARTA D'IDENTITÀ\nRossi Marco\n01/01/1980", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-15T08:30:00Z", processedAt: "2026-06-15T08:34:00Z" },
  { id: "doc-016", patientId: 7, admissionId: 107, documentType: "ADMISSION_FORM",     originalFilename: "modulo_ricovero_conti.pdf",       description: "Modulo di ammissione firmato",    contentType: "application/pdf", fileSize: 176000,  ocrStatus: "COMPLETED",  extractedText: "MODULO DI RICOVERO\nPaziente: Giuseppe Conti\nReparto: Chirurgia Generale", ocrExtraction: null, ocrErrorMessage: null, uploadedAt: "2026-06-25T07:45:00Z", processedAt: "2026-06-25T07:49:00Z" },
];

/** Serie attività giornaliera (ingressi/dimissioni) usata dal range picker della dashboard. */
export const MOCK_DAILY_ACTIVITY: DailyActivity[] = [
  { date: "2026-06-07", admissions: 0, discharges: 1 },
  { date: "2026-06-08", admissions: 1, discharges: 0 },
  { date: "2026-06-09", admissions: 0, discharges: 0 },
  { date: "2026-06-10", admissions: 1, discharges: 0 },
  { date: "2026-06-11", admissions: 0, discharges: 1 },
  { date: "2026-06-12", admissions: 1, discharges: 0 },
  { date: "2026-06-13", admissions: 0, discharges: 0 },
  { date: "2026-06-14", admissions: 0, discharges: 1 },
  { date: "2026-06-15", admissions: 1, discharges: 0 },
  { date: "2026-06-16", admissions: 0, discharges: 0 },
  { date: "2026-06-17", admissions: 0, discharges: 1 },
  { date: "2026-06-18", admissions: 0, discharges: 1 },
  { date: "2026-06-19", admissions: 1, discharges: 0 },
  { date: "2026-06-20", admissions: 1, discharges: 0 },
  { date: "2026-06-21", admissions: 0, discharges: 1 },
  { date: "2026-06-22", admissions: 1, discharges: 0 },
  { date: "2026-06-23", admissions: 0, discharges: 0 },
  { date: "2026-06-24", admissions: 1, discharges: 0 },
  { date: "2026-06-25", admissions: 1, discharges: 0 },
  { date: "2026-06-26", admissions: 1, discharges: 0 },
  { date: "2026-06-27", admissions: 0, discharges: 0 },
];

export const MOCK_STATISTICS: PatientStatistics = {
  totalPatients: MOCK_PATIENTS.length,
  activeAdmissions: MOCK_ADMISSIONS.filter((a) => a.status === "ACTIVE").length,
  admissionsToday: 1,
  dischargesToday: 0,
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
