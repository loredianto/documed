# Auth Service / API Gateway

## Scopo

Servizio Spring Boot per:

- autenticare amministratori con ruolo applicativo, `ROLE_ADMIN`;
- generare e verificare JWT firmati;
- proteggere tutte le API applicative con `ROLE_ADMIN`;
- inoltrare le API verso Patient Service e Document Service;
- applicare CORS centralmente.

## Tecnologie e compatibilità

- Java 11;
- Maven Wrapper 3.8.7;
- Spring Boot 2.2.4.RELEASE;
- Spring Cloud Hoxton.SR1;
- Spring Security OAuth2 legacy;
- Netflix Zuul;
- Spring Data JPA e Flyway;
- PostgreSQL 15;
- Springfox Swagger 2.9.2.


## Struttura

```text
src/main/java/it/projectwork/documed/authservice/
├── config/       JWT, security, CORS e Swagger
├── controller/   endpoint amministratore
├── domain/       utente e client OAuth2
├── repository/   persistenza JPA di utenti e client OAuth2
└── service/      UserDetails e client details
src/main/resources/
├── db/migration/ schema e dati demo opzionali
└── application.yml
```

## Variabili d'ambiente

Vedere [`.env.example`](.env.example).

| Variabile | Obbligatoria | Descrizione |
|---|---:|---|
| `DATABASE_URL` | sì | JDBC URL PostgreSQL |
| `DATABASE_USERNAME` | sì | utente PostgreSQL |
| `DATABASE_PASSWORD` | sì | password PostgreSQL |
| `DEMO_ADMIN_USERNAME` | no | username ADMIN demo creato dalla migrazione iniziale |
| `DEMO_ADMIN_PASSWORD_HASH` | no | password ADMIN demo in formato BCrypt |
| `DEMO_OAUTH_CLIENT_ID` | no | identificativo client OAuth2 demo |
| `DEMO_OAUTH_CLIENT_SECRET_HASH` | no | secret client demo in formato BCrypt |
| `JWT_SIGNING_KEY` | sì | Segreto HMAC, minimo 32 caratteri |
| `CORS_ALLOWED_ORIGINS` | no | Origini separate da virgola |
| `PATIENT_SERVICE_URL` | no in locale | Destinazione Patient Service |
| `DOCUMENT_SERVICE_URL` | no in locale | Destinazione Document Service |
| `GATEWAY_CONNECT_TIMEOUT_MS` | no | Timeout connessione proxy, default `5000` |
| `GATEWAY_SOCKET_TIMEOUT_MS` | no | Timeout risposta proxy, default `75000` |
| `GATEWAY_MAX_FILE_SIZE` | no | File massimo inoltrato, default `10MB` |
| `GATEWAY_MAX_REQUEST_SIZE` | no | Limite multipart, default `11MB` |


## Gestione utenti e client OAuth2

PostgreSQL usa uno schema separato `auth_service` nello stesso database del
Patient Service:

- tabella `auth_service.users` per amministratori;
- tabella `auth_service.oauth_clients` per client OAuth2;
- tabella `auth_service.flyway_schema_history` per le migrazioni Auth.

Lo schema `public` resta di competenza del Patient Service. `username` e
`client_id` hanno vincoli univoci. Password e client secret sono salvati solo
come hash BCrypt; la chiave JWT non viene salvata nel database.

La migrazione `V2__insert_local_demo_auth.sql` inserisce le righe demo solo
quando le quattro variabili `DEMO_*` sono valorizzate al primo avvio. Non esiste
registrazione pubblica e l'applicazione non crea utenti in memoria.

Per aggiungere un amministratore successivo, generare l'hash BCrypt e inserire
la riga direttamente nel database:

```bash
htpasswd -bnBC 10 admin2 'password-locale' | cut -d: -f2
```

```sql
INSERT INTO auth_service.users (username, password, activated, authority)
VALUES ('admin2', '<hash-bcrypt>', TRUE, 'ROLE_ADMIN');
```

Anche un nuovo client OAuth2 deve avere un secret BCrypt:

```sql
INSERT INTO auth_service.oauth_clients (
    client_id, client_secret, grant_types, scopes, resources,
    access_token_validity, refresh_token_validity
) VALUES (
    'nuovo-client', '<hash-bcrypt>', 'password,refresh_token',
    'read,write', 'platform-api', 3600, 86400
);
```

