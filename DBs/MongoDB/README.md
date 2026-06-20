# MongoDB locale

Per l'intero progetto usare il Compose canonico alla root. Questo file avvia
soltanto MongoDB per lo sviluppo isolato.

MongoDB condiviso da Auth Gateway e Document Service. Configurazione
locale semplice: un nodo, autenticazione, volume persistente, healthcheck e rete
Docker `platform-network`.

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

## Database applicativi

- `auth_service`: utenti amministratori e client OAuth2;
- `document_service`: collection metadata `documents` e collection GridFS
  `fs.files`/`fs.chunks`.

I database vengono creati al primo inserimento dai rispettivi servizi. Non sono
necessari script di inizializzazione o un secondo container MongoDB.
