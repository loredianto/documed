import { requestJson } from "./http";
import { MOCK_DEPARTMENTS } from "./mock-data";

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";

/** Reparti ospedalieri per l'inoltro dei documenti. Endpoint backend da definire — vedi nota di handoff. */
export const listDepartments = (): Promise<string[]> =>
  MOCK
    ? new Promise((resolve) => setTimeout(() => resolve([...MOCK_DEPARTMENTS]), 150))
    : requestJson<string[]>("/api/departments");
