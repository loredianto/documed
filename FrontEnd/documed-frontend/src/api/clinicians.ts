import { Clinico } from "../types";
import { requestJson } from "./http";

export const listClinicians = (): Promise<Clinico[]> =>
  requestJson<Clinico[]>("/api/clinicians");
