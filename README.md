# DocuMed

DocuMed è una piattaforma full-stack per il percorso amministrativo e documentale di un paziente: registrazione, ricovero, archiviazione GridFS, OCR Tesseract, ricerca del testo e dimissione. Il progetto usa un unico ruolo applicativo, `ADMIN`, e dati esclusivamente sintetici.

## Architettura

```text
React SPA (nginx)
        |
        v
Auth Service / API Gateway :8282
        |
        +--> Patient Service :8081 --> PostgreSQL
        |
        +--> Document Service :8082 --> MongoDB + GridFS
                         |
                         +--> OCR Service :8083 --> Tesseract ita
```

Il browser comunica soltanto con il gateway. Document Service deriva il `patientId` dal ricovero interrogando Patient Service e invia sincronicamente il file GridFS a OCR Service. Non sono presenti broker o aggregatori dashboard.

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

Utente e client vengono inseriti nelle collection MongoDB solo alla prima inizializzazione del volume; non esistono utenti in memoria o registrazione pubblica. Fuori dall'ambiente locale sostituire tutte le credenziali e la `JWT_SIGNING_KEY`.

## Servizi e porte

| Servizio | Porta container | Porta host | Persistenza |
|---|---:|---:|---|
| frontend | 80 | 3000 | — |
| auth-gateway | 8282 | 8282 | MongoDB `auth_service` |
| patient-service | 8081 | interna | PostgreSQL |
| document-service | 8082 | interna | MongoDB + GridFS |
| ocr-service | 8083 | interna | nessuna |
| postgres | 5432 | interna | `documed-postgres-data` |
| mongodb | 27017 | interna | `documed-mongodb-data` |

Swagger del gateway: `http://localhost:8282/swagger-ui.html`. Le porte interne non sono pubblicate per ridurre la superficie esposta.

## Flusso end-to-end

1. login ADMIN e ricezione JWT;
2. dashboard alimentata da statistiche reali;
3. registrazione o ricerca paziente;
4. apertura ricovero;
5. upload PNG/JPEG/PDF in GridFS;
6. OCR sincrono per PNG/JPEG con lingua italiana;
7. visualizzazione e ricerca del testo estratto;
8. download del file originale;
9. dimissione e aggiornamento dashboard.

Esempio login:

```bash
curl -u 'documed-web:DocuMedWebDemo123!' \
  -X POST http://localhost:8282/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode grant_type=password \
  --data-urlencode username=admin \
  --data-urlencode 'password=AdminDemo123!'
```

Usare l'`access_token` restituito come `Authorization: Bearer <token>` sulle API.

## Endpoint principali

### Auth Gateway

- `POST /oauth/token`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Pazienti e ricoveri

- `POST|GET /api/patients`
- `GET|PUT /api/patients/{patientId}`
- `POST|GET /api/patients/{patientId}/admissions`
- `GET /api/admissions/{admissionId}`
- `POST /api/admissions/{admissionId}/discharge`
- `GET /api/patients/statistics`

### Documenti e OCR

- `POST|GET /api/admissions/{admissionId}/documents`
- `GET /api/documents`
- `GET|DELETE /api/documents/{documentId}`
- `GET /api/documents/{documentId}/content`
- `POST|GET /api/documents/{documentId}/ocr`
- `GET /api/documents/search`
- `GET /api/documents/statistics`
- interno: `POST /internal/ocr/extract`

## Build e test manuali

Backend, sempre con Java 11:

```bash
cd BackEnd/documed-patient-service
mvn clean test
```

Ripetere per gli altri tre moduli. Frontend:

```bash
cd FrontEnd/documed-frontend
npm ci
npm test
npm run build
```

## Dati e amministratori

Il repository non contiene dati sanitari reali. Le stringhe usate da test e demo sono sintetiche. Gli amministratori risiedono in `auth_service.users`; i client OAuth2 in `auth_service.oauth_clients`. Per aggiungere utenti generare una password BCrypt e inserire un documento con `activated: true` e `authorities: ["ROLE_ADMIN"]`, come descritto nel README Auth.

## Limiti

- OAuth2 password grant è mantenuto per compatibilità con il gateway legacy; il client secret inserito nella SPA è identificativo, non un segreto proteggibile.
- JWT HMAC non dispone di revoca server-side: il logout elimina il token dal browser.
- OCR è sincrono e supporta PNG/JPEG; PDF è archiviabile ma non elaborato.
- Qualità OCR dipende da risoluzione, contrasto e orientamento.
- La ricerca pazienti frontend è locale e non paginata.
- Spring Boot 2.2/Spring Cloud Hoxton sono mantenuti per compatibilità e richiedono Java 11; un upgrade è uno sviluppo futuro.