// src/services/auth/auth.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { loginApi, logout, resolveExpiresAt } from "./auth";
import { authClient } from "../http/clients";
import { tokenStore } from "./tokenStore";
import { endSession } from "./session";
import { LoginLockedError } from "./loginErrors";
import { recordAuthEvent } from "./audit";
import {
  clearLockout,
  getLockoutStatus,
  recordFailedAttempt,
  recordServerLockout,
} from "../../store/lockoutStore";

vi.mock("../http/clients", () => ({
  authClient: {
    post: vi.fn(),
  },
}));

vi.mock("./tokenStore", () => ({
  tokenStore: {
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("./session", () => ({
  endSession: vi.fn(),
}));

vi.mock("./audit", () => ({
  recordAuthEvent: vi.fn(),
  maskUsername: vi.fn(() => "t***@e***.com"),
}));

// loginErrors (classifyLoginError / LoginLockedError) is pure — use the real one.
vi.mock("../../store/lockoutStore", () => ({
  getLockoutStatus: vi.fn(() => ({ locked: false, failedCount: 0 })),
  recordFailedAttempt: vi.fn(() => ({ locked: false, failedCount: 1 })),
  recordServerLockout: vi.fn(() => ({ locked: false, failedCount: 0 })),
  clearLockout: vi.fn(),
}));

const makeHttpError = (status: number, headers: Record<string, string> = {}): AxiosError => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response = { status, statusText: "", data: {}, headers, config } as AxiosResponse;
  return new AxiosError("Request failed", String(status), config, {}, response);
};

const NOW = new Date("2026-07-10T12:00:00Z").getTime();

describe("resolveExpiresAt", () => {
  it("treats a number as RFC 6749 seconds", () => {
    expect(resolveExpiresAt(3600, NOW)).toBe(NOW + 3600 * 1000);
  });

  it("treats a numeric string as seconds", () => {
    expect(resolveExpiresAt("3600", NOW)).toBe(NOW + 3600 * 1000);
  });

  it("accepts the current backend's ISO datetime format", () => {
    const iso = "2026-07-10T13:00:00.000+00:00";
    expect(resolveExpiresAt(iso, NOW)).toBe(new Date(iso).getTime());
  });

  it("falls back to 15 minutes for an ISO datetime in the past", () => {
    expect(resolveExpiresAt("2020-01-01T00:00:00Z", NOW)).toBe(NOW + 15 * 60 * 1000);
  });

  it("does not misread an epoch-ms numeric string as seconds", () => {
    // Epoch ms as a string exceeds the plausible-TTL bound and is not a
    // parseable date string → falls back.
    expect(resolveExpiresAt(String(NOW + 60_000), NOW)).toBe(NOW + 15 * 60 * 1000);
  });

  it.each([undefined, null, "", "garbage", 0, -5, Number.NaN])(
    "falls back to 15 minutes for unusable value %j",
    (value) => {
      expect(resolveExpiresAt(value, NOW)).toBe(NOW + 15 * 60 * 1000);
    }
  );
});

describe("loginApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const payload = { userName: "test.user@example.com", password: "not-a-real-password" };

  it("clears any stale session before posting credentials", async () => {
    vi.mocked(authClient.post).mockResolvedValue({
      data: { access_token: "fake-jwt-token" },
    });

    await loginApi(payload);

    const clearOrder = vi.mocked(tokenStore.clear).mock.invocationCallOrder[0];
    const postOrder = vi.mocked(authClient.post).mock.invocationCallOrder[0];
    expect(clearOrder).toBeLessThan(postOrder);
    expect(authClient.post).toHaveBeenCalledWith("/token", payload);
  });

  it("stores the session with Bearer default and null refreshToken", async () => {
    vi.mocked(authClient.post).mockResolvedValue({
      data: { access_token: "fake-jwt-token", expires_in: 3600 },
    });

    await loginApi(payload);

    expect(tokenStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "fake-jwt-token",
        tokenType: "Bearer",
        refreshToken: null,
      })
    );
    const stored = vi.mocked(tokenStore.set).mock.calls[0][0];
    expect(stored.expiresAt).toBeGreaterThan(Date.now());
  });

  it("respects a token_type sent by the backend", async () => {
    vi.mocked(authClient.post).mockResolvedValue({
      data: { access_token: "fake-jwt-token", token_type: "MAC" },
    });

    await loginApi(payload);

    expect(tokenStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ tokenType: "MAC" })
    );
  });

  it("rejects a response without an access_token and stores nothing", async () => {
    vi.mocked(authClient.post).mockResolvedValue({
      data: { token_type: "Bearer" },
    });

    await expect(loginApi(payload)).rejects.toThrow();
    expect(tokenStore.set).not.toHaveBeenCalled();
  });

  it("propagates transport errors without storing a session", async () => {
    const err = new Error("Network Error");
    vi.mocked(authClient.post).mockRejectedValue(err);

    await expect(loginApi(payload)).rejects.toBe(err);
    expect(tokenStore.set).not.toHaveBeenCalled();
  });

  describe("lockout orchestration", () => {
    it("throws LoginLockedError without a network call while locked", async () => {
      vi.mocked(getLockoutStatus).mockReturnValueOnce({
        locked: true,
        lockedUntil: NOW + 60_000,
        msRemaining: 60_000,
        source: "local",
      });

      await expect(loginApi(payload)).rejects.toBeInstanceOf(LoginLockedError);
      expect(authClient.post).not.toHaveBeenCalled();
      expect(tokenStore.clear).not.toHaveBeenCalled();
      expect(recordAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: "login_blocked_locked" })
      );
    });

    it("clears the lockout record and audits success on login", async () => {
      vi.mocked(authClient.post).mockResolvedValue({
        data: { access_token: "fake-jwt-token" },
      });

      await loginApi(payload);

      expect(clearLockout).toHaveBeenCalledWith(payload.userName);
      expect(recordAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: "login_success", usernameMasked: "t***@e***.com" })
      );
    });

    it("counts a 401 as a failed attempt, audits it, and rethrows the original error", async () => {
      const err = makeHttpError(401);
      vi.mocked(authClient.post).mockRejectedValue(err);

      await expect(loginApi(payload)).rejects.toBe(err);

      expect(recordFailedAttempt).toHaveBeenCalledWith(payload.userName);
      expect(recordAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: "login_failure", detail: { failedCount: 1 } })
      );
      expect(clearLockout).not.toHaveBeenCalled();
    });

    it("throws LoginLockedError and audits lockout_start when the failure locks", async () => {
      vi.mocked(authClient.post).mockRejectedValue(makeHttpError(401));
      vi.mocked(recordFailedAttempt).mockReturnValueOnce({
        locked: true,
        lockedUntil: NOW + 30 * 60_000,
        msRemaining: 30 * 60_000,
        source: "local",
      });

      await expect(loginApi(payload)).rejects.toMatchObject({
        name: "LoginLockedError",
        lockedUntil: NOW + 30 * 60_000,
        source: "local",
      });
      expect(recordAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "lockout_start",
          detail: { lockedUntil: NOW + 30 * 60_000, source: "local" },
        })
      );
    });

    it("never counts an outage (network/5xx) toward the lockout", async () => {
      vi.mocked(authClient.post).mockRejectedValueOnce(new Error("Network Error"));
      await expect(loginApi(payload)).rejects.toThrow("Network Error");

      vi.mocked(authClient.post).mockRejectedValueOnce(makeHttpError(503));
      await expect(loginApi(payload)).rejects.toBeInstanceOf(AxiosError);

      expect(recordFailedAttempt).not.toHaveBeenCalled();
      expect(recordServerLockout).not.toHaveBeenCalled();
    });

    it("does not count a malformed success response as a failed attempt", async () => {
      vi.mocked(authClient.post).mockResolvedValue({ data: { token_type: "Bearer" } });

      await expect(loginApi(payload)).rejects.toThrow();
      expect(recordFailedAttempt).not.toHaveBeenCalled();
    });

    it("mirrors a server 423 lockout and throws with source server", async () => {
      vi.mocked(authClient.post).mockRejectedValue(makeHttpError(423, { "retry-after": "900" }));
      vi.mocked(recordServerLockout).mockReturnValueOnce({
        locked: true,
        lockedUntil: NOW + 900_000,
        msRemaining: 900_000,
        source: "server",
      });

      await expect(loginApi(payload)).rejects.toMatchObject({
        name: "LoginLockedError",
        source: "server",
      });
      expect(recordServerLockout).toHaveBeenCalledWith(payload.userName, 900_000);
      expect(recordFailedAttempt).not.toHaveBeenCalled();
    });
  });
});

describe("logout", () => {
  it("delegates to endSession with the logout reason", () => {
    logout();

    expect(endSession).toHaveBeenCalledWith("logout");
  });
});
