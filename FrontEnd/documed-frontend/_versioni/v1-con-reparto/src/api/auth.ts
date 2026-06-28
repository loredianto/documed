import { apiBaseUrl, ApiError, storeAccessToken } from "./http";

interface TokenResponse {
  access_token: string;
}

// Fake JWT with exp far in the future, passes isTokenUsable()
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.mock";

export async function login(username: string, password: string): Promise<void> {
  if (import.meta.env.VITE_MOCK_MODE === "true") {
    if (username === "admin" && password === "AdminDemo123!") {
      storeAccessToken(MOCK_TOKEN);
      return;
    }
    throw new ApiError("Credenziali amministratore non valide", 401, "LOGIN_FAILED");
  }

  const clientId = import.meta.env.VITE_AUTH_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_AUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError("Client OAuth2 frontend non configurato", 0, "OAUTH_CLIENT_NOT_CONFIGURED");
  }

  const body = new URLSearchParams({ grant_type: "password", username, password });
  const response = await fetch(`${apiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status === 400 || response.status === 401
        ? "Credenziali amministratore non valide"
        : "Servizio di autenticazione non disponibile",
      response.status,
      "LOGIN_FAILED",
    );
  }
  const token = (await response.json()) as TokenResponse;
  storeAccessToken(token.access_token);
}
