# DocuMed

DocuMed è una piattaforma full-stack per il percorso amministrativo e documentale di un paziente: registrazione, ricovero, archiviazione GridFS, OCR Tesseract, ricerca del testo e dimissione.

## Architettura

```text
React SPA (nginx)
        |
        v
Auth Service / API Gateway :8282
        +--> PostgreSQL schema auth_service
        |
        +--> Patient Service :8081 --> PostgreSQL
        |
        +--> Document Service :8082 --> MongoDB + GridFS
                         |
                         +--> OCR Service :8083 --> Tesseract ita
```

Il browser comunica con API Gateway. Document Service estrae il `patientId` dal ricovero interrogando Patient Service e invia il file GridFS a OCR Service che ne estrapola il testo tramite uso di Tesseract.

## Moduli

- [Auth Gateway](BackEnd/documed-auth-gateway/README.md)
- [Patient Service](BackEnd/documed-patient-service/README.md)
- [Document Service](BackEnd/documed-document-service/README.md)
- [OCR Service](BackEnd/documed-ocr-service/README.md)
- [Frontend](FrontEnd/documed-frontend/README.md)
- [Infrastruttura](Infrastructure/README.md)

## Prerequisiti

Per l'avvio completo è sufficiente Docker Engine con Docker Compose v2. Per lo sviluppo servono inoltre Java 11, Maven 3.8+ e Node.js 20.19+.

## Quick start

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Aprire `http://localhost:3000`.

Credenziali esclusivamente locali:

- utente ADMIN: `admin`
- password: `AdminDemo123!`
- client OAuth2 SPA: `documed-web`
- secret client demo: `DocuMedWebDemo123!`

Utente e client vengono inseriti nelle tabelle PostgreSQL dello schema
`auth_service` dalla migrazione Flyway iniziale; non esistono utenti in memoria
o registrazione pubblica. Fuori dall'ambiente locale lasciare vuote le variabili
demo e sostituire tutte le credenziali e la `JWT_SIGNING_KEY`.

## Servizi e porte

| Servizio | Porta container | Porta host | Persistenza |
|---|---:|---:|---|
| frontend | 80 | 3000 | — |
| auth-gateway | 8282 | 8282 | PostgreSQL, schema `auth_service` |
| patient-service | 8081 | interna | PostgreSQL, schema `public` |
| document-service | 8082 | interna | MongoDB + GridFS |
| ocr-service | 8083 | interna | nessuna |
| postgres | 5432 | interna | utenti, client OAuth2, pazienti e ricoveri |
| mongodb | 27017 | interna | metadati documenti e GridFS |

Swagger del gateway: `http://localhost:8282/swagger-ui.html`. Le porte interne non sono pubblicate per ridurre la superficie esposta.

## Flusso end-to-end

1. login ADMIN e ricezione JWT;
2. dashboard alimentata da statistiche reali;
3. registrazione o ricerca paziente;
4. apertura ricovero;
5. upload PNG/JPEG/PDF in GridFS;
6. OCR sincrono per PNG/JPEG con lingua italiana;
7. confronto affiancato tra documento originale e testo estratto, con ricerca;
8. download del file originale;
9. dimissione e aggiornamento dashboard.


## Endpoint principali

### Auth Gateway

- `POST /oauth/token`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Pazienti e ricoveri

- `POST|GET /api/patients`
- `GET|PUT|DELETE /api/patients/{patientId}`
- `POST|GET /api/patients/{patientId}/admissions`
- `GET /api/admissions`
- `GET /api/admissions/{admissionId}`
- `POST /api/admissions/{admissionId}/discharge`
- `DELETE /api/admissions/{admissionId}`
- `GET /api/patients/statistics`
- `GET /api/patients/statistics/activity`
- `GET /api/clinicians`

### Documenti e OCR

- `POST|GET /api/admissions/{admissionId}/documents`
- `GET /api/documents`
- `GET|DELETE /api/documents/{documentId}`
- `GET /api/documents/{documentId}/content`
- `POST|GET|PATCH /api/documents/{documentId}/ocr`
- `POST /api/documents/{documentId}/file-in-record`
- `GET /api/documents/search`
- `GET /api/documents/statistics`
- interno: `POST /internal/ocr/extract`

## Dati e amministratori

Il repository non contiene dati sanitari reali. Le stringhe usate da test e demo
sono fittizie. Amministratori e client OAuth2 sono gestiti direttamente nelle
tabelle dello schema PostgreSQL `auth_service`; gli esempi SQL sono nel
[README dell'Auth Gateway](BackEnd/documed-auth-gateway/README.md).
