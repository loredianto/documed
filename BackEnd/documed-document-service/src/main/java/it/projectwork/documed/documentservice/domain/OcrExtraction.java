package it.projectwork.documed.documentservice.domain;

import java.util.List;

/**
 * Structured OCR output consumed by the frontend digital-document editor.
 */
public class OcrExtraction {

    private String title;
    private List<OcrField> fields;
    private String bodyText;
    private TypeClassification classification;
    private DocumentResolution resolution;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<OcrField> getFields() {
        return fields;
    }

    public void setFields(List<OcrField> fields) {
        this.fields = fields;
    }

    public String getBodyText() {
        return bodyText;
    }

    public void setBodyText(String bodyText) {
        this.bodyText = bodyText;
    }

    public TypeClassification getClassification() {
        return classification;
    }

    public void setClassification(TypeClassification classification) {
        this.classification = classification;
    }

    public DocumentResolution getResolution() {
        return resolution;
    }

    public void setResolution(DocumentResolution resolution) {
        this.resolution = resolution;
    }
}
