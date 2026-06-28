# Documed Document Service

Microservizio responsabile dei documenti associati ai ricoveri: metadata in una
collection MongoDB dedicata e contenuto binario in MongoDB GridFS.

Ogni nuovo documento viene creato con stato `PENDING`. L'amministratore può
avviare o ripetere l'estrazione sincrona tramite OCR Service.

## Responsabilità

- validazione e upload multipart;
- verifica del ricovero tramite Patient Service;
- derivazione sicura del `patientId` dal ricovero;
- archiviazione del contenuto in GridFS;
- archiviazione e consultazione metadata;
- download e cancellazione completa;
- ricerca testuale e per filtri;
- statistiche documentali e stati OCR;
- invio del contenuto GridFS a OCR Service e persistenza del testo estratto;
- generazione MVP della struttura OCR (`ocrExtraction`) per il frontend;
- marcatura del documento come archiviato nella cartella del ricovero
  (`filedInRecord`).

## Tecnologie

- Java 11;
- Spring Boot 2.2.4.RELEASE;
- Spring Web, Security OAuth2 e Data MongoDB;
- MongoDB 6 e GridFS;
- Springfox Swagger 2.9.2;
- Maven, JUnit 5 e Mockito.

Versioni e stile seguono Auth Gateway e Patient Service. Usare JDK 11: lo stack
OAuth2 ereditato non è compatibile in modo affidabile con JDK 21.

## Struttura

```text
src/main/java/it/projectwork/documed/documentservice/
├── client/       chiamate esplicite a Patient Service e OCR Service
├── config/       JWT, HTTP client e Swagger
├── controller/   API ricovero e documenti
├── domain/       metadata ed enum
├── dto/          upload, ricerca, contenuto, risposte e statistiche
├── error/        eccezioni e formato errori
├── repository/   repository metadata MongoDB
└── service/      regole applicative e boundary GridFS
src/main/resources/
└── application.yml
```

## Persistenza

Database MongoDB: `document_service`.

La collection `documents` contiene:

```text
id
gridFsFileId
patientId
admissionId
documentType
originalFilename
description
contentType
fileSize
ocrStatus
extractedText
ocrErrorMessage
uploadedAt
processedAt
filedInRecord
ocrExtraction
```

GridFS usa le collection standard `fs.files` e `fs.chunks`. La collection
metadata non contiene bytes. `gridFsFileId` collega i due livelli.

Sono creati indici per GridFS id, paziente, ricovero, tipo, stato OCR, data di
upload e un indice testuale composto su nome file, descrizione e testo estratto.

## Regole applicative

- `patientId` non è accettato dall'upload: viene derivato da
  `GET /api/admissions/{admissionId}` del Patient Service;
- il Bearer token ricevuto viene propagato a Patient Service e OCR Service;
- MIME consentiti: `image/png`, `image/jpeg`, `application/pdf`;
- il MIME dichiarato viene confrontato con la firma binaria PNG/JPEG/PDF;
- dimensione massima predefinita: 10 MB;
- il nome originale viene ripulito da path e caratteri di controllo;
- dopo il salvataggio GridFS, un errore metadata elimina immediatamente il
  contenuto appena creato;
- la cancellazione rimuove prima GridFS e poi metadata, permettendo un retry
  sicuro se il secondo passaggio fallisce;
- il primo stato OCR è `PENDING`;
- l'elaborazione segue `PROCESSING → COMPLETED` oppure `PROCESSING → FAILED`;
- in caso di errore il file GridFS resta disponibile e l'OCR può essere ripetuto;
- lo stack trace non viene salvato: `ocrErrorMessage` contiene solo un messaggio
  sintetico.
- dopo l'OCR la tipologia proposta può essere corretta dall'operatore con
  `PATCH /api/documents/{id}/ocr`; la scelta manuale diventa il valore
  autoritativo salvato nei metadati.
- `filedInRecord=false` dopo upload; `POST /api/documents/{id}/file-in-record`
  lo porta a `true` in modo idempotente.
- `ocrExtraction` è una struttura MVP costruita dal testo OCR con regole
  trasparenti: classificazione per parole chiave, campi base e risoluzione
  paziente da confermare manualmente. Non esegue diagnosi, classificazione
  clinica o NLP avanzato.

