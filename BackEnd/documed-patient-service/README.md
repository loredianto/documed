# Documed Patient Service

Microservizio responsabile dell'anagrafica pazienti, del ciclo di vita dei
ricoveri e delle statistiche necessarie alla dashboard amministrativa.

Non contiene documenti clinici, OCR o funzionalità di autenticazione. Riceve e
valida i JWT emessi dall'Auth Gateway.

## Responsabilità

- registrazione, lettura e modifica pazienti;
- apertura e storico ricoveri;
- elenco globale dei ricoveri per workspace accettazione;
- dimissione di un ricovero attivo;
- statistiche di pazienti, ingressi e dimissioni, anche per intervallo;
- elenco read-only dei clinici/medici firmatari selezionabili;
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
├── controller/   API pazienti, ricoveri e lookup clinici
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
- un paziente può essere eliminato solo se non ha ricoveri registrati. Questa
  scelta evita cartelle/documenti orfani tra microservizi.

Le date di ingresso e dimissione sono `LocalDate`. Gli audit `createdAt` e
`updatedAt` sono timestamp UTC. Le statistiche giornaliere usano il fuso
configurato da `APP_TIME_ZONE`.

## Endpoint

| Metodo | Path | Scopo |
|---|---|---|
| `GET` | `/api/patients` | lista pazienti |
| `POST` | `/api/patients` | crea paziente |
| `GET` | `/api/patients/{patientId}` | dettaglio paziente |
| `PUT` | `/api/patients/{patientId}` | modifica paziente |
| `DELETE` | `/api/patients/{patientId}` | elimina paziente senza ricoveri |
| `GET` | `/api/patients/{patientId}/admissions` | ricoveri di un paziente |
| `POST` | `/api/patients/{patientId}/admissions` | apre ricovero |
| `GET` | `/api/admissions` | lista globale ricoveri |
| `GET` | `/api/admissions/{admissionId}` | dettaglio ricovero |
| `POST` | `/api/admissions/{admissionId}/discharge` | dimette ricovero |
| `DELETE` | `/api/admissions/{admissionId}` | elimina ricovero |
| `GET` | `/api/patients/statistics` | KPI dashboard |
| `GET` | `/api/patients/statistics/activity?from=YYYY-MM-DD&to=YYYY-MM-DD` | ingressi/dimissioni per intervallo |
| `GET` | `/api/clinicians` | lookup clinici/medici firmatari |

`/api/clinicians` è una lista statica locale al servizio: non rappresenta
utenti applicativi e non introduce ruoli oltre `ADMIN`.

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
