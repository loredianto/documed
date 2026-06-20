import { Admission, AdmissionInput, Patient, PatientInput, PatientStatistics } from "../types";
import { requestJson } from "./http";

export const listPatients = () => requestJson<Patient[]>("/api/patients");
export const getPatient = (id: number) => requestJson<Patient>(`/api/patients/${id}`);
export const createPatient = (input: PatientInput) =>
  requestJson<Patient>("/api/patients", { method: "POST", body: JSON.stringify(input) });
export const updatePatient = (id: number, input: PatientInput) =>
  requestJson<Patient>(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(input) });
export const listPatientAdmissions = (patientId: number) =>
  requestJson<Admission[]>(`/api/patients/${patientId}/admissions`);
export const getAdmission = (id: number) => requestJson<Admission>(`/api/admissions/${id}`);
export const openAdmission = (patientId: number, input: AdmissionInput) =>
  requestJson<Admission>(`/api/patients/${patientId}/admissions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
export const dischargeAdmission = (id: number, dischargeDate: string) =>
  requestJson<Admission>(`/api/admissions/${id}/discharge`, {
    method: "POST",
    body: JSON.stringify({ dischargeDate }),
  });
export const getPatientStatistics = () => requestJson<PatientStatistics>("/api/patients/statistics");
