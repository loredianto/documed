package it.projectwork.documed.documentservice.domain;

/**
 * One key/value field extracted from OCR text and shown in the digital document
 * editor.
 */
public class OcrField {

    private String key;
    private String label;
    private String value;
    private Double confidence;
    private String source;
    private Boolean editable;

    public OcrField() {
    }

    public OcrField(String key, String label, String value, Double confidence,
            String source, Boolean editable) {
        this.key = key;
        this.label = label;
        this.value = value;
        this.confidence = confidence;
        this.source = source;
        this.editable = editable;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Boolean getEditable() {
        return editable;
    }

    public void setEditable(Boolean editable) {
        this.editable = editable;
    }
}
