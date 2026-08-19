import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_BASE, apiRequest, TOKEN_KEY } from "./api";
import { installFetchMock } from "../test/mockFetch";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("prefixes the endpoint with the API base and returns the parsed payload", async () => {
    const fetchMock = installFetchMock({ "/wallet": { body: { data: { balances: [] } } } });

    await expect(apiRequest("/wallet")).resolves.toEqual({ data: { balances: [] } });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/wallet`);
  });

  it("omits the Authorization header when no token is stored", async () => {
    const fetchMock = installFetchMock({ "/auth/me": { body: {} } });

    await apiRequest("/auth/me");

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("sends the stored token as a bearer header", async () => {
    localStorage.setItem(TOKEN_KEY, "tok-123");
    const fetchMock = installFetchMock({ "/auth/me": { body: {} } });

    await apiRequest("/auth/me");

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok-123");
  });

  it("lets caller headers override the defaults", async () => {
    const fetchMock = installFetchMock({ "/upload": { body: {} } });

    await apiRequest("/upload", { headers: { "Content-Type": "text/plain" } });

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("text/plain");
  });

  it("returns an empty object for a successful empty response", async () => {
    installFetchMock({ "/wallet": { status: 204, text: "   " } });

    await expect(apiRequest("/wallet")).resolves.toEqual({});
  });

  it("throws a status-based error for a failed empty response", async () => {
    installFetchMock({ "/wallet": { status: 500, text: "" } });

    await expect(apiRequest("/wallet")).rejects.toThrow("Request failed with status 500");
  });

  it("throws when the response body is not valid JSON", async () => {
    installFetchMock({ "/wallet": { text: "<html>oops</html>" } });

    await expect(apiRequest("/wallet")).rejects.toThrow("Invalid response from server");
  });

  it("surfaces the server message for a failed response", async () => {
    installFetchMock({ "/auth/login": { status: 401, body: { message: "Invalid credentials" } } });

    await expect(apiRequest("/auth/login")).rejects.toThrow("Invalid credentials");
  });

  it("falls back to a generic error when the failed response has no message", async () => {
    installFetchMock({ "/auth/login": { status: 400, body: { data: null } } });

    await expect(apiRequest("/auth/login")).rejects.toThrow("Request failed");
  });
});

describe("api helpers", () => {
  it("issues a GET without a body", async () => {
    const fetchMock = installFetchMock({ "/fx/rates": { body: { data: { rates: {} } } } });

    await api.get("/fx/rates?base=NGN");

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/fx/rates?base=NGN`);
    expect(fetchMock.mock.calls[0][1]?.method).toBeUndefined();
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("serializes the body for POST", async () => {
    const fetchMock = installFetchMock({ "/wallet/fund": { body: {} } });

    await api.post("/wallet/fund", { amount: 100, currency: "NGN" });

    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"amount":100,"currency":"NGN"}');
  });

  it("serializes the body for PATCH", async () => {
    const fetchMock = installFetchMock({ "/admin/users": { body: {} } });

    await api.patch("/admin/users/u1/role", { role: "ADMIN" });

    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH");
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"role":"ADMIN"}');
  });
});
