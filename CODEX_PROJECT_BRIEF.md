# Istruzioni operative per Code Agent — Piattaforma sanitaria documentale con OCR

## 1. Obiettivo generale

Realizzare una piattaforma web full-stack, API-based, destinata a un unico utente amministratore, per la gestione del percorso amministrativo e documentale del paziente in una struttura sanitaria.

Il flusso principale da implementare è uno solo:

1. login amministratore;
2. accesso alla dashboard;
3. registrazione o ricerca del paziente;
4. apertura di un ricovero;
5. caricamento di uno o più documenti;
6. salvataggio dei file tramite MongoDB GridFS;
7. elaborazione OCR tramite Tesseract;
8. visualizzazione del testo estratto;
9. ricerca nei documenti;
10. dimissione del paziente.

Il progetto deve privilegiare chiarezza, semplicità, leggibilità e completamento end-to-end rispetto alla quantità di funzionalità.

---

## 2. Contesto del repository esistente

Il repository può contenere già alcuni componenti:

- un servizio esistente che combina autenticazione e API Gateway;
- login basato su Spring Security;
- un template di microservizio da adattare;
- una configurazione Docker Compose per MongoDB;
- cartelle o moduli parzialmente creati.

Il code agent deve:

1. ispezionare l'intero repository prima di modificare file;
2. identificare tecnologie, versioni e convenzioni già presenti;
3. adattare il codice esistente senza riscriverlo inutilmente;
4. mantenere compatibilità con il template auth/gateway già disponibile;
5. riutilizzare il Docker Compose MongoDB esistente quando valido;
6. creare solo i moduli, le cartelle e i file mancanti;
7. evitare duplicazioni di configurazioni, servizi o responsabilità;
8. documentare le decisioni prese.

Non assumere che una cartella esista. Prima di creare un modulo, verificare sempre la struttura attuale.

---

## 3. Principi di sviluppo obbligatori

Il codice deve essere:

- semplice da leggere;
- esplicito;
- ben separato per responsabilità;
- coerente tra i vari moduli;
- documentato;
- facilmente eseguibile in locale;
- adatto a essere spiegato in un elaborato universitario.

Evitare:

- astrazioni non necessarie;
- gerarchie eccessive;
- factory, strategy o pattern complessi se non realmente utili;
- metaprogrammazione;
- configurazioni implicite difficili da seguire;
- classi generiche con troppe responsabilità;
- framework aggiuntivi non indispensabili;
- dipendenze introdotte solo per ridurre poche righe di codice;
- logica nascosta in annotazioni o reflection quando può essere scritta chiaramente.

Preferire:

- nomi descrittivi;
- classi piccole e coese;
- metodi con responsabilità singola;
- DTO espliciti;
- enum chiari;
- validazioni leggibili;
- eccezioni applicative semplici;
- mapping visibile;
- commenti solo dove chiariscono il perché, non l'ovvio;
- README aggiornati.

---

## 4. Stack tecnologico atteso

### Backend

- Java;
- Spring Boot;
- Spring Web;
- Spring Security;
- Spring Data JPA;
- Spring Data MongoDB;
- PostgreSQL;
- MongoDB GridFS;
- Tesseract OCR;
- OpenAPI/Swagger;
- Maven o Gradle, seguendo ciò che è già presente.

### Frontend

- React;
- TypeScript preferibile se il progetto esistente lo usa;
- React Router;
- client HTTP semplice;
- libreria grafici leggera, solo se necessaria;
- CSS semplice o libreria UI già esistente nel repository.

### Infrastruttura

- Docker;
- Docker Compose;
- eventuale predisposizione futura per Docker Swarm;
- database PostgreSQL;
- MongoDB con GridFS.

Non introdurre Kubernetes, Kafka, RabbitMQ, Alfresco, Elasticsearch o altri componenti infrastrutturali non richiesti.

---

## 5. Architettura applicativa

Architettura attesa:

