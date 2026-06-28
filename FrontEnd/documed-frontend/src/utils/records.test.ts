import { averageActiveStayDays, incompleteAdmissions, incompletePatients, missingMandatoryTypes } from "../utils/records";
import { Admission, Patient, PatientDocument } from "../types";

function admission(id: number, status: Admission["status"] = "ACTIVE"): Admission {
  return {
    id, patientId: id, admissionDate: "2026-06-20", dischargeDate: null,
    department: "Cardiologia", notes: null, status,
    createdAt: "2026-06-20T08:00:00Z", updatedAt: "2026-06-20T08:00:00Z",
  };
}

function doc(admissionId: number, documentType: PatientDocument["documentType"]): PatientDocument {
  return {
    id: `doc-${admissionId}-${documentType}`, patientId: admissionId, admissionId, documentType,
    originalFilename: "f.pdf", description: null, contentType: "application/pdf", fileSize: 1,
    ocrStatus: "COMPLETED", extractedText: null, ocrExtraction: null, ocrErrorMessage: null,
    uploadedAt: "2026-06-20T09:00:00Z", processedAt: null, filedInRecord: false,
  };
}

function patient(id: number, over: Partial<Patient>): Patient {
  return {
    id, firstName: "Mario", lastName: "Rossi", fiscalCode: "RSSMRC80A01H501Z",
    birthDate: "1980-01-01", email: "m@e.it", phone: "333",
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z", ...over,
  };
}

describe("missingMandatoryTypes", () => {
  it("lists the mandatory types not yet uploaded for an admission", () => {
    const docs = [doc(1, "ADMISSION_FORM"), doc(1, "CONSENT_FORM")];
    expect(missingMandatoryTypes(admission(1), docs)).toEqual(["IDENTITY_DOCUMENT"]);
  });

  it("returns empty when all mandatory documents are present", () => {
    const docs = [doc(1, "IDENTITY_DOCUMENT"), doc(1, "ADMISSION_FORM"), doc(1, "CONSENT_FORM")];
    expect(missingMandatoryTypes(admission(1), docs)).toEqual([]);
  });
});

describe("incompleteAdmissions", () => {
  it("flags only active admissions missing a mandatory document", () => {
    const admissions = [admission(1, "ACTIVE"), admission(2, "DISCHARGED")];
    const docs = [doc(1, "ADMISSION_FORM")];
    expect(incompleteAdmissions(admissions, docs).map((a) => a.id)).toEqual([1]);
  });

  it("ignores discharged admissions even if undocumented", () => {
    expect(incompleteAdmissions([admission(2, "DISCHARGED")], [])).toEqual([]);
  });
});

describe("averageActiveStayDays", () => {
  const now = new Date("2026-06-27T12:00:00Z");

  it("averages whole days since admission across active admissions", () => {
    const admissions = [
      { ...admission(1, "ACTIVE"), admissionDate: "2026-06-20" },   // 7 gg
      { ...admission(2, "ACTIVE"), admissionDate: "2026-06-24" },   // 3 gg
    ];
    expect(averageActiveStayDays(admissions, now)).toBe(5);
  });

  it("ignores discharged admissions", () => {
    const admissions = [
      { ...admission(1, "ACTIVE"), admissionDate: "2026-06-17" },     // 10 gg
      { ...admission(2, "DISCHARGED"), admissionDate: "2026-01-01" }, // escluso
    ];
    expect(averageActiveStayDays(admissions, now)).toBe(10);
  });

  it("returns zero when there are no active admissions", () => {
    expect(averageActiveStayDays([admission(1, "DISCHARGED")], now)).toBe(0);
  });
});

describe("incompletePatients", () => {
  it("flags patients missing a contact or fiscal code", () => {
    const patients = [
      patient(1, {}),
      patient(2, { email: null }),
      patient(3, { phone: null }),
      patient(4, { fiscalCode: "" }),
    ];
    expect(incompletePatients(patients).map((p) => p.id)).toEqual([2, 3, 4]);
  });
});
