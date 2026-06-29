import { AUTH_EXPIRED_EVENT, apiFetch, clearAccessToken, isTokenUsable, storeAccessToken } from "./http";

function tokenWithPayload(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe("token session helpers", () => {
  afterEach(clearAccessToken);

  it("stores the token only in session storage", () => {
    storeAccessToken("test-token");
    expect(sessionStorage.getItem("documed.accessToken")).toBe("test-token");
    expect(localStorage.getItem("documed.accessToken")).toBeNull();
  });

  it("rejects expired and malformed tokens", () => {
    expect(isTokenUsable(tokenWithPayload({ exp: Math.floor(Date.now() / 1000) - 10 }))).toBe(false);
    expect(isTokenUsable("not-a-jwt")).toBe(false);
  });

  it("accepts a token whose expiration is in the future", () => {
    expect(isTokenUsable(tokenWithPayload({ exp: Math.floor(Date.now() / 1000) + 60 }))).toBe(true);
  });

  it("clears the session and notifies the app after a 401", async () => {
    storeAccessToken("test-token");
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response));

    await expect(apiFetch("/api/patients")).rejects.toMatchObject({ status: 401 });
    expect(sessionStorage.getItem("documed.accessToken")).toBeNull();
    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    vi.unstubAllGlobals();
  });
});