```text
React SPA
   |
   v
Auth Service / API Gateway
   |
   +--> Patient Service
   |      |
   |      +--> PostgreSQL
   |
   +--> Document Service
   |      |
   |      +--> MongoDB
   |      +--> GridFS
   |
   +--> OCR Service
          |
          +--> Tesseract
```

L'Auth Service / API Gateway esistente deve essere adattato, non sostituito, salvo incompatibilità tecnica documentata.

Il frontend deve comunicare solo con il gateway.

Non deve chiamare direttamente i microservizi.

---

## 6. Moduli da gestire

### 6.1 Auth Service / API Gateway

Responsabilità:

- autenticazione amministratore;
- generazione e validazione JWT, se già prevista dal template;
- protezione delle rotte;
- instradamento verso i microservizi;
- gestione CORS;
- configurazione centralizzata degli endpoint;
- eventuale esposizione della documentazione Swagger aggregata, solo se semplice.

Vincoli:

- esiste un solo ruolo applicativo: `ADMIN`;
- non implementare registrazione pubblica;
- non implementare ruolo paziente;
- non implementare SPID o CIE;
- non implementare recupero password avanzato;
- può esistere un account amministratore precaricato.

Verificare il funzionamento end-to-end del login prima di procedere con il resto.

---

### 6.2 Patient Service

Responsabilità:

- anagrafica paziente;
- apertura ricovero;
- dimissione;
- storico ricoveri;
- statistiche pazienti per la dashboard.

Persistenza:

- PostgreSQL.

Entità minime:

#### Patient

Campi suggeriti:

- `id`;
- `firstName`;
- `lastName`;
- `fiscalCode`;
- `birthDate`;
- `email`;
- `phone`;
- `createdAt`;
- `updatedAt`.

#### Admission

Campi suggeriti:

- `id`;
- `patientId`;
- `admissionDate`;
- `dischargeDate`;
- `department`;
- `notes`;
- `status`;
- `createdAt`;
- `updatedAt`.

Enum:

```text
ACTIVE
DISCHARGED
```

Regole minime:

- un ricovero appartiene a un solo paziente;
- un paziente può avere più ricoveri;
- non è possibile dimettere due volte lo stesso ricovero;
- la data di dimissione non può precedere la data di ingresso;
- opzionalmente, un paziente non può avere più di un ricovero attivo;
- il codice fiscale deve essere univoco;
- le validazioni devono restituire errori chiari.

Endpoint minimi:

```http
POST   /api/patients
GET    /api/patients
GET    /api/patients/{patientId}
PUT    /api/patients/{patientId}

POST   /api/patients/{patientId}/admissions
GET    /api/patients/{patientId}/admissions
GET    /api/admissions/{admissionId}
POST   /api/admissions/{admissionId}/discharge
```

Statistiche:

```http
GET /api/patients/statistics
```

La risposta deve poter alimentare:

- numero totale pazienti;
- ricoveri attivi;
- ingressi del giorno;
- dimissioni del giorno;
- ingressi e dimissioni degli ultimi sette giorni.

---

### 6.3 Document Service

Responsabilità:

- upload file;
- salvataggio file in GridFS;
- salvataggio metadati in MongoDB;
- associazione del documento a paziente e ricovero;
- download;
- eliminazione;
- stato OCR;
- testo OCR;
- ricerca;
- statistiche documentali.

Persistenza:

- MongoDB;
- GridFS per il contenuto binario;
- collection `documents` per i metadati.

Documento applicativo suggerito:

```text
PatientDocument
- id
- gridFsFileId
- patientId
- admissionId
- documentType
- originalFilename
- contentType
- fileSize
- ocrStatus
- extractedText
- ocrErrorMessage
- uploadedAt
- processedAt
```

Enum tipologia documento:

```text
IDENTITY_DOCUMENT
ADMISSION_FORM
CONSENT_FORM
MEDICAL_REPORT
DISCHARGE_DOCUMENT
OTHER
```

Enum stato OCR:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Regole minime:

