# Scenario ricoveri pubblici — nota aggiornata

Questo documento sostituisce le precedenti istruzioni basate su dati statici del
frontend.

Il frontend DocuMed non usa più dataset locali o modalità offline. Pazienti,
ricoveri, clinici, documenti, OCR e statistiche devono arrivare dai servizi
backend tramite Auth Gateway.

Le regole di scenario ancora valide sono:

- contesto: ospedale pubblico, Ufficio Accettazione Ricoveri;
- ruolo applicativo: amministrativo, non clinico;
- nessun riferimento a Pronto Soccorso;
- nessuna diagnosi, prescrizione o interpretazione medica lato frontend;
- documenti associati a ricovero e archiviati nella cartella clinica solo dopo il
  flusso OCR/conferma/salvataggio.

Per modificare dati di demo usare le migrazioni o gli endpoint backend, non file
del frontend.
