import { requestJson } from "./http";
import { MOCK_CLINICIANS } from "./mock-data";
import { Clinico } from "../types";

const MOCK = import.meta.env.VITE_MOCK_MODE === "true";

/**
 * Medici/clinici selezionabili come riferimento del documento.
 * Endpoint backend da definire (analogo ai reparti) — vedi nota di handoff.
 */
export const listClinicians = (): Promise<Clinico[]> =>
  MOCK
    ? new Promise((resolve) => setTimeout(() => resolve([...MOCK_CLINICIANS]), 150))
    : requestJson<Clinico[]>("/api/clinicians");