- il documento deve essere associato a un paziente;
- il documento deve essere associato a un ricovero;
- il ricovero deve esistere;
- validare formato e dimensione;
- usare una whitelist di MIME type;
- non fidarsi esclusivamente dell'estensione del file;
- in caso di errore OCR, il file deve rimanere disponibile;
- in caso di cancellazione, eliminare sia il record metadata sia il file GridFS;
- evitare stati inconsistenti tra metadata e GridFS.

Endpoint minimi:

```http
POST   /api/admissions/{admissionId}/documents
GET    /api/admissions/{admissionId}/documents
GET    /api/documents
GET    /api/documents/{documentId}
GET    /api/documents/{documentId}/content
DELETE /api/documents/{documentId}

POST   /api/documents/{documentId}/ocr
GET    /api/documents/{documentId}/ocr
GET    /api/documents/search
GET    /api/documents/statistics
```

L'upload deve usare `multipart/form-data`.

Campi suggeriti:

- `file`;
- `documentType`;
- eventuale `description`.

Il `patientId` deve essere derivato dal ricovero quando possibile, per evitare incoerenze.

---

### 6.4 OCR Service

Responsabilità:

- ricezione del file o recupero tramite chiamata interna;
- conversione del documento in formato elaborabile;
- preprocessing minimo;
- esecuzione OCR;
- restituzione del testo;
- gestione errori.

Tecnologia:

- Tesseract OCR.

Per semplicità:

- iniziare con PNG e JPEG;
- aggiungere PDF solo se il tempo lo consente;
- per i PDF usare una conversione esplicita delle pagine in immagini;
- non implementare elaborazione asincrona con code;
- non introdurre sistemi distribuiti di job processing.

Endpoint interno suggerito:

```http
POST /internal/ocr/extract
```

Risposta suggerita:

```json
{
  "text": "Testo estratto...",
  "language": "ita",
  "processingTimeMs": 1234
}
```

In caso di errore:

```json
{
  "errorCode": "OCR_PROCESSING_ERROR",
  "message": "Descrizione leggibile dell'errore"
}
```

Il Document Service deve aggiornare gli stati:

```text
PENDING -> PROCESSING -> COMPLETED
PENDING -> PROCESSING -> FAILED
```

---

## 7. Frontend React

Il frontend deve avere un flusso semplice e coerente.

Pagine minime:

```text
/login
/dashboard
/patients
/patients/new
/patients/{id}
/admissions/{id}
/documents
/documents/{id}
```

Menu principale:

```text
Dashboard
Pazienti
Documenti
Logout
```

### Login

Funzioni:

- username o email;
- password;
- messaggi di errore chiari;
- salvataggio sicuro del token secondo il template esistente;
- redirect alla dashboard;
- logout.

### Dashboard

Card suggerite:

- totale pazienti;
- ricoveri attivi;
- ingressi oggi;
- dimissioni oggi;
- documenti totali;
- OCR completati;
- OCR falliti.

Grafici:

1. torta dei documenti per tipologia;
2. colonne ingressi/dimissioni negli ultimi sette giorni;
3. indicatore percentuale del tasso di successo OCR.

Non creare grafici puramente decorativi.

### Pazienti

Tabella con:

- nome;
- cognome;
- codice fiscale;
- data di nascita;
- stato ricovero;
- data ingresso;
- numero documenti;
- azioni.

Azioni:

- dettaglio;
- modifica;
- nuovo ricovero;
- storico;
- documenti;
- dimissione.

Filtri minimi:

- nome o cognome;
- codice fiscale;
- stato.

### Dettaglio paziente

Sezioni:

- anagrafica;
- ricoveri;
- documenti associati;
- azioni disponibili.

### Documenti

Tabella con:

- nome file;
- paziente;
- ricovero;
- tipologia;
- data caricamento;
- stato OCR;
- azioni.

Azioni:

- dettaglio;
- download;
- OCR;
- ripeti OCR;
- elimina.

