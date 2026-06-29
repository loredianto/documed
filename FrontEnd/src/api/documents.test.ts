import { buildDocumentSearchPath } from "./documents";

describe("buildDocumentSearchPath", () => {
  it("encodes text and explicit filters", () => {
    expect(buildDocumentSearchPath({ query: "consenso informato", admissionId: 12, ocrStatus: "COMPLETED" }))
      .toBe("/api/documents/search?query=consenso+informato&admissionId=12&ocrStatus=COMPLETED");
  });

  it("does not send empty optional filters", () => {
    expect(buildDocumentSearchPath({ query: "  ", documentType: "" })).toBe("/api/documents/search?");
  });
});
