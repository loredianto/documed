# Documed Patient Service

Microservizio responsabile dell'anagrafica pazienti, del ciclo di vita dei
ricoveri e delle statistiche necessarie alla dashboard amministrativa.

Non contiene documenti clinici, OCR o funzionalità di autenticazione. Riceve e
valida i JWT emessi dall'Auth Gateway.

## Responsabilità

- registrazione, lettura e modifica pazienti;
- apertura e storico ricoveri;
- dimissione di un ricovero attivo;
- statistiche di pazienti, ingressi e dimissioni;
- validazione degli input e gestione coerente degli errori.

## Tecnologie

- Java 11;
- Spring Boot 2.2.4.RELEASE;
- Spring Web, Security OAuth2 e Data JPA;
- PostgreSQL 15;
- Flyway;
- Springfox Swagger 2.9.2;
- Maven;
- JUnit 5, MockMvc e H2 per i test.

La versione di Java e Spring Boot segue l'Auth Gateway esistente. Usare JDK 11:
lo stack OAuth2 legacy non è compatibile in modo affidabile con JDK 21.

## Struttura

```text
src/main/java/it/projectwork/documed/patientservice/
├── config/       JWT, errori di sicurezza e Swagger
├── controller/   API pazienti e ricoveri
├── domain/       entità JPA e stato ricovero
├── dto/          richieste e risposte REST esplicite
├── error/        formato errori ed exception handler
├── repository/   repository Spring Data JPA
└── service/      regole applicative
src/main/resources/
├── application.yml
└── db/migration/V1__create_patient_and_admission_tables.sql
```

## Modello e regole

`Patient` contiene dati anagrafici minimi. `Admission` appartiene a un solo
paziente e può essere `ACTIVE` o `DISCHARGED`.

Regole applicate sia nel servizio sia, dove possibile, in PostgreSQL:

- codice fiscale normalizzato in maiuscolo e univoco;
- un solo ricovero attivo per paziente;
- un ricovero può essere dimesso una sola volta;
- la dimissione non può precedere l'ingresso;
- ricovero attivo senza data di dimissione;
- ricovero dimesso con data di dimissione obbligatoria.

Le date di ingresso e dimissione sono `LocalDate`. Gli audit `createdAt` e
`updatedAt` sono timestamp UTC. Le statistiche giornaliere usano il fuso
configurato da `APP_TIME_ZONE`.

## Configurazione

| Variabile | Obbligatoria | Descrizione |
|---|---:|---|
| `DATABASE_URL` | sì | JDBC URL PostgreSQL |
| `DATABASE_USERNAME` | sì | utente PostgreSQL |
| `DATABASE_PASSWORD` | sì | password PostgreSQL |
| `JWT_SIGNING_KEY` | sì | stessa chiave HMAC dell'Auth Gateway, minimo 32 caratteri |
| `SERVER_PORT` | no | porta applicativa, default `8081` |
| `APP_TIME_ZONE` | no | fuso delle statistiche giornaliere, default `Europe/Rome` |

`PATIENT_SERVICE_PORT` è usata dal Compose del modulo. Le variabili
`POSTGRES_*` appartengono invece a `DBs/PostgreSQL/.env`. I file
`.env.example` contengono esclusivamente valori dimostrativi locali. Non
committare `.env`.

## Sicurezza

Tutti gli endpoint `/api/**` richiedono un JWT valido con `ROLE_ADMIN` e
audience `platform-api`. Il gateway inoltra l'header:

```http
Authorization: Bearer <access-token>
```

Il servizio ripete la validazione per evitare che una chiamata diretta alla
porta `8081` aggiri il gateway. `JWT_SIGNING_KEY` deve quindi coincidere nei due
servizi.

## Avvio locale

Creare la rete condivisa una sola volta:

```bash
docker network inspect platform-network >/dev/null 2>&1 || \
  docker network create platform-network
```

Avviare PostgreSQL dal modulo database dedicato:

```bash
cd ../../DBs/PostgreSQL
cp .env.example .env
docker compose up -d

cd ../../BackEnd/documed-patient-service
```

Avviare l'applicazione dalla macchina host, usando la stessa chiave del gateway:

```bash
DATABASE_URL='jdbc:postgresql://localhost:5432/documed_patient' \
DATABASE_USERNAME='documed' \
DATABASE_PASSWORD='documed-local-password' \
JWT_SIGNING_KEY='replace-with-the-same-auth-gateway-secret-32-chars' \
APP_TIME_ZONE='Europe/Rome' \
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn spring-boot:run
```