### Dettaglio documento

Mostrare:

- metadati;
- collegamento al paziente;
- collegamento al ricovero;
- anteprima o download;
- testo OCR;
- stato OCR;
- eventuale errore;
- pulsante nuova elaborazione.

### Ricerca

Permettere una ricerca semplice nel testo OCR.

Parametri utili:

- query;
- patientId;
- admissionId;
- documentType;
- ocrStatus.

---

## 8. Dashboard e aggregazioni

Non creare un microservizio dashboard.

Le statistiche devono essere prodotte dai servizi già esistenti:

- Patient Service per pazienti e ricoveri;
- Document Service per documenti e OCR.

Il frontend può effettuare due chiamate e combinare i risultati.

Evitare aggregazioni duplicate nel gateway salvo necessità reale.

---

## 9. Gestione errori

Ogni microservizio deve avere una gestione errori coerente.

Formato suggerito:

```json
{
  "timestamp": "2026-06-20T12:00:00Z",
  "status": 404,
  "error": "Not Found",
  "code": "PATIENT_NOT_FOUND",
  "message": "Paziente non trovato",
  "path": "/api/patients/..."
}
```

Usare codici HTTP corretti:

- `200 OK`;
- `201 Created`;
- `204 No Content`;
- `400 Bad Request`;
- `401 Unauthorized`;
- `403 Forbidden`;
- `404 Not Found`;
- `409 Conflict`;
- `500 Internal Server Error`.

Non restituire stack trace al frontend.

---

## 10. Documentazione del codice

Ogni modulo deve contenere un proprio `README.md`.

README richiesti:

```text
/README.md
/documed-auth-gateway/README.md
/documed-patient-service/README.md
/documed-document-service/README.md
/documed-ocr-service/README.md
/frontend/README.md
/infrastructure/README.md
```

Se i nomi reali delle cartelle differiscono, adattare i percorsi.

Ogni README deve contenere:

1. scopo del modulo;
2. responsabilità;
3. tecnologie;
4. struttura delle cartelle;
5. configurazione;
6. variabili d'ambiente;
7. avvio locale;
8. avvio Docker;
9. endpoint principali;
10. esempi di richieste;
11. test;
12. problemi noti;
13. decisioni progettuali principali.

Il README principale deve contenere:

- descrizione progetto;
- architettura;
- diagramma testuale;
- prerequisiti;
- quick start;
- credenziali demo solo per ambiente locale;
- elenco servizi e porte;
- flusso dimostrativo completo;
- link ai README dei moduli;
- limiti e sviluppi futuri.

---

## 11. Commenti e JavaDoc

Commentare il codice con criterio.

Obbligatorio:

- JavaDoc per classi pubbliche principali;
- JavaDoc per servizi e metodi non banali;
- commenti sulle decisioni tecniche;
- commenti sulle integrazioni con GridFS;
- commenti sulle transizioni di stato OCR;
- commenti sulle regole di dominio;
- commenti sulle configurazioni di sicurezza;
- commenti nei file Docker e Compose quando una scelta non è immediata.

Non commentare righe ovvie come:

```java
// Setta il nome
patient.setName(name);
```

Preferire:

```java
// Il patientId viene derivato dal ricovero per evitare che il client
// possa associare il documento a un paziente diverso.
```

---

## 12. Test

Implementare almeno i test essenziali.

### Patient Service

- creazione paziente;
- codice fiscale duplicato;
- apertura ricovero;
- dimissione;
- seconda dimissione rifiutata;
- ricovero inesistente;
- data dimissione non valida.

### Document Service

- upload file valido;
- file non supportato;
- ricovero inesistente;
- download;
- cancellazione;
- aggiornamento stato OCR;
- ricerca testo OCR.

### OCR Service

- immagine valida;
- immagine non leggibile;
- file non supportato;
- fallimento Tesseract gestito correttamente.

### Auth/Gateway

- login valido;
- login non valido;
- accesso senza token;
- accesso con token valido;
- routing verso i servizi.

