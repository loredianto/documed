package it.projectwork.documed.documentservice.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import it.projectwork.documed.documentservice.domain.DocumentResolution;
import it.projectwork.documed.documentservice.domain.DocumentType;
import it.projectwork.documed.documentservice.domain.DocumentTypeCandidate;
import it.projectwork.documed.documentservice.domain.OcrExtraction;
import it.projectwork.documed.documentservice.domain.OcrField;
import it.projectwork.documed.documentservice.domain.PatientDocument;
import it.projectwork.documed.documentservice.domain.PatientMatch;
import it.projectwork.documed.documentservice.domain.TypeClassification;

/**
 * Builds the MVP structured OCR payload required by the frontend. The rules are
 * intentionally transparent: keyword classification and a few field regexes,
 * with all uncertain decisions left to the operator.
 */
@Component
public class OcrExtractionBuilder {

    private static final Pattern FISCAL_CODE =
            Pattern.compile("\\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\\b",
                    Pattern.CASE_INSENSITIVE);
    private static final Pattern PATIENT =
            Pattern.compile("(?im)^\\s*(?:paziente|cognome e nome|nome e cognome)\\s*[:\\-]\\s*(.+)$");
    private static final Pattern DEPARTMENT =
            Pattern.compile("(?im)^\\s*(?:disciplina|reparto)\\s*[:\\-]\\s*([^\\n(]+)");
    private static final Pattern DATE =
            Pattern.compile("\\b([0-3][0-9]/[0-1][0-9]/[12][0-9]{3})\\b");

    private static final Map<DocumentType, List<String>> KEYWORDS = Map.of(
            DocumentType.CONSENT_FORM, List.of("consenso", "acconsento", "informato"),
            DocumentType.DISCHARGE_DOCUMENT, List.of("dimission", "lettera di dimission", "ldo"),
            DocumentType.ADMISSION_FORM, List.of("ricovero", "accettazione", "proposta"),
            DocumentType.MEDICAL_REPORT, List.of("referto", "esame", "ecg", "radiologia", "laboratorio"),
            DocumentType.IDENTITY_DOCUMENT, List.of("identità", "identita", "carta d'identità", "cie",
                    "tessera sanitaria"));

    public OcrExtraction build(PatientDocument document, String extractedText) {
        TypeClassification classification = classify(document, extractedText);
        DocumentType type = classification.getType() == null
                ? document.getDocumentType()
                : classification.getType();

        OcrExtraction extraction = new OcrExtraction();
        extraction.setTitle(titleFor(type));
        extraction.setFields(fieldsFor(type, extractedText));
        extraction.setBodyText(trimToNull(extractedText));
        extraction.setClassification(classification);
        extraction.setResolution(resolutionFor(document, extractedText));
        return extraction;
    }

    private TypeClassification classify(PatientDocument document, String extractedText) {
        String signal = String.join(" ",
                valueOrEmpty(extractedText),
                valueOrEmpty(document.getOriginalFilename()),
                valueOrEmpty(document.getDescription()))
                .toLowerCase(Locale.ROOT);

        List<DocumentTypeCandidate> scored = KEYWORDS.entrySet().stream()
                .map(entry -> score(entry.getKey(), entry.getValue(), signal))
                .filter(candidate -> candidate.getConfidence() > 0)
                .sorted(Comparator.comparing(DocumentTypeCandidate::getConfidence).reversed())
                .collect(Collectors.toList());

        if (scored.isEmpty()) {
            return new TypeClassification(
                    DocumentType.OTHER,
                    0.3,
                    "REVIEW",
                    List.of(new DocumentTypeCandidate(DocumentType.OTHER, 0.3)));
        }

        DocumentTypeCandidate top = scored.get(0);
        DocumentTypeCandidate second = scored.size() > 1 ? scored.get(1) : null;
        boolean ambiguous = top.getConfidence() < 0.6
                || (second != null && top.getConfidence() - second.getConfidence() < 0.15);
        return new TypeClassification(top.getType(), top.getConfidence(),
                ambiguous ? "REVIEW" : "AUTO", scored);
    }

    private DocumentTypeCandidate score(DocumentType type, List<String> terms, String signal) {
        long hits = terms.stream().filter(signal::contains).count();
        double confidence = hits == 0 ? 0 : Math.min(0.95, 0.55 + hits * 0.2);
        return new DocumentTypeCandidate(type, confidence);
    }