Flyway applica automaticamente le migrazioni. Hibernate usa
`ddl-auto=validate` e non crea lo schema.

## Avvio Docker

Per lo stack completo usare dalla root `docker compose up --build -d`. Il
Compose del modulo serve solo allo sviluppo isolato.

```bash
cd DBs/PostgreSQL
cp .env.example .env
docker compose up -d

cd ../../BackEnd/documed-patient-service
cp .env.example .env
# Inserire in .env la stessa JWT_SIGNING_KEY usata dall'Auth Gateway.

JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn clean package

docker compose up --build
```

PostgreSQL è gestito esclusivamente da `DBs/PostgreSQL` ed è esposto su `5432`
per lo sviluppo locale. Patient Service ascolta su `8081` ed è raggiunto dal
gateway tramite il nome Compose `patient-service`. I dati PostgreSQL restano
nel volume `platform-postgres-data`.

## Endpoint

| Metodo | Percorso | Risposta | Descrizione |
|---|---|---:|---|
| `POST` | `/api/patients` | `201` | Registra un paziente |
| `GET` | `/api/patients` | `200` | Elenca i pazienti |
| `GET` | `/api/patients/{patientId}` | `200` | Legge un paziente |
| `PUT` | `/api/patients/{patientId}` | `200` | Modifica un paziente |
| `POST` | `/api/patients/{patientId}/admissions` | `201` | Apre un ricovero |
| `GET` | `/api/patients/{patientId}/admissions` | `200` | Storico ricoveri |
| `GET` | `/api/admissions/{admissionId}` | `200` | Legge un ricovero |
| `POST` | `/api/admissions/{admissionId}/discharge` | `200` | Dimette un ricovero |
| `GET` | `/api/patients/statistics` | `200` | Statistiche dashboard |

Swagger diretto:

- `http://localhost:8081/swagger-ui.html`;
- `http://localhost:8081/v2/api-docs`.

## Esempio completo

Le chiamate applicative devono normalmente passare dal gateway:

```bash
export BASE_URL='http://localhost:8282'
export TOKEN='<jwt-admin>'

curl -i -X POST "$BASE_URL/api/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Paziente",
    "lastName": "Dimostrativo",
    "fiscalCode": "RSSMRA80A01H501U",
    "birthDate": "1980-01-01",
    "email": "patient@example.local",
    "phone": "+39 010 0000000"
  }'

curl -i -X POST "$BASE_URL/api/patients/1/admissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "admissionDate": "2026-06-20",
    "department": "Reparto dimostrativo",
    "notes": "Dati sintetici"
  }'

curl -i -X POST "$BASE_URL/api/admissions/1/discharge" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"dischargeDate":"2026-06-20"}'
```

Gli esempi contengono esclusivamente dati sintetici.

## Errori

Gli errori non espongono stack trace:

```json
{
  "timestamp": "2026-06-20T12:00:00Z",
  "status": 409,
  "error": "Conflict",
  "code": "ADMISSION_ALREADY_DISCHARGED",
  "message": "Il ricovero è già stato dimesso",
  "path": "/api/admissions/1/discharge"
}
```

Gli errori di validazione aggiungono `fieldErrors` con un messaggio per campo.

## Test

```bash
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn test
```

I test coprono creazione paziente, duplicato, apertura ricovero, secondo ricovero
attivo, dimissione, seconda dimissione, ricovero inesistente, data non valida,
statistiche, protezione JWT e validazione HTTP.

## Decisioni e limiti

- nessun mapper automatico o Lombok: trasformazioni DTO esplicite;
- nessun repository generico o livello architetturale aggiuntivo;
- indice PostgreSQL parziale per rendere atomico il vincolo del ricovero attivo;
- lista pazienti non paginata nella prima versione, coerentemente col flusso minimo;
- statistiche calcolate con query di conteggio semplici, adeguate al prototipo;
- autenticazione basata sul JWT HMAC legacy del gateway esistente;
- nessun dato clinico, documento, OCR o funzione frontend in questo modulo.

## Problemi noti

- JDK 21 non è supportato dallo stack OAuth2 ereditato: usare JDK 11;
- Flyway 6.0.8, gestito da Spring Boot 2.2.4, segnala PostgreSQL 15 come più
  recente della propria matrice ufficiale. La migrazione V1 è stata comunque
  eseguita e validata con successo sul container PostgreSQL 15 configurato.