### Frontend

Se il tempo è limitato, privilegiare:

- test dei servizi API;
- test manuale documentato;
- almeno un test dei componenti principali.

---

## 13. Docker e configurazione

Prima di creare nuovi file Docker:

1. verificare quelli già presenti;
2. riutilizzare la configurazione MongoDB esistente;
3. mantenere nomi di rete e volumi coerenti;
4. evitare Compose duplicati.

Servizi attesi:

```text
auth-gateway
patient-service
document-service
ocr-service
frontend
postgres
mongodb
```

Il Docker Compose deve:

- usare variabili d'ambiente;
- usare volumi persistenti;
- avere una rete condivisa;
- esporre solo le porte necessarie;
- contenere healthcheck dove utili;
- evitare password hardcoded per ambienti non locali;
- avere un file `.env.example`;
- avere istruzioni di avvio nel README.

Creare anche:

```text
.env.example
.gitignore
docker-compose.yml
```

solo se mancanti o se la struttura esistente richiede integrazione.

Non cancellare configurazioni già funzionanti senza motivazione.

---

## 14. Migrazioni database

Per PostgreSQL usare un sistema di migrazione, se già presente o semplice da integrare:

- Flyway preferibile;
- in alternativa Liquibase.

Creare migrazioni leggibili e numerate.

Evitare `ddl-auto=create` come soluzione definitiva.

Per MongoDB non introdurre un sistema complesso di migrazione se non necessario.

Documentare la struttura della collection `documents`.

---

## 15. Sicurezza minima

Implementare:

- password codificate;
- JWT secondo il template esistente;
- protezione degli endpoint;
- un solo ruolo `ADMIN`;
- validazione input;
- limiti dimensione file;
- whitelist MIME type;
- nomi file sanitizzati;
- segreti esterni al codice;
- nessun dato sanitario reale;
- nessuna credenziale reale nel repository.

Non implementare:

- SPID;
- CIE;
- portale paziente;
- multi-tenancy;
- RBAC complesso;
- sistemi IAM esterni.

---

## 16. Logging

Ogni servizio deve loggare:

- avvio;
- richieste rilevanti;
- creazione paziente;
- apertura e chiusura ricovero;
- upload documento;
- avvio OCR;
- completamento OCR;
- fallimento OCR;
- cancellazione documento;
- errori di integrazione.

Non loggare:

- password;
- token;
- contenuto completo dei documenti;
- testo OCR integrale;
- dati personali non necessari.

Usare identificativi tecnici nei log.

---

## 17. Ordine di implementazione

Seguire preferibilmente questo ordine:

### Fase 1 — Analisi repository

- elencare moduli;
- identificare build system;
- verificare auth/gateway;
- verificare Docker Compose MongoDB;
- annotare cosa esiste e cosa manca.

### Fase 2 — Stabilizzazione auth/gateway

- login funzionante;
- token;
- protezione rotte;
- routing minimo.

### Fase 3 — Patient Service

- modello;
- migrazioni;
- CRUD pazienti;
- ricoveri;
- dimissione;
- test;
- Swagger.

### Fase 4 — Document Service

- MongoDB;
- GridFS;
- upload;
- metadata;
- download;
- delete;
- test.

### Fase 5 — OCR Service

- Tesseract;
- endpoint;
- gestione errori;
- integrazione con Document Service.

### Fase 6 — Frontend

- login;
- dashboard;
- pazienti;
- ricoveri;
- documenti;
- OCR.

### Fase 7 — Integrazione

- flusso end-to-end;
- gestione errori;
- Docker Compose;
- README;
- screenshot o demo manuale.

Non iniziare da grafici o dettagli estetici prima che il flusso principale funzioni.

---

## 18. Flusso di accettazione finale

Il progetto è considerato completato quando è possibile eseguire questo scenario:

1. avviare l'intero stack;
2. effettuare login come amministratore;
3. visualizzare la dashboard;
4. creare un paziente;
5. aprire un ricovero;
6. caricare un documento;
7. verificare il salvataggio in GridFS;
8. avviare OCR;
9. visualizzare il testo estratto;
10. cercare una parola nel testo;
11. scaricare il documento;
12. dimettere il paziente;
13. visualizzare l'aggiornamento della dashboard;
14. verificare le API in Swagger.

---

## 19. Funzionalità escluse

Non implementare salvo richiesta esplicita successiva:

- Alfresco;
- SPID;
- CIE;
- portale paziente;
- ruolo operatore;
- ruolo paziente;
- gestione multi-ruolo;
- prenotazioni;
- diagnosi;
- prescrizioni;
- fatturazione;
- firma digitale;
- conservazione sostitutiva;
- FHIR;
- Kafka;
- RabbitMQ;
- Kubernetes;
- Elasticsearch;
- classificazione automatica avanzata;
- modelli di machine learning personalizzati;
- replica reale dei database;
- alta disponibilità completa.

---

## 20. Sviluppi futuri da documentare, ma non implementare

Inserire nei README o nella documentazione finale:

- portale paziente;
- accesso tramite SPID/CIE;
- pubblicazione selettiva dei documenti;
- notifiche;
- OCR asincrono;
- coda di messaggi;
- classificazione documentale automatica;
- ricerca full-text avanzata;
- audit completo;
- interoperabilità FHIR;
- deployment Docker Swarm;
- monitoraggio e osservabilità.

---

## 21. Regole operative per il code agent

Prima di ogni modifica significativa:

1. leggere i file coinvolti;
2. verificare pattern e convenzioni;
3. proporre un piano breve;
4. modificare il minimo necessario;
5. eseguire build e test;
6. correggere eventuali regressioni;
7. aggiornare il README del modulo;
8. riepilogare i file creati o modificati.

Quando una scelta non è evidente:

- scegliere la soluzione più semplice;
- documentare il motivo;
- evitare dipendenze aggiuntive;
- non introdurre architetture speculative.

Quando il codice esistente è incompleto:

- completarlo mantenendo lo stile già usato;
- refactoring solo se strettamente necessario;
- evitare riscritture complete non motivate.

Quando manca una cartella:

- crearla seguendo la struttura coerente con il repository;
- aggiungere il relativo README;
- aggiungere configurazione minima;
- verificare che sia inclusa nella build e nel Compose.

---

## 22. Deliverable attesi

Al termine devono essere presenti:

- codice backend;
- codice frontend;
- configurazione Docker;
- script o migrazioni database;
- documentazione Swagger;
- README principale;
- README per ogni modulo;
- `.env.example`;
- test essenziali;
- istruzioni di avvio;
- credenziali demo locali;
- descrizione del flusso end-to-end;
- elenco dei limiti;
- sviluppi futuri.

---

## 23. Priorità assolute

Ordine delle priorità:

1. login funzionante;
2. creazione paziente;
3. apertura ricovero;
4. upload GridFS;
5. OCR;
6. visualizzazione testo;
7. dimissione;
8. dashboard;
9. documentazione;
10. grafici e rifiniture.

In caso di tempo insufficiente:

- non sacrificare il flusso completo;
- ridurre il numero di grafici;
- limitare il supporto file a PNG/JPEG;
- semplificare i filtri;
- evitare funzionalità opzionali;
- mantenere sempre il codice chiaro e documentato.

---

## 24. Definizione sintetica del progetto

La piattaforma è un'applicazione web amministrativa per la gestione del percorso del paziente in una struttura sanitaria. Un amministratore autenticato può registrare pazienti, aprire e chiudere ricoveri, archiviare documenti mediante MongoDB GridFS, estrarne il testo tramite Tesseract OCR e consultare statistiche attraverso una dashboard. Il sistema è organizzato in microservizi Spring Boot, accessibili tramite un API Gateway, con frontend React e avvio containerizzato tramite Docker Compose.
