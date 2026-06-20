# PostgreSQL

Per l'intero progetto usare il Compose canonico alla root. Questo file avvia
soltanto PostgreSQL per lo sviluppo isolato.

Database PostgreSQL condiviso dall'infrastruttura Documed e attualmente usato
dal Patient Service.

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
- crea il database `documed_patient` con i valori dimostrativi di `.env.example`;
- salva i dati nel volume persistente `platform-postgres-data`;
- partecipa alla rete condivisa `platform-network`;
- espone l'hostname Docker `postgres` agli altri servizi sulla rete.

Il Patient Service applica le migrazioni Flyway al proprio avvio. Questo
Compose crea soltanto database, utente e volume PostgreSQL.

## Comandi utili

```bash
docker compose ps
docker compose logs -f postgres
docker compose stop
```

Non committare `.env` e non usare i valori dimostrativi fuori dall'ambiente
locale.
