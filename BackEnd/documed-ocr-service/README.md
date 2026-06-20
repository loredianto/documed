# Documed OCR Service

Microservizio interno e sincrono che estrae testo da immagini PNG/JPEG usando
Tesseract. Non archivia documenti, non interpreta dati clinici e non esegue
diagnosi o classificazioni.

## Responsabilità

- ricezione multipart di una singola immagine;
- validazione MIME, firma binaria e dimensione;
- creazione di un file temporaneo;
- esecuzione controllata del processo Tesseract;
- restituzione del testo, lingua e durata;
- eliminazione dei file temporanei anche in caso di errore.

## Tecnologie

- Java 11;
- Spring Boot 2.2.4.RELEASE;
- Spring Web e Security OAuth2;
- Tesseract CLI con dati lingua italiana;
- Springfox Swagger 2.9.2;
- Maven, JUnit 5 e Mockito.

L'integrazione usa `ProcessBuilder`, non binding JNI/Tess4J. In questo modo la
versione nativa è isolata nell'immagine Docker e il codice Java rimane semplice.

## Struttura

```text
src/main/java/it/projectwork/documed/ocrservice/
├── config/       JWT e Swagger
├── controller/   endpoint interno multipart
├── dto/          richiesta e risposta
├── error/        errori OCR coerenti
└── service/      validazione, temporanei e processo Tesseract
```

## Configurazione

| Variabile | Obbligatoria | Descrizione |
|---|---:|---|
| `JWT_SIGNING_KEY` | sì | stessa chiave HMAC dell'Auth Gateway |
| `TESSERACT_COMMAND` | no | comando/eseguibile, default `tesseract` |
| `OCR_LANGUAGE` | no | lingua Tesseract, default `ita` |
| `OCR_TIMEOUT_SECONDS` | no | timeout processo, default `60` |
| `OCR_MAX_FILE_SIZE` | no | limite multipart, default `10MB` |
| `OCR_MAX_REQUEST_SIZE` | no | limite richiesta, default `11MB` |
| `OCR_MAX_FILE_SIZE_BYTES` | no | limite applicativo, default `10485760` |
| `SERVER_PORT` | no | porta, default `8083` |

Per l'avvio fuori da Docker, `ita.traineddata` deve essere installato e
raggiungibile da Tesseract. Se necessario configurare anche `TESSDATA_PREFIX`
come variabile del processo.

## Flusso e temporanei

1. il file viene validato in memoria;
2. viene scritto sotto la directory temporanea del sistema;
3. Tesseract scrive risultato e diagnostica in altri file temporanei;
4. il testo viene letto e restituito;
5. tutti i file temporanei vengono eliminati nei blocchi `finally`.

Il servizio non usa database, volumi persistenti, broker o code.

## Sicurezza

`POST /internal/ocr/extract` richiede un JWT con `ROLE_ADMIN` e audience
`platform-api`. Document Service propaga il token ricevuto dal gateway.

## Avvio locale

Installare Tesseract e la lingua italiana, quindi:

```bash
JWT_SIGNING_KEY='replace-with-the-same-auth-gateway-secret-32-chars' \
TESSERACT_COMMAND='tesseract' \
OCR_LANGUAGE='ita' \
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn spring-boot:run
```

## Avvio Docker

Per lo stack completo usare dalla root `docker compose up --build -d`. Il
Compose del modulo serve solo allo sviluppo isolato.

```bash
cp .env.example .env
# Inserire in .env la stessa JWT_SIGNING_KEY usata dagli altri servizi.

docker network inspect platform-network >/dev/null 2>&1 || \
  docker network create platform-network

JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn clean package

docker compose up --build
```

L'immagine installa `tesseract-ocr` e `tesseract-ocr-ita`. Non monta directory
documentali e non conserva input dopo la richiesta.

## Endpoint

| Metodo | Percorso | Descrizione |
|---|---|---|
| `POST` | `/internal/ocr/extract` | Estrae testo da PNG/JPEG |

Swagger diretto:

- `http://localhost:8083/swagger-ui.html`;
- `http://localhost:8083/v2/api-docs`.

## Esempio curl diretto

```bash
export TOKEN='<jwt-admin>'

curl -sS -X POST 'http://localhost:8083/internal/ocr/extract' \
  -H "Authorization: Bearer $TOKEN" \
  -F 'file=@/percorso/immagine-sintetica.png;type=image/png' | jq
```

Risposta:

```json
{
  "text": "DOCUMENTO DI PROVA",
  "language": "ita",
  "processingTimeMs": 1200
}
```

## Errori

- `400 EMPTY_FILE` per file vuoto;
- `413 FILE_TOO_LARGE` oltre il limite;
- `415 UNSUPPORTED_MEDIA_TYPE` per PDF o altri formati;
- `415 FILE_CONTENT_TYPE_MISMATCH` per firma binaria incoerente;
- `422 OCR_NO_TEXT_DETECTED` per immagine senza testo leggibile;
- `422 TESSERACT_PROCESSING_ERROR` per errore di elaborazione;
- `504 OCR_TIMEOUT` oltre il timeout configurato.

I log contengono tipo, dimensione, lingua, durata e codice errore. Non contengono
il testo OCR completo, token o contenuto del file.

## Test

```bash
JAVA_HOME="$HOME/.sdkman/candidates/java/11.0.25-tem" \
PATH="$HOME/.sdkman/candidates/java/11.0.25-tem/bin:$PATH" \
mvn test
```

I test coprono OCR riuscito/fallito, file vuoto, formato non supportato, firma
invalida e cancellazione dei temporanei.

## Decisioni e limiti

- elaborazione sincrona: nessun broker, coda o worker distribuito;
- supporto solo PNG/JPEG;
- PDF escluso perché richiederebbe Poppler o un'altra conversione stabile;
- qualità dipendente da risoluzione, contrasto, rotazione e qualità scansione;
- lingua predefinita italiana, modificabile esternamente;
- nessuna diagnosi, classificazione o interpretazione medica.

## Problemi noti

- immagini inclinate, sfocate o a bassa risoluzione possono produrre testo
  incompleto;
- documenti multilingua richiedono dati Tesseract aggiuntivi;
- JDK 21 non è supportato dallo stack OAuth2 legacy: usare JDK 11.
