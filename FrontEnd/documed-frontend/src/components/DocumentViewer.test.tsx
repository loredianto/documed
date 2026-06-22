import { render, screen } from "@testing-library/react";
import { PatientDocument } from "../types";
import { DocumentViewer } from "./DocumentViewer";

const baseDocument: PatientDocument = {
  id: "document-1",
  patientId: 1,
  admissionId: 2,
  documentType: "ADMISSION_FORM",
  originalFilename: "documento.png",
  description: null,
  contentType: "image/png",
  fileSize: 100,
  ocrStatus: "COMPLETED",
  extractedText: "testo",
  ocrErrorMessage: null,
  uploadedAt: "2026-06-21T10:00:00Z",
  processedAt: "2026-06-21T10:01:00Z",
};

describe("DocumentViewer", () => {
  it("renders an image preview", () => {
    render(<DocumentViewer document={baseDocument} previewUrl="blob:image" loading={false} error="" />);
    expect(screen.getByRole("img", { name: "Anteprima di documento.png" })).toHaveAttribute("src", "blob:image");
  });

  it("renders a native PDF preview", () => {
    const pdf = { ...baseDocument, originalFilename: "documento.pdf", contentType: "application/pdf" };
    render(<DocumentViewer document={pdf} previewUrl="blob:pdf" loading={false} error="" />);
    expect(screen.getByLabelText("Anteprima PDF di documento.pdf")).toHaveAttribute("data", "blob:pdf#toolbar=1&navpanes=0&view=FitH");
  });
});