## Endpoint

| Metodo | Path | Scopo |
|---|---|---|
| `POST` | `/api/admissions/{admissionId}/documents` | upload multipart |
| `GET` | `/api/admissions/{admissionId}/documents` | documenti di un ricovero |
| `GET` | `/api/documents` | lista documenti |
| `GET` | `/api/documents/search?query=&patientId=&admissionId=&documentType=&ocrStatus=` | ricerca e filtri |
| `GET` | `/api/documents/{documentId}` | metadata documento |
| `GET` | `/api/documents/{documentId}/content` | download file GridFS |
| `DELETE` | `/api/documents/{documentId}` | elimina metadata e GridFS |
| `POST` | `/api/documents/{documentId}/ocr` | esegue/ripete OCR |
| `GET` | `/api/documents/{documentId}/ocr` | stato OCR e testo/struttura |
| `PATCH` | `/api/documents/{documentId}/ocr` | conferma/corregge tipologia e struttura OCR |
| `POST` | `/api/documents/{documentId}/file-in-record` | archivia in cartella clinica |
| `GET` | `/api/documents/statistics` | KPI documenti/OCR |

Risposta OCR essenziale:

```json
{
  "documentId": "665...",
  "ocrStatus": "COMPLETED",
  "extractedText": "Testo grezzo...",
  "ocrExtraction": {
    "title": "Modulo di ricovero",
    "fields": [
      {
        "key": "fiscalCode",
        "label": "Codice fiscale",
        "value": "RSSMRC80A01H501W",
        "confidence": 0.8,
        "source": "ocr",
        "editable": false
      }
    ],
    "bodyText": "Testo grezzo...",
    "classification": {
      "type": "ADMISSION_FORM",
      "confidence": 0.75,
      "status": "AUTO",
      "candidates": [{ "type": "ADMISSION_FORM", "confidence": 0.75 }]
    },
    "resolution": {
      "patientId": 1,
      "doctorId": null,
      "admissionId": 10,
      "patientMatch": {
        "status": "REVIEW",
        "score": 0.5,
        "extractedName": null,
        "extractedFiscalCode": "RSSMRC80A01H501W",
        "candidates": [1]
      }
    }
  },
  "ocrErrorMessage": null,
  "processedAt": "2026-06-28T19:00:00Z"
}
```

## Configurazione

| Variabile | Obbligatoria | Descrizione |
|---|---:|---|
| `MONGODB_URI` | sì | URI del database `document_service` |
| `JWT_SIGNING_KEY` | sì | stessa chiave HMAC dell'Auth Gateway |
| `PATIENT_SERVICE_URL` | no | Patient Service, default `http://localhost:8081` |
| `SERVER_PORT` | no | porta applicativa, default `8082` |
| `DOCUMENT_MAX_FILE_SIZE` | no | limite multipart servlet, default `10MB` |
| `DOCUMENT_MAX_REQUEST_SIZE` | no | limite richiesta multipart, default `11MB` |
| `DOCUMENT_MAX_FILE_SIZE_BYTES` | no | limite applicativo, default `10485760` |
| `PATIENT_SERVICE_CONNECT_TIMEOUT_MS` | no | timeout connessione, default `3000` |
| `PATIENT_SERVICE_READ_TIMEOUT_MS` | no | timeout risposta, default `5000` |
| `OCR_SERVICE_URL` | no | OCR Service, default `http://localhost:8083` |
| `OCR_SERVICE_CONNECT_TIMEOUT_MS` | no | timeout connessione OCR, default `3000` |
| `OCR_SERVICE_READ_TIMEOUT_MS` | no | timeout OCR, default `65000` |

`.env.example` usa esclusivamente valori locali dimostrativi. Non committare
`.env` e mantenere `JWT_SIGNING_KEY` identica nei servizi.

## Sicurezza

Tutti gli endpoint `/api/**` richiedono un JWT valido con `ROLE_ADMIN` e
audience `platform-api`. Document Service verifica il token anche sulla porta
diretta `8082`; il gateway lo verifica e inoltra a sua volta.
