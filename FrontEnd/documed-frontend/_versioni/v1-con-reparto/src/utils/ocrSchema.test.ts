import { classifyDocument, extractionToValues, valuesToFields } from "./ocrSchema";

describe("classifyDocument", () => {
  it("deduce la tipologia dalle parole chiave del contenuto", () => {
    expect(classifyDocument("CONSENSO INFORMATO al trattamento").type).toBe("CONSENT_FORM");
    expect(classifyDocument("Lettera di dimissione del paziente").type).toBe("DISCHARGE_DOCUMENT");
    expect(classifyDocument("ecg_rossi.jpg Tracciato ECG ingresso").type).toBe("MEDICAL_REPORT");
  });

  it("marca AUTO quando la confidenza è alta", () => {
    const c = classifyDocument("modulo di ricovero - accettazione");
    expect(c.type).toBe("ADMISSION_FORM");
    expect(c.status).toBe("AUTO");
  });

  it("ripiega su OTHER in REVIEW quando non riconosce nulla", () => {
    const c = classifyDocument("foglio_generico.pdf");
    expect(c.type).toBe("OTHER");
    expect(c.status).toBe("REVIEW");
  });
});

describe("extractionToValues", () => {
  it("maps fields by canonical key when present", () => {
    const values = extractionToValues([
      { key: "patientName", label: "Paziente", value: "Marco Rossi" },
      { key: "fiscalCode", label: "Codice fiscale", value: "RSSMRC80A01H501Z" },
    ]);
    expect(values).toEqual({ patientName: "Marco Rossi", fiscalCode: "RSSMRC80A01H501Z" });
  });

  it("falls back to legacy labels for keyless fields", () => {
    const values = extractionToValues([
      { label: "Cognome e nome", value: "Giuseppe Conti" },
      { label: "Codice fiscale", value: "CNTGPP49P10H501B" },
    ]);
    expect(values.patientName).toBe("Giuseppe Conti");
    expect(values.fiscalCode).toBe("CNTGPP49P10H501B");
  });

  it("ignores empty values and unknown labels", () => {
    const values = extractionToValues([
      { label: "Paziente", value: "" },
      { label: "Campo sconosciuto", value: "x" },
    ]);
    expect(values).toEqual({});
  });
});

describe("valuesToFields", () => {
  it("renders only the fields of the requested type, in order", () => {
    const fields = valuesToFields({ patientName: "Marco Rossi", fiscalCode: "RSS…" }, "OTHER");
    expect(fields.map((f) => f.key)).toEqual(["patientName", "fiscalCode", "note"]);
    expect(fields.find((f) => f.key === "note")?.value).toBe("");
  });

  it("preserves shared values when the document type changes", () => {
    // letti su un documento d'identità…
    const values = extractionToValues([
      { key: "patientName", label: "Paziente", value: "Marco Rossi" },
      { key: "fiscalCode", label: "Codice fiscale", value: "RSSMRC80A01H501Z" },
      { key: "birthDate", label: "Data di nascita", value: "01/01/1980" },
    ]);
    // …cambiando tipologia a modulo di ricovero, nome e CF restano
    const fields = valuesToFields(values, "ADMISSION_FORM");
    expect(fields.find((f) => f.key === "patientName")?.value).toBe("Marco Rossi");
    expect(fields.find((f) => f.key === "fiscalCode")?.value).toBe("RSSMRC80A01H501Z");
    // i campi non pertinenti alla nuova tipologia non compaiono
    expect(fields.some((f) => f.key === "birthDate")).toBe(false);
  });
});
