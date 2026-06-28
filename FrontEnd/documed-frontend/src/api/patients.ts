import { Admission, AdmissionInput, DailyActivity, Patient, PatientInput, PatientStatistics } from "../types";
import { requestJson } from "./http";
import { MOCK_ADMISSIONS, MOCK_DAILY_ACTIVITY, MOCK_PATIENTS, MOCK_STATISTICS } from "./mock-data";

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";

function mockDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

let mockPatients = [...MOCK_PATIENTS];
let mockAdmissions = [...MOCK_ADMISSIONS];
let nextPatientId = 20;
let nextAdmissionId = 200;

export const listPatients = () =>
  MOCK ? mockDelay([...mockPatients]) : requestJson<Patient[]>("/api/patients");

export const getPatient = (id: number) =>
  MOCK
    ? mockDelay(mockPatients.find((p) => p.id === id)!)
    : requestJson<Patient>(`/api/patients/${id}`);

export const createPatient = (input: PatientInput) => {
  if (MOCK) {
    const now = new Date().toISOString();
    const p: Patient = { ...input, id: nextPatientId++, createdAt: now, updatedAt: now };
    mockPatients = [...mockPatients, p];
    return mockDelay(p);
  }
  return requestJson<Patient>("/api/patients", { method: "POST", body: JSON.stringify(input) });
};

export const updatePatient = (id: number, input: PatientInput) => {
  if (MOCK) {
    const now = new Date().toISOString();
    mockPatients = mockPatients.map((p) => (p.id === id ? { ...p, ...input, updatedAt: now } : p));
    return mockDelay(mockPatients.find((p) => p.id === id)!);
  }
  return requestJson<Patient>(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(input) });
};

/** Elimina un paziente dalla rubrica. Endpoint backend da definire — vedi nota di handoff. */
export const deletePatient = (id: number) => {
  if (MOCK) {
    mockPatients = mockPatients.filter((p) => p.id !== id);
    return mockDelay<void>(undefined);
  }
  return requestJson<void>(`/api/patients/${id}`, { method: "DELETE" });
};

export const listPatientAdmissions = (patientId: number) =>
  MOCK
    ? mockDelay(mockAdmissions.filter((a) => a.patientId === patientId))
    : requestJson<Admission[]>(`/api/patients/${patientId}/admissions`);

export const getAdmission = (id: number) =>
  MOCK
    ? mockDelay(mockAdmissions.find((a) => a.id === id)!)
    : requestJson<Admission>(`/api/admissions/${id}`);

/** Lista di tutti i ricoveri (per la pagina Ricoveri). Endpoint backend da definire — vedi nota di handoff. */
export const listAdmissions = () =>
  MOCK ? mockDelay([...mockAdmissions]) : requestJson<Admission[]>("/api/admissions");

/** Attività ingressi/dimissioni nell'intervallo [from, to] (estremi inclusi, YYYY-MM-DD). */
export const getActivityRange = (from: string, to: string) => {
  if (MOCK) {
    const f = from.slice(0, 10);
    const t = to.slice(0, 10);
    return mockDelay(MOCK_DAILY_ACTIVITY.filter((d) => d.date >= f && d.date <= t));
  }
  return requestJson<DailyActivity[]>(
    `/api/patients/statistics/activity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
};

export const openAdmission = (patientId: number, input: AdmissionInput) => {
  if (MOCK) {
    const now = new Date().toISOString();
    const a: Admission = {
      ...input,
      id: nextAdmissionId++,
      patientId,
      dischargeDate: null,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    mockAdmissions = [...mockAdmissions, a];
    return mockDelay(a);
  }
  return requestJson<Admission>(`/api/patients/${patientId}/admissions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const dischargeAdmission = (id: number, dischargeDate: string) => {
  if (MOCK) {
    const now = new Date().toISOString();
    mockAdmissions = mockAdmissions.map((a) =>
      a.id === id ? { ...a, dischargeDate, status: "DISCHARGED" as const, updatedAt: now } : a,
    );
    return mockDelay(mockAdmissions.find((a) => a.id === id)!);
  }
  return requestJson<Admission>(`/api/admissions/${id}/discharge`, {
    method: "POST",
    body: JSON.stringify({ dischargeDate }),
  });
};

/** Elimina un ricovero. Endpoint backend da definire — vedi nota di handoff. */
export const deleteAdmission = (id: number) => {
  if (MOCK) {
    mockAdmissions = mockAdmissions.filter((a) => a.id !== id);
    return mockDelay<void>(undefined);
  }
  return requestJson<void>(`/api/admissions/${id}`, { method: "DELETE" });
};

export const getPatientStatistics = () =>
  MOCK ? mockDelay({ ...MOCK_STATISTICS }) : requestJson<PatientStatistics>("/api/patients/statistics");
