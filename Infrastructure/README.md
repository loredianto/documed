# Infrastruttura DocuMed

Il file canonico [`docker-compose.yml`](../docker-compose.yml) avvia l'intero stack. I Compose dentro i singoli moduli restano utili per lo sviluppo isolato, ma non vanno avviati insieme allo stack completo.

## Servizi e rete

Il Compose crea una sola rete `documed-network` e due volumi persistenti:

- `documed-postgres-data`: utenti OAuth2, anagrafiche e ricoveri;
- `documed-mongodb-data`: metadati documenti e GridFS.

Solo frontend (`3000`) e Auth Gateway (`8282`) sono pubblicati sull'host. Patient, Document, OCR, PostgreSQL e MongoDB sono raggiungibili esclusivamente sulla rete interna.

## Avvio

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Frontend: `http://localhost:3000`. Gateway/Swagger: `http://localhost:8282/swagger-ui.html`.

```bash
docker compose logs -f auth-gateway patient-service document-service ocr-service
docker compose down
```

`docker compose down` conserva i dati. `docker compose down -v` elimina definitivamente entrambi i database e va usato solo quando si vuole ripartire da zero.

## Account e client OAuth2 nel database

Le migrazioni Flyway dell'Auth Gateway creano solo lo schema PostgreSQL
`auth_service` e le tabelle `users` e `oauth_clients`. L'applicazione non crea
account locali, non usa utenti in memoria e non espone registrazione pubblica.

Gli amministratori e i client OAuth2 devono essere inseriti direttamente in
PostgreSQL seguendo il README dell'Auth Gateway. Password e client secret sono
salvati come hash BCrypt, ad esempio:

```bash
htpasswd -bnBC 10 demo 'nuova-password' | cut -d: -f2
```

## Healthcheck e dipendenze

PostgreSQL e MongoDB hanno healthcheck nativi. Auth e Patient Service attendono
PostgreSQL; Document Service attende MongoDB. Il frontend ha un endpoint
`/health`. Il routing interno usa i nomi dei servizi Docker, senza porte backend
pubbliche aggiuntive.

## Configurazione

Tutte le variabili sono documentate in `.env.example`. Non committare credenziali
reali. La stessa `JWT_SIGNING_KEY` deve essere condivisa dai quattro backend.