I documenti eventualmente presenti nel vecchio database MongoDB
`auth_service` non vengono importati automaticamente: i relativi utenti e
client devono essere ricreati con gli hash originali oppure sostituiti.

## Avvio locale

Avviare prima PostgreSQL:

```bash
cd DBs/PostgreSQL
cp .env.example .env
docker compose up -d
```

Avviare il servizio con JDK 11:

```bash
cd BackEnd/documed-auth-gateway
DATABASE_URL='jdbc:postgresql://localhost:5432/documed_patient' \
DATABASE_USERNAME='documed' \
DATABASE_PASSWORD='documed-local-password' \
JWT_SIGNING_KEY='replace-with-random-secret-at-least-32-characters' \
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
sh mvnw spring-boot:run
```

Il servizio ascolta su `http://localhost:8282`.

## Avvio Docker

Per lo stack completo usare dalla root `docker compose up --build -d`. Il
Compose di questo modulo resta disponibile per lo sviluppo isolato.

PostgreSQL deve essere disponibile sulla rete condivisa `platform-network`:

```bash
cd DBs/PostgreSQL
cp .env.example .env
docker compose up -d

cd ../../BackEnd/documed-auth-gateway
cp .env.example .env
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
sh mvnw clean package
docker compose up --build
```

## Endpoint disponibili

| Metodo | Percorso | Autorizzazione | Scopo |
|---|---|---|---|
| `POST` | `/oauth/token` | Basic OAuth client | Login/refresh JWT |
| `POST` | `/oauth/check_token` | Basic OAuth client | Verifica firma, scadenza e claim |
| `GET` | `/api/auth/me` | Bearer `ROLE_ADMIN` | Identità corrente |
| `POST` | `/api/auth/logout` | Bearer `ROLE_ADMIN` | Conferma logout client-side |
| `GET` | `/v2/api-docs` | pubblico | Specifica Swagger JSON |
| `GET` | `/swagger-ui.html` | pubblico | Swagger UI |

Route protette già predisposte:

| Percorso gateway | Destinazione |
|---|---|
| `/api/patients/**` | Patient Service |
| `/api/admissions/*/documents/**` | Document Service |
| `/api/admissions/**` | Patient Service |
| `/api/documents/**` | Document Service |

La route documenti-ricovero precede quella generica dei ricoveri per evitare
instradamenti ambigui.

Le API protette restituiscono errori `401`/`403` nel formato comune:

```json
{
  "timestamp": "2026-06-20T15:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Authentication is required",
  "path": "/api/patients"
}
```

Gli errori di `/oauth/token` seguono invece lo standard OAuth2.

## Login JWT

```bash
curl -u "$OAUTH_CLIENT_ID:$OAUTH_CLIENT_SECRET" \
  -X POST 'http://localhost:8282/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=password' \
  --data-urlencode "username=$ADMIN_USERNAME" \
  --data-urlencode "password=$ADMIN_PASSWORD"
```

Risposta sintetica:

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "refresh_token": "eyJ...",
  "expires_in": 899,
  "scope": "read write"
}
```

Il token contiene tre segmenti JWT e il claim `authorities` con
`ROLE_ADMIN`.

## Verifica token

Verifica applicativa tramite endpoint protetto:

```bash
curl 'http://localhost:8282/api/auth/me' \
  -H "Authorization: Bearer $TOKEN"
```

Verifica crittografica lato authorization server:

```bash
curl -u "$OAUTH_CLIENT_ID:$OAUTH_CLIENT_SECRET" \
  -X POST 'http://localhost:8282/oauth/check_token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "token=$TOKEN"
```

`/oauth/token_key` è negato: la firma usa chiave simmetrica, quindi esporre tale
chiave permetterebbe di creare token falsi.

## Refresh e logout

```bash
curl -u "$OAUTH_CLIENT_ID:$OAUTH_CLIENT_SECRET" \
  -X POST 'http://localhost:8282/oauth/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode "refresh_token=$REFRESH_TOKEN"
```

JWT è stateless. `/api/auth/logout` restituisce `204`; il client deve eliminare
access e refresh token. Il token di accesso resta valido fino alla scadenza breve.
Nessuna blacklist è introdotta in questa fase.
