import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { z } from "zod";
import { classifyLoginError, LoginLockedError } from "./loginErrors";

const NOW = new Date("2026-07-10T12:00:00Z").getTime();

const makeAxiosError = (status: number, headers: Record<string, string> = {}): AxiosError => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response = {
    status,
    statusText: "",
    data: {},
    headers,
    config,
  } as AxiosResponse;
  return new AxiosError("Request failed", String(status), config, {}, response);
};

const networkError = (): AxiosError =>
  new AxiosError("Network Error", "ERR_NETWORK", { headers: new AxiosHeaders() } as InternalAxiosRequestConfig);

describe("classifyLoginError", () => {
  it.each([400, 401, 403])("maps %i to invalid-credentials", (status) => {
    expect(classifyLoginError(makeAxiosError(status), NOW)).toEqual({
      kind: "invalid-credentials",
    });
  });

  it("maps 423 with delta-seconds Retry-After to locked", () => {
    expect(classifyLoginError(makeAxiosError(423, { "retry-after": "1800" }), NOW)).toEqual({
      kind: "locked",
      retryAfterMs: 1_800_000,
    });
  });

  it("maps 429 without Retry-After to locked with null", () => {
    expect(classifyLoginError(makeAxiosError(429), NOW)).toEqual({
      kind: "locked",
      retryAfterMs: null,
    });
  });

  it("parses an HTTP-date Retry-After", () => {
    const inFifteenMinutes = new Date(NOW + 15 * 60_000).toUTCString();
    expect(
      classifyLoginError(makeAxiosError(423, { "retry-after": inFifteenMinutes }), NOW),
    ).toEqual({ kind: "locked", retryAfterMs: 15 * 60_000 });
  });

  it("treats a past or garbage Retry-After as null", () => {
    const past = new Date(NOW - 60_000).toUTCString();
    expect(classifyLoginError(makeAxiosError(423, { "retry-after": past }), NOW)).toEqual({
      kind: "locked",
      retryAfterMs: null,
    });
    expect(classifyLoginError(makeAxiosError(423, { "retry-after": "soon" }), NOW)).toEqual({
      kind: "locked",
      retryAfterMs: null,
    });
  });

  it.each([500, 502, 503])("maps %i to unavailable (outages never count)", (status) => {
    expect(classifyLoginError(makeAxiosError(status), NOW)).toEqual({ kind: "unavailable" });
  });

  it("maps a network error (no response) to unavailable", () => {
    expect(classifyLoginError(networkError(), NOW)).toEqual({ kind: "unavailable" });
  });

  it("maps a non-axios error (e.g. response-shape parse failure) to unavailable", () => {
    const zodError = (() => {
      try {
        z.object({ access_token: z.string() }).parse({});
        return null;
      } catch (e) {
        return e;
      }
    })();

    expect(classifyLoginError(zodError, NOW)).toEqual({ kind: "unavailable" });
    expect(classifyLoginError(new Error("boom"), NOW)).toEqual({ kind: "unavailable" });
  });
});

describe("LoginLockedError", () => {
  it("carries lockedUntil and source, and is an Error", () => {
    const err = new LoginLockedError(NOW + 60_000, "local");

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("LoginLockedError");
    expect(err.lockedUntil).toBe(NOW + 60_000);
    expect(err.source).toBe("local");
  });
});
