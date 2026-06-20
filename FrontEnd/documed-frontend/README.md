# DocuMed Frontend

Frontend web del progetto universitario DocuMed, sviluppato con React e TypeScript.

L'applicazione permette a un amministratore di gestire il flusso principale della piattaforma:

- effettuare il login;
- consultare la dashboard;
- registrare e modificare i pazienti;
- aprire e chiudere i ricoveri;
- caricare i documenti;
- avviare l'elaborazione OCR;
- consultare il testo estratto.

Il frontend comunica con l'Auth Gateway, che inoltra le richieste ai microservizi interni. In questo modo il browser non accede direttamente al Patient Service o al Document Service.

## Tecnologie utilizzate

- **React** per la costruzione dell'interfaccia;
- **TypeScript** per definire in modo esplicito tipi e DTO;
- **React Router** per la navigazione tra le pagine;
- **Vite** per avviare il progetto in sviluppo e generare la build;
- **Fetch API** per le richieste HTTP;
- **Vitest e Testing Library** per i test principali.

## Struttura del progetto

```text
src/
├── api/          funzioni per comunicare con le API
├── auth/         gestione della sessione e delle rotte protette
├── components/   componenti riutilizzabili e layout
├── pages/        pagine principali dell'applicazione
├── test/         configurazione dei test
├── utils/        funzioni di supporto
├── App.tsx       definizione delle rotte
└── types.ts      DTO e tipi condivisi
```

La struttura è stata mantenuta semplice, separando le chiamate HTTP, la gestione dell'autenticazione, i componenti condivisi e le singole pagine.

## Configurazione

Creare il file `.env.local` partendo dall'esempio disponibile:

```bash
cp .env.example .env.local
```

Variabile utilizzata:

| Variabile | Descrizione | Valore locale |
|---|---|---|
| `VITE_API_BASE_URL` | Indirizzo pubblico dell'Auth Gateway | `http://localhost:8282` |
| `VITE_AUTH_CLIENT_ID` | Identificativo pubblico del client applicativo, se richiesto dal gateway | vuoto |

Le variabili Vite sono accessibili dal browser. Per questo motivo non devono contenere password, token permanenti o veri client secret.

Il token ottenuto dopo il login viene salvato in `sessionStorage`. Viene aggiunto alle richieste tramite header `Authorization: Bearer ...` e rimosso al logout o quando il gateway restituisce una risposta `401 Unauthorized`.

Questa gestione è sufficiente per la dimostrazione del progetto, ma in un sistema reale andrebbero valutate soluzioni più robuste per la gestione della sessione.

## Avvio locale

Prerequisiti:

- Node.js;
- npm;
- Auth Gateway avviato sulla porta configurata.

Installare le dipendenze:

```bash
npm install
```

Avviare il server di sviluppo:

```bash
npm run dev
```

L'applicazione sarà disponibile, normalmente, all'indirizzo:

```text
http://localhost:5173
```

## Build e test

Eseguire i test:

```bash
npm test
```

Generare la build:

```bash
npm run build
```

La build viene salvata nella cartella:

```text
dist/
```

## Avvio tramite Docker

Il frontend può essere compilato e servito tramite nginx insieme agli altri componenti del progetto:

```bash
docker compose up --build -d
```

L'applicazione sarà disponibile all'indirizzo:

```text
http://localhost:3000
```

Nell'ambiente Docker, nginx inoltra al gateway le richieste che iniziano con:

```text
/oauth/
/api/
```

In questo modo il frontend utilizza un unico indirizzo pubblico.

## Pagine disponibili

| Rotta | Funzione |
|---|---|
| `/login` | accesso dell'amministratore |
| `/dashboard` | riepilogo dei dati della piattaforma |
| `/patients` | elenco e ricerca dei pazienti |
| `/patients/new` | registrazione di un paziente |
| `/patients/:id` | dettaglio e modifica del paziente |
| `/admissions/:id` | dettaglio del ricovero e dimissione |
| `/documents` | elenco, caricamento e ricerca dei documenti |
| `/documents/:id` | dettaglio del documento e risultato OCR |

## API utilizzate

### Autenticazione

```http
POST /oauth/token
```

### Pazienti e ricoveri

```text
/api/patients/**
/api/admissions/**
```

### Documenti e OCR

```text
/api/documents/**
/api/admissions/{admissionId}/documents
```

### Dashboard

La dashboard recupera in parallelo le statistiche dai due servizi:

```http
GET /api/patients/statistics
GET /api/documents/statistics
```

## Caricamento dei documenti

Il frontend permette di caricare:

- immagini PNG;
- immagini JPEG;
- documenti PDF.

Il limite massimo del file è stabilito dal backend.

I file PDF possono essere archiviati e scaricati. Nella versione attuale del progetto l'OCR è previsto principalmente per immagini PNG e JPEG. Se viene richiesta l'elaborazione di un formato non supportato, il backend restituisce un errore controllato e il documento rimane comunque conservato.

## Scelte progettuali

Il frontend comunica solamente con l'Auth Gateway per non conoscere gli indirizzi interni dei microservizi.

Le chiamate HTTP sono raccolte nella cartella `api`, evitando di ripetere la stessa logica nelle pagine.
