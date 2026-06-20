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
- invio del contenuto GridFS a OCR Service e persistenza del testo estratto.

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

## Avvio locale

Avviare MongoDB dalla configurazione condivisa esistente:

```bash
cd DBs/MongoDB
cp .env.example .env
docker compose up -d
```

Avviare PostgreSQL e Patient Service seguendo il relativo README. Poi, dalla
cartella `BackEnd/documed-document-service`:

```bash
MONGODB_URI='mongodb://platform:platform-local-password@localhost:27017/document_service?authSource=admin' \
JWT_SIGNING_KEY='replace-with-the-same-auth-gateway-secret-32-chars' \
PATIENT_SERVICE_URL='http://localhost:8081' \
OCR_SERVICE_URL='http://localhost:8083' \
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn spring-boot:run
```

## Avvio Docker

Per lo stack completo usare dalla root `docker compose up --build -d`. Il
Compose del modulo serve solo allo sviluppo isolato.

Da root repository:

```bash
cd DBs/MongoDB
cp .env.example .env
docker compose up -d

cd ../../BackEnd/documed-ocr-service
cp .env.example .env
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn clean package
docker compose up --build -d

cd ../documed-document-service
cp .env.example .env
# Inserire in .env la stessa JWT_SIGNING_KEY usata dall'Auth Gateway.

JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn clean package

docker compose up --build
```

Il Compose del modulo contiene solo `document-service`. MongoDB rimane nel
singolo Compose condiviso `DBs/MongoDB/docker-compose.yml` e non viene duplicato.

## Endpoint

| Metodo | Percorso | Risposta | Descrizione |
|---|---|---:|---|
| `POST` | `/api/admissions/{admissionId}/documents` | `201` | Upload multipart |
| `GET` | `/api/admissions/{admissionId}/documents` | `200` | Documenti del ricovero |
| `GET` | `/api/documents` | `200` | Tutti i metadata |
| `GET` | `/api/documents/{documentId}` | `200` | Metadata documento |
| `GET` | `/api/documents/{documentId}/content` | `200` | Download contenuto |
| `DELETE` | `/api/documents/{documentId}` | `204` | Elimina metadata e GridFS |
| `GET` | `/api/documents/search` | `200` | Ricerca e filtri |
| `GET` | `/api/documents/statistics` | `200` | Conteggi tipo e stato OCR |
| `POST` | `/api/documents/{documentId}/ocr` | `200` | Avvia o ripete OCR |
| `GET` | `/api/documents/{documentId}/ocr` | `200` | Stato e testo OCR |

Swagger diretto:

- `http://localhost:8082/swagger-ui.html`;
- `http://localhost:8082/v2/api-docs`.

## Esempi curl

Le chiamate applicative passano normalmente dal gateway:

```bash
export BASE_URL='http://localhost:8282'
export TOKEN='<jwt-admin>'

UPLOAD=$(curl -sS -X POST "$BASE_URL/api/admissions/1/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@/percorso/immagine-sintetica.png;type=image/png' \
  -F 'documentType=MEDICAL_REPORT' \
  -F 'description=Documento sintetico dimostrativo')

DOCUMENT_ID=$(printf '%s' "$UPLOAD" | jq -r '.id')

curl -sS -X POST "$BASE_URL/api/documents/$DOCUMENT_ID/ocr" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -sS "$BASE_URL/api/documents/$DOCUMENT_ID/ocr" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -sS "$BASE_URL/api/admissions/1/documents" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -sS "$BASE_URL/api/documents/document-id" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -sS "$BASE_URL/api/documents/document-id/content" \
  -H "Authorization: Bearer $TOKEN" \
  -o documento-scaricato.pdf

curl -sS --get "$BASE_URL/api/documents/search" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'query=referto' \
  --data-urlencode 'admissionId=1' | jq

curl -sS "$BASE_URL/api/documents/statistics" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -i -X DELETE "$BASE_URL/api/documents/document-id" \
  -H "Authorization: Bearer $TOKEN"
```

Usare soltanto file e dati sintetici, mai documenti sanitari reali.

## Errori

Esempio:

```json
{
  "timestamp": "2026-06-20T12:00:00Z",
  "status": 415,
  "error": "Unsupported Media Type",
  "code": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Sono supportati solo file PNG, JPEG e PDF",
  "path": "/api/admissions/1/documents"
}
```

Gli errori Patient Service diventano `404` per ricovero inesistente oppure
`502` per indisponibilità/risposta invalida. Stack trace e contenuti non vengono
restituiti o registrati nei log.

## Test

```bash
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn test
```

I test coprono upload, MIME, dimensione, firma contenuto, ricovero inesistente,
metadata, download, cancellazione, compensazione GridFS, ricerca, statistiche,
transizioni OCR riuscite/fallite, retry e rielaborazione.

## Decisioni e limiti

- nessun mapper automatico, Lombok o pattern infrastrutturale aggiuntivo;
- PDF viene archiviato e scaricato, ma non convertito né elaborato;
- OCR sincrono: nessun broker, coda o job distribuito;
- ricerca testuale nativa MongoDB, senza Elasticsearch, massimo 500 risultati;
- contenuto caricato in memoria dopo il limite di 10 MB per mantenere semplice
  validazione firma e download;
- il MongoDB singolo locale non supporta una transazione unica tra GridFS e
  metadata: viene usata compensazione esplicita;
- nessun dato clinico reale incluso nel repository.

## Problemi noti

- il container MongoDB locale esistente può risultare `unhealthy` se le
  credenziali presenti nel volume non coincidono con il file `.env`; riallineare
  le credenziali senza cancellare il volume se contiene dati da preservare;
- JDK 21 non è supportato dallo stack OAuth2 legacy: usare JDK 11;
- PDF non supportato dall'OCR; caricarlo resta possibile, ma la richiesta OCR
  produce `FAILED` e può essere ripetuta con un'immagine supportata;
- qualità OCR dipendente da risoluzione, contrasto e orientamento dell'immagine.
