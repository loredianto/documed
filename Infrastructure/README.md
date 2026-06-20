# Infrastruttura DocuMed

Il file canonico [`docker-compose.yml`](../docker-compose.yml) avvia l'intero stack. I Compose dentro i singoli moduli restano utili per lo sviluppo isolato, ma non vanno avviati insieme allo stack completo.

## Servizi e rete

Il Compose crea una sola rete `documed-network` e due volumi persistenti:

- `documed-postgres-data`: anagrafiche e ricoveri;
- `documed-mongodb-data`: utenti OAuth2, metadati documenti e GridFS.

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

## Account locale nel database

[`init-demo.js`](mongodb/init-demo.js) viene eseguito dall'immagine MongoDB esclusivamente su un volume vuoto. Inserisce l'utente ADMIN e il client OAuth2 nelle collection `auth_service.users` e `auth_service.oauth_clients`; l'applicazione non crea account in memoria e non espone registrazione pubblica.

Le password sono BCrypt. Se vengono cambiate, rigenerare i due hash in `.env` prima della prima inizializzazione, ad esempio:

```bash
htpasswd -bnBC 10 demo 'nuova-password' | cut -d: -f2
```

Un volume già inizializzato non viene modificato automaticamente: gli amministratori successivi vanno inseriti direttamente nel database seguendo il README dell'Auth Gateway.

## Healthcheck e dipendenze

PostgreSQL e MongoDB hanno healthcheck nativi. I servizi applicativi attendono il database necessario; il frontend ha un endpoint `/health`. Il routing interno usa i nomi dei servizi Docker, senza porte backend pubbliche aggiuntive.

## Configurazione

Tutte le variabili sono documentate in `.env.example`. Le credenziali sono esclusivamente dimostrative e devono essere sostituite fuori dallo sviluppo locale. La stessa `JWT_SIGNING_KEY` deve essere condivisa dai quattro backend.
