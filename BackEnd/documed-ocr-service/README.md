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