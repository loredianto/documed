# Auth Service / API Gateway

## Scopo

Servizio Spring Boot per:

- autenticare amministratori con ruolo applicativo, `ROLE_ADMIN`;
- generare e verificare JWT firmati;
- proteggere tutte le API applicative con `ROLE_ADMIN`;
- inoltrare le future API verso Patient Service e Document Service;
- applicare CORS centralmente.

## Tecnologie e compatibilità

- Java 11;
- Maven Wrapper 3.8.7;
- Spring Boot 2.2.4.RELEASE;
- Spring Cloud Hoxton.SR1;
- Spring Security OAuth2 legacy;
- Netflix Zuul;
- MongoDB;
- Springfox Swagger 2.9.2.


## Struttura

```text
src/main/java/it/projectwork/documed/authservice/
├── config/       JWT, security, CORS e Swagger
├── controller/   endpoint amministratore
├── domain/       utente e client OAuth2
├── repository/   persistenza MongoDB
└── service/      UserDetails e client details
src/main/resources/
└── application.yml
```

## Variabili d'ambiente

Vedere [`.env.example`](.env.example).

| Variabile | Obbligatoria | Descrizione |
|---|---:|---|
| `MONGODB_URI` | sì | URI database auth |
| `JWT_SIGNING_KEY` | sì | Segreto HMAC, minimo 32 caratteri |
| `CORS_ALLOWED_ORIGINS` | no | Origini separate da virgola |
| `PATIENT_SERVICE_URL` | no in locale | Destinazione Patient Service |
| `DOCUMENT_SERVICE_URL` | no in locale | Destinazione Document Service |
| `GATEWAY_CONNECT_TIMEOUT_MS` | no | Timeout connessione proxy, default `5000` |
| `GATEWAY_SOCKET_TIMEOUT_MS` | no | Timeout risposta proxy, default `75000` |
| `GATEWAY_MAX_FILE_SIZE` | no | File massimo inoltrato, default `10MB` |
| `GATEWAY_MAX_REQUEST_SIZE` | no | Limite multipart, default `11MB` |


## Gestione utenti e client OAuth2


MongoDB usa:

- database `auth_service`;
- collection `users` per amministratori;
- collection `oauth_clients` per client OAuth2.


`username` e `clientId` hanno indice univoco. La chiave JWT non viene salvata
nel database.

## Avvio locale

Avviare prima MongoDB:

```bash
cd DBs/MongoDB
cp .env.example .env
docker compose up -d
```

Avviare il servizio con JDK 11:

```bash
cd BackEnd/documed-auth-gateway
MONGODB_URI='mongodb://platform:platform-local-password@localhost:27017/auth_service?authSource=admin' \
JWT_SIGNING_KEY='replace-with-random-secret-at-least-32-characters' \
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
sh mvnw spring-boot:run
```

Il servizio ascolta su `http://localhost:8282`.

## Avvio Docker

Per lo stack completo usare dalla root `docker compose up --build -d`. Il
Compose di questo modulo resta disponibile per lo sviluppo isolato.

MongoDB deve creare prima la rete condivisa `platform-network`:

```bash
cd DBs/MongoDB
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
instradamenti ambigui. Finché i servizi futuri non esistono, tali route possono
restituire errore di connessione dopo una autenticazione valida.

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
