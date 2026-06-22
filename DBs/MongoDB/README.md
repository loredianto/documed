# MongoDB locale

Per l'intero progetto usare il Compose canonico alla root. Questo file avvia
soltanto MongoDB per lo sviluppo isolato.

MongoDB è usato esclusivamente dal Document Service per metadati e contenuto
GridFS. La configurazione locale usa un nodo, autenticazione, volume persistente,
healthcheck e rete Docker `platform-network`.

Replica e alta disponibilità non sono richieste dal progetto. Gli script replica
legacy restano come stub documentati e non sono eseguiti.

## Avvio

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

## Arresto

```bash
docker compose down
```

Il volume `mongodb-data` viene preservato. Per cancellarlo serve un'operazione
esplicita con `docker compose down --volumes`.

## Variabili

| Variabile | Scopo |
|---|---|
| `MONGO_USERNAME` | amministratore Mongo locale |
| `MONGO_PASSWORD` | password locale |
| `MONGO_PORT` | porta host; default 27017 |

I valori in `.env.example` sono demo. Non usare credenziali reali nel repository.

## Database applicativo

`document_service` contiene la collection metadata `documents` e le collection
GridFS `fs.files`/`fs.chunks`. Utenti amministratori e client OAuth2 sono invece
salvati nello schema PostgreSQL `auth_service`.

I database vengono creati al primo inserimento dai rispettivi servizi. Non sono
necessari script di inizializzazione o un secondo container MongoDB.
