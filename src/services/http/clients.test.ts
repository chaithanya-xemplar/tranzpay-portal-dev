// src/services/http/clients.test.ts
//
// Tests the registered axios interceptor handlers directly (no HTTP):
// axios v1 stores them on `interceptors.request/.response` as
// `handlers[{ fulfilled, rejected }]`.

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { portalClient, authClient } from "./clients";
import { tokenStore } from "../auth/tokenStore";
import { attemptRefresh, endSession } from "../auth/session";
import type { StoredSession } from "../auth/types";

vi.mock("../auth/tokenStore", () => ({
  tokenStore: {
    getAuthHeader: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock("../auth/session", () => ({
  attemptRefresh: vi.fn(),
  endSession: vi.fn(),
}));

type Handler = {
  fulfilled: (value: unknown) => unknown;
  rejected: (error: unknown) => Promise<unknown>;
};

const requestHandler = (): Handler =>
  (portalClient.interceptors.request as unknown as { handlers: Handler[] })
    .handlers[0];

const responseHandler = (): Handler =>
  (portalClient.interceptors.response as unknown as { handlers: Handler[] })
    .handlers[0];

const makeSession = (overrides: Partial<StoredSession> = {}): StoredSession => ({
  accessToken: "fake-jwt-token",
  tokenType: "Bearer",
  expiresAt: Date.now() + 60_000,
  refreshToken: null,
  ...overrides,
});

const makeError = (status?: number, config?: Partial<InternalAxiosRequestConfig>) => ({
  response:
    status === undefined ? undefined : { status, data: { detail: "fake detail" } },
  config: {
    url: "/api/v1/fake-endpoint",
    headers: new AxiosHeaders(),
    ...config,
  },
  message: "Request failed",
});

describe("http clients", () => {
  const originalAdapter = portalClient.defaults.adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attemptRefresh).mockResolvedValue(null);
    // The interceptor logs via console.error — keep output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    portalClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it("creates both clients with a 20s timeout and no credentials", () => {
    // Note: Vite loads .env in test mode, so baseURL is env-dependent —
    // only the env-independent defaults are asserted here.
    expect(portalClient.defaults.timeout).toBe(20000);
    expect(authClient.defaults.timeout).toBe(20000);
    expect(portalClient.defaults.withCredentials).toBe(false);
    expect(authClient.defaults.withCredentials).toBe(false);
  });

  describe("request interceptor", () => {
    it("attaches the store's auth header (tokenType respected)", () => {
      vi.mocked(tokenStore.getAuthHeader).mockReturnValue("MAC fake-jwt-token");

      const config = { headers: {} } as unknown;
      const result = requestHandler().fulfilled(config) as InternalAxiosRequestConfig;

      expect(result.headers).toBeInstanceOf(AxiosHeaders);
      expect(result.headers.get("Authorization")).toBe("MAC fake-jwt-token");
    });

    it("does not overwrite an existing Authorization header", () => {
      vi.mocked(tokenStore.getAuthHeader).mockReturnValue("Bearer fake-jwt-token");

      const headers = new AxiosHeaders();
      headers.set("Authorization", "Bearer existing-fake-token");

      const result = requestHandler().fulfilled({
        headers,
      } as unknown) as InternalAxiosRequestConfig;

      expect(result.headers.get("Authorization")).toBe("Bearer existing-fake-token");
    });

    it("leaves headers untouched when there is no session", () => {
      vi.mocked(tokenStore.getAuthHeader).mockReturnValue(null);

      const headers = new AxiosHeaders();
      const result = requestHandler().fulfilled({
        headers,
      } as unknown) as InternalAxiosRequestConfig;

      expect(result.headers.has("Authorization")).toBe(false);
    });
  });

  describe("response interceptor", () => {
    it("passes fulfilled responses through unchanged (identity)", () => {
      const res = { data: { success: true }, status: 200 };

      expect(responseHandler().fulfilled(res)).toBe(res);
    });

    it("attempts a refresh on 401 and ends the session when refresh yields nothing", async () => {
      const err = makeError(401);

      await expect(responseHandler().rejected(err)).rejects.toBe(err);

      expect(attemptRefresh).toHaveBeenCalledTimes(1);
      expect(endSession).toHaveBeenCalledTimes(1);
      expect(endSession).toHaveBeenCalledWith("unauthorized");
      expect((err.config as { _retried?: boolean })._retried).toBe(true);
    });

    it("retries the original request once with the refreshed token", async () => {
      vi.mocked(attemptRefresh).mockResolvedValue("new-fake-token");
      vi.mocked(tokenStore.getSession).mockReturnValue(makeSession());
      vi.mocked(tokenStore.getAuthHeader).mockReturnValue(null);

      const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }));
      portalClient.defaults.adapter = adapter as unknown as AxiosAdapter;

      const err = makeError(401, { method: "get" });
      const result = (await responseHandler().rejected(err)) as {
        data: { ok: boolean };
      };

      expect(result.data.ok).toBe(true);
      expect(adapter).toHaveBeenCalledTimes(1);
      const sentConfig = adapter.mock.calls[0][0];
      expect(AxiosHeaders.from(sentConfig.headers).get("Authorization")).toBe(
        "Bearer new-fake-token"
      );
      expect(endSession).not.toHaveBeenCalled();
    });

    it("does not loop: a 401 on an already-retried request skips refresh and teardown", async () => {
      const err = makeError(401, { _retried: true } as Partial<InternalAxiosRequestConfig>);

      await expect(responseHandler().rejected(err)).rejects.toBe(err);

      expect(attemptRefresh).not.toHaveBeenCalled();
      expect(endSession).not.toHaveBeenCalled();
    });

    it("does not refresh or tear down on 500", async () => {
      const err = makeError(500);

      await expect(responseHandler().rejected(err)).rejects.toBe(err);

      expect(attemptRefresh).not.toHaveBeenCalled();
      expect(endSession).not.toHaveBeenCalled();
    });

    it("does not refresh or tear down when there is no response (network error)", async () => {
      const err = makeError(undefined);

      await expect(responseHandler().rejected(err)).rejects.toBe(err);

      expect(attemptRefresh).not.toHaveBeenCalled();
      expect(endSession).not.toHaveBeenCalled();
    });

    it("logs only sanitized fields — never headers or tokens", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const err = makeError(500);

      await expect(responseHandler().rejected(err)).rejects.toBe(err);

      const logged = errorSpy.mock.calls[0][1] as Record<string, unknown>;
      expect(Object.keys(logged).sort()).toEqual(["message", "status", "traceId", "url"]);
    });
  });
});
