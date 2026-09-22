import { describe, it, expect, vi, beforeEach } from "vitest";
import { tokenStore } from "./tokenStore";
import { recordAuthEvent } from "./audit";
import type { SessionEndReason } from "./types";

vi.mock("./tokenStore", () => ({
  tokenStore: {
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("./audit", () => ({
  recordAuthEvent: vi.fn(),
}));

const REASON_KEY = "tranzpay.auth.logout_reason";

// session.ts keeps module-level state (`ending`, `refreshInFlight`), so each
// test gets a fresh module instance via vi.resetModules() + dynamic import.
const loadSession = async () => {
  const mod = await import("./session");
  vi.spyOn(mod.navigation, "toLogin").mockImplementation(() => {});
  vi.spyOn(mod.navigation, "toHome").mockImplementation(() => {});
  return mod;
};

describe("session", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe("endSession", () => {
    it("clears the token store, stamps the reason, and redirects to login", async () => {
      const { endSession, navigation } = await loadSession();

      endSession("unauthorized");

      expect(tokenStore.clear).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(REASON_KEY)).toBe("unauthorized");
      expect(navigation.toLogin).toHaveBeenCalledTimes(1);
    });

    it("stamps 'expired' as the reason for expiry teardown", async () => {
      const { endSession } = await loadSession();

      endSession("expired");

      expect(sessionStorage.getItem(REASON_KEY)).toBe("expired");
    });

    it("does not stamp a reason for a voluntary logout", async () => {
      const { endSession, navigation } = await loadSession();

      endSession("logout");

      expect(sessionStorage.getItem(REASON_KEY)).toBeNull();
      expect(navigation.toLogin).toHaveBeenCalledTimes(1);
    });

    it("is idempotent — concurrent teardowns fire exactly once", async () => {
      const { endSession, navigation } = await loadSession();

      endSession("unauthorized");
      endSession("expired");
      endSession("logout");

      expect(tokenStore.clear).toHaveBeenCalledTimes(1);
      expect(navigation.toLogin).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(REASON_KEY)).toBe("unauthorized");
    });

    it.each([
      ["logout", "logout"],
      ["expired", "session_expired"],
      ["unauthorized", "session_unauthorized"],
    ] as const)("audits teardown reason %s as %s", async (reason, event) => {
      const { endSession } = await loadSession();

      endSession(reason as SessionEndReason);

      expect(recordAuthEvent).toHaveBeenCalledTimes(1);
      expect(recordAuthEvent).toHaveBeenCalledWith({ event, detail: { reason } });
    });

    it("audits exactly once for concurrent teardowns (idempotency covers audit)", async () => {
      const { endSession } = await loadSession();

      endSession("unauthorized");
      endSession("expired");

      expect(recordAuthEvent).toHaveBeenCalledTimes(1);
      expect(recordAuthEvent).toHaveBeenCalledWith({
        event: "session_unauthorized",
        detail: { reason: "unauthorized" },
      });
    });
  });

  describe("attemptRefresh", () => {
    it("is single-flight — concurrent callers share one promise", async () => {
      const { attemptRefresh } = await loadSession();

      const first = attemptRefresh();
      const second = attemptRefresh();

      expect(first).toBe(second);
      await first;
    });

    it("resolves null while the refresh backend is stubbed, without touching the store", async () => {
      const { attemptRefresh } = await loadSession();

      await expect(attemptRefresh()).resolves.toBeNull();
      expect(tokenStore.set).not.toHaveBeenCalled();
      expect(tokenStore.clear).not.toHaveBeenCalled();
    });

    it("allows a new refresh attempt after the previous one settles", async () => {
      const { attemptRefresh } = await loadSession();

      const first = attemptRefresh();
      await first;
      const second = attemptRefresh();

      expect(second).not.toBe(first);
      await expect(second).resolves.toBeNull();
    });
  });
});
