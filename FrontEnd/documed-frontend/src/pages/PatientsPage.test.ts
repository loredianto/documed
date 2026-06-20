import { filterPatientRows } from "./PatientsPage";
import { Patient } from "../types";

const patient: Patient = {
  id: 1,
  firstName: "Mario",
  lastName: "Rossi",
  fiscalCode: "RSSMRA80A01H501U",
  birthDate: "1980-01-01",
  email: null,
  phone: null,
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
};

describe("filterPatientRows", () => {
  const rows = [{ patient, admissions: [] }];

  it("matches name, surname and fiscal code without case sensitivity", () => {
    expect(filterPatientRows(rows, "mario")).toHaveLength(1);
    expect(filterPatientRows(rows, "ROSSI")).toHaveLength(1);
    expect(filterPatientRows(rows, "rssmra80")).toHaveLength(1);
  });

  it("excludes non-matching patients", () => {
    expect(filterPatientRows(rows, "Bianchi")).toHaveLength(0);
  });
});