    private List<OcrField> fieldsFor(DocumentType type, String text) {
        List<OcrField> fields = new ArrayList<>();
        add(fields, "patientName", "Paziente", firstMatch(PATIENT, text), false);
        add(fields, "fiscalCode", "Codice fiscale", firstMatch(FISCAL_CODE, text), false);

        if (type == DocumentType.IDENTITY_DOCUMENT) {
            add(fields, "birthDate", "Data di nascita", firstDate(text), false);
            add(fields, "docKind", "Tipo documento", "Documento di identità", false);
        } else if (type == DocumentType.ADMISSION_FORM) {
            add(fields, "department", "Reparto", firstMatch(DEPARTMENT, text), false);
            add(fields, "admissionDate", "Data ricovero", firstDate(text), false);
        } else if (type == DocumentType.CONSENT_FORM) {
            add(fields, "treatment", "Trattamento", lineValue("trattamento", text), false);
            add(fields, "signatureDate", "Data firma", firstDate(text), true);
            add(fields, "consentOutcome", "Esito", "Consenso acquisito", false);
        } else if (type == DocumentType.MEDICAL_REPORT) {
            add(fields, "examType", "Esame", lineValue("esame", text), false);
            add(fields, "examDate", "Data esame", firstDate(text), false);
            add(fields, "conclusions", "Conclusioni", lineValue("conclusioni", text), false);
        } else if (type == DocumentType.DISCHARGE_DOCUMENT) {
            add(fields, "department", "Reparto", firstMatch(DEPARTMENT, text), false);
            add(fields, "dischargeDate", "Data dimissione", firstDate(text), false);
            add(fields, "diagnosis", "Diagnosi", lineValue("diagnosi", text), false);
            add(fields, "homeTherapy", "Terapia a domicilio", lineValue("terapia", text), false);
        } else {
            add(fields, "note", "Note", firstLine(text), false);
        }
        return fields;
    }

    private void add(List<OcrField> fields, String key, String label, String value, boolean editable) {
        if (StringUtils.hasText(value)) {
            fields.add(new OcrField(key, label, value.trim(), 0.8, "ocr", editable));
        }
    }

    private DocumentResolution resolutionFor(PatientDocument document, String text) {
        String fiscalCode = firstMatch(FISCAL_CODE, text);
        String patientName = firstMatch(PATIENT, text);
        boolean hasIdentity = StringUtils.hasText(fiscalCode) || StringUtils.hasText(patientName);
        PatientMatch match = new PatientMatch(
                hasIdentity ? "REVIEW" : "UNRESOLVED",
                hasIdentity ? 0.5 : 0,
                trimToNull(patientName),
                trimToNull(fiscalCode),
                document.getPatientId() == null ? List.of() : List.of(document.getPatientId()));
        return new DocumentResolution(document.getPatientId(), null, document.getAdmissionId(), match);
    }

    private String titleFor(DocumentType type) {
        switch (type) {
            case IDENTITY_DOCUMENT:
                return "Documento di identità";
            case ADMISSION_FORM:
                return "Modulo di ricovero";
            case CONSENT_FORM:
                return "Consenso informato";
            case MEDICAL_REPORT:
                return "Referto medico";
            case DISCHARGE_DOCUMENT:
                return "Lettera di dimissione";
            case OTHER:
            default:
                return "Documento clinico";
        }
    }

    private String firstMatch(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(valueOrEmpty(text));
        if (!matcher.find()) {
            return null;
        }
        return (matcher.groupCount() >= 1 ? matcher.group(1) : matcher.group()).trim();
    }

    private String firstDate(String text) {
        return firstMatch(DATE, text);
    }

    private String lineValue(String label, String text) {
        Pattern pattern = Pattern.compile("(?im)^\\s*" + Pattern.quote(label)
                + "\\s*[:\\-]\\s*(.+)$");
        return firstMatch(pattern, text);
    }

    private String firstLine(String text) {
        String value = trimToNull(text);
        if (value == null) {
            return null;
        }
        int newline = value.indexOf('\n');
        return newline >= 0 ? value.substring(0, newline).trim() : value;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
