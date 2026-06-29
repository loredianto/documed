# DocuMed Frontend

SPA React/TypeScript per il flusso amministrativo DocuMed. Il browser comunica esclusivamente con l'Auth Gateway; patient-service e document-service non sono chiamati direttamente.
Il frontend non contiene dataset applicativi locali: tutti i dati operativi arrivano dal backend.

## Tecnologie

- React 18 e React Router 6;
- TypeScript in modalità strict;
- Vite 8 su Node 20.19+;
- Fetch API centralizzata, senza librerie di stato globale;
- Vitest e Testing Library.

## Struttura

```text
src/
├── api/          client HTTP e API per dominio
├── auth/         sessione e route protette
├── components/   layout e componenti condivisi
├── pages/        pagine applicative
├── test/         configurazione test
├── utils/        formattazione ed errori
├── App.tsx       routing
└── types.ts      contratti DTO espliciti
```

## Configurazione

Copiando `.env.example` in `.env.local` configurare:

| Variabile | Descrizione | Default |
|---|---|---|
| `VITE_API_BASE_URL` | URL pubblico Auth Gateway | `http://localhost:8282` |
| `VITE_AUTH_CLIENT_ID` | client OAuth2 presente in `oauth_clients` | nessuno |
| `VITE_AUTH_CLIENT_SECRET` | credenziale del client OAuth2 | nessuno |

Il client OAuth2 di una SPA non può conservare un segreto reale: queste credenziali identificano il client applicativo, mentre l'utente ADMIN viene autenticato separatamente. Per la demo usare un client DB dedicato e limitato. Il token JWT è mantenuto in `sessionStorage`, viene inviato come Bearer e viene eliminato al logout o dopo una risposta `401`.

## Avvio e verifica

Prerequisiti: Node.js 20.19+ e npm. Node 16 non è supportato perché fuori manutenzione e incompatibile con la toolchain aggiornata.

```bash
cp .env.example .env.local
npm install
npm run dev
```

La SPA è disponibile su `http://localhost:5173`.

```bash
npm test
npm run build
```

La build di produzione viene generata in `dist/`.

### Docker

Lo stack completo compila e serve la SPA con nginx:

```bash
cp .env.example .env
docker compose up --build -d
```

In Docker il client usa URL same-origin; nginx inoltra `/oauth/**` e `/api/**`
esclusivamente all'Auth Gateway. Il frontend è disponibile su
`http://localhost:3000`.

## Pagine

| Rotta | Funzione |
|---|---|
| `/login` | login amministratore OAuth2 |
| `/dashboard` | card e grafici alimentati dalle statistiche reali |
| `/patients` | elenco e ricerca pazienti |
| `/patients/new` | registrazione paziente |
| `/patients/:id` | modifica, ricoveri e documenti del paziente |
| `/admissions/:id` | dettaglio, documenti e dimissione |
| `/documents` | upload, ricerca, download, OCR ed eliminazione |
| `/documents/:id` | metadati e testo OCR |

## Integrazione API

- login: `POST /oauth/token`;
- pazienti/ricoveri: `/api/patients/**`, `/api/admissions/**`;
- documenti/OCR: `/api/documents/**`, `/api/admissions/{id}/documents`.
- dashboard: `GET /api/patients/statistics` e `GET /api/documents/statistics` in parallelo.

Nella dashboard, “Cartelle cliniche incomplete” conta i ricoveri attivi a cui
manca almeno un documento obbligatorio già archiviato in cartella clinica
(`filedInRecord=true`). Il contatore secondario mostra il numero totale di
documenti obbligatori mancanti.

L'upload accetta PNG, JPEG e PDF fino al limite del backend. L'OCR reale supporta PNG/JPEG; un PDF resta archiviabile e scaricabile ma l'elaborazione OCR fallisce in modo controllato.

## Decisioni e limiti

- Nessuno stato globale: dati di pagina caricati dai rispettivi endpoint.
- La ricerca pazienti è locale perché l'API espone un elenco completo; è adeguata alla demo, non a volumi elevati.
- L'OCR è sincrono e il pulsante resta occupato fino alla risposta.
- Le etichette mostrano solo dati sintetici; il repository non contiene dati sanitari reali.
