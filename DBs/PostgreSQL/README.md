# PostgreSQL

Per l'intero progetto usare il Compose canonico alla root. Questo file avvia
soltanto PostgreSQL per lo sviluppo isolato.

Database PostgreSQL condiviso dall'infrastruttura DocuMed e usato da Auth
Gateway e Patient Service tramite schemi separati.

## Avvio

```bash
docker network inspect platform-network >/dev/null 2>&1 || \
  docker network create platform-network

cp .env.example .env
docker compose up -d
```

Il container:

- usa PostgreSQL 15;
- espone la porta locale `5432` per lo sviluppo;
- crea il database configurato da `POSTGRES_DB`;
- salva i dati nel volume persistente `platform-postgres-data`;
- partecipa alla rete condivisa `platform-network`;
- espone l'hostname Docker `postgres` agli altri servizi sulla rete.

I servizi applicano migrazioni Flyway indipendenti:

- Auth Gateway usa lo schema `auth_service` e una propria tabella di history;
- Patient Service usa lo schema `public`.

Questo Compose crea soltanto database, utente e volume PostgreSQL.

## Comandi utili

```bash
docker compose ps
docker compose logs -f postgres
docker compose stop
```

Non committare `.env` e non usare i valori dimostrativi fuori dall'ambiente
locale.
