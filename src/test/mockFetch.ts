import { vi } from "vitest";

export interface MockResponse {
  status?: number;
  body?: unknown;
  /** Raw response text, used instead of `body` when set (for malformed payloads). */
  text?: string;
}

export type Responder = MockResponse | ((init?: RequestInit) => MockResponse);

/**
 * Stubs `fetch` with a tiny router. Keys are matched as substrings of the
 * requested URL, longest key first, so `/wallet/fund` wins over `/wallet`.
 */
export const installFetchMock = (routes: Record<string, Responder>) => {
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const key = keys.find(k => url.includes(k));
    if (!key) return Promise.reject(new Error(`No mock route for ${url}`));

    const responder = routes[key];
    const result = typeof responder === "function" ? responder(init) : responder;
    const status = result.status ?? 200;
    const text = result.text ?? (result.body === undefined ? "" : JSON.stringify(result.body));

    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(text),
    } as Response);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

export const lastBody = (fetchMock: ReturnType<typeof installFetchMock>, urlPart: string): unknown => {
  const call = [...fetchMock.mock.calls].reverse().find(([input]) => String(input).includes(urlPart));
  if (!call) throw new Error(`No fetch call matching ${urlPart}`);
  const body = (call[1] as RequestInit | undefined)?.body;
  return typeof body === "string" ? JSON.parse(body) : body;
};
