import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const LOCKOUT_KEY = "tranzpay.auth.lockout";
const LOCKOUT_DURATION_MS = 30 * 60_000;
const NOW = new Date("2026-07-10T12:00:00Z").getTime();

// The store hydrates from localStorage at module load and keeps module-level
// state, so each test gets a fresh instance via vi.resetModules() + dynamic
// import (seed localStorage BEFORE loading when testing hydration).
const loadLockout = async () => await import("./lockoutStore");

type PersistedEnvelope = {
  state: { records: Record<string, unknown> };
  version: number;
};

const readPersisted = (): PersistedEnvelope =>
  JSON.parse(localStorage.getItem(LOCKOUT_KEY) ?? '{"state":{"records":{}},"version":1}') as PersistedEnvelope;

const makeEnvelope = (records: Record<string, unknown>, version = 1): string =>
  JSON.stringify({ state: { records }, version });

const lockedRecord = (now: number) => ({
  failedCount: 3,
  lockedUntil: now + LOCKOUT_DURATION_MS,
  source: "local",
  updatedAt: now,
});

describe("lockoutStore", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock("../constants/constants");
  });

  describe("usernameKey", () => {
    it("normalizes case and whitespace to the same key", async () => {
      const { usernameKey } = await loadLockout();

      expect(usernameKey("  JDoe@Example.com ")).toBe(usernameKey("jdoe@example.com"));
    });

    it("is stable and never persists the raw username", async () => {
      const { usernameKey, recordFailedAttempt } = await loadLockout();

      expect(usernameKey("test.user@example.com")).toBe(usernameKey("test.user@example.com"));

      recordFailedAttempt("test.user@example.com");
      expect(localStorage.getItem(LOCKOUT_KEY)).not.toContain("test.user");
    });

    it("produces different keys for different usernames", async () => {
      const { usernameKey } = await loadLockout();

      expect(usernameKey("user-a@example.com")).not.toBe(usernameKey("user-b@example.com"));
    });
  });

  describe("recordFailedAttempt / getLockoutStatus", () => {
    it("stays unlocked through the first two failures", async () => {
      const { recordFailedAttempt, getLockoutStatus } = await loadLockout();

      expect(recordFailedAttempt("test.user@example.com")).toEqual({ locked: false, failedCount: 1 });
      expect(recordFailedAttempt("test.user@example.com")).toEqual({ locked: false, failedCount: 2 });
      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 2 });
    });

    it("locks on the 3rd consecutive failure for 30 minutes and persists", async () => {
      const { recordFailedAttempt, getLockoutStatus, usernameKey } = await loadLockout();

      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      const third = recordFailedAttempt("test.user@example.com");

      expect(third).toEqual({
        locked: true,
        lockedUntil: NOW + LOCKOUT_DURATION_MS,
        msRemaining: LOCKOUT_DURATION_MS,
        source: "local",
      });
      expect(getLockoutStatus("test.user@example.com").locked).toBe(true);
      expect(readPersisted().state.records[usernameKey("test.user@example.com")]).toMatchObject({
        failedCount: 3,
        lockedUntil: NOW + LOCKOUT_DURATION_MS,
      });
    });

    it("hydrates a persisted lockout on module load (page reload path)", async () => {
      const { usernameKey } = await loadLockout();
      const key = usernameKey("test.user@example.com");

      vi.resetModules();
      localStorage.setItem(LOCKOUT_KEY, makeEnvelope({ [key]: lockedRecord(NOW) }));
      const { getLockoutStatus } = await loadLockout();

      expect(getLockoutStatus("test.user@example.com").locked).toBe(true);
    });

    it("unlocks lazily once the lockout window has elapsed", async () => {
      const { recordFailedAttempt, getLockoutStatus } = await loadLockout();

      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");

      vi.setSystemTime(NOW + LOCKOUT_DURATION_MS);
      expect(getLockoutStatus("test.user@example.com").locked).toBe(false);
    });

    it("a failure after an expired lockout starts a fresh window at count 1", async () => {
      const { recordFailedAttempt } = await loadLockout();

      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");

      vi.setSystemTime(NOW + LOCKOUT_DURATION_MS + 1);
      expect(recordFailedAttempt("test.user@example.com")).toEqual({
        locked: false,
        failedCount: 1,
      });
    });

    it("tracks usernames independently", async () => {
      const { recordFailedAttempt, getLockoutStatus } = await loadLockout();

      recordFailedAttempt("user-a@example.com");
      recordFailedAttempt("user-a@example.com");
      recordFailedAttempt("user-a@example.com");

      expect(getLockoutStatus("user-a@example.com").locked).toBe(true);
      expect(getLockoutStatus("user-b@example.com")).toEqual({ locked: false, failedCount: 0 });
    });
  });

  describe("clearLockout", () => {
    it("removes the record so the next status is clean", async () => {
      const { recordFailedAttempt, clearLockout, getLockoutStatus, usernameKey } = await loadLockout();

      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      clearLockout("test.user@example.com");

      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });
      expect(readPersisted().state.records[usernameKey("test.user@example.com")]).toBeUndefined();
    });

    it("is a no-op for an unknown username", async () => {
      const { clearLockout } = await loadLockout();

      expect(() => clearLockout("unknown@example.com")).not.toThrow();
    });
  });

  describe("recordServerLockout", () => {
    it("locks with the server-provided retry-after", async () => {
      const { recordServerLockout } = await loadLockout();

      expect(recordServerLockout("test.user@example.com", 900_000)).toEqual({
        locked: true,
        lockedUntil: NOW + 900_000,
        msRemaining: 900_000,
        source: "server",
      });
    });

    it("falls back to the policy duration when retry-after is null", async () => {
      const { recordServerLockout } = await loadLockout();

      const status = recordServerLockout("test.user@example.com", null);
      expect(status.locked && status.lockedUntil).toBe(NOW + LOCKOUT_DURATION_MS);
      expect(status.locked && status.source).toBe("server");
    });
  });

  describe("mirror-only mode", () => {
    it("counts failures but never creates a local lockout", async () => {
      vi.doMock("../constants/constants", async (importOriginal) => {
        const actual = await importOriginal<typeof import("../constants/constants")>();
        return {
          ...actual,
          AUTH_POLICY: { ...actual.AUTH_POLICY, CLIENT_LOCKOUT_MODE: "mirror-only" },
        };
      });
      const { recordFailedAttempt, recordServerLockout, getLockoutStatus } = await loadLockout();

      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");
      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 3 });

      // Only the server can lock in mirror-only mode.
      recordServerLockout("test.user@example.com", 60_000);
      expect(getLockoutStatus("test.user@example.com").locked).toBe(true);
    });
  });

  describe("storage hygiene", () => {
    it("purges corrupt JSON at hydration and fails open", async () => {
      localStorage.setItem(LOCKOUT_KEY, "{not-json");
      const { getLockoutStatus } = await loadLockout();

      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });
      expect(localStorage.getItem(LOCKOUT_KEY)).toBeNull();
    });

    it("purges a forged envelope whose record shape fails validation", async () => {
      localStorage.setItem(LOCKOUT_KEY, makeEnvelope({ abc: { failedCount: "two" } }));
      const { getLockoutStatus } = await loadLockout();

      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });
      expect(localStorage.getItem(LOCKOUT_KEY)).toBeNull();
    });

    it("discards state from an unknown schema version instead of merging it", async () => {
      const { usernameKey } = await loadLockout();
      const key = usernameKey("test.user@example.com");

      vi.resetModules();
      localStorage.setItem(LOCKOUT_KEY, makeEnvelope({ [key]: lockedRecord(NOW) }, 0));
      const { getLockoutStatus } = await loadLockout();

      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });
    });

    it("prunes stale records on write", async () => {
      const { recordFailedAttempt, usernameKey } = await loadLockout();

      recordFailedAttempt("stale@example.com");

      // Two lockout durations later the stale record is dropped by the next write.
      vi.setSystemTime(NOW + 2 * LOCKOUT_DURATION_MS + 1);
      recordFailedAttempt("fresh@example.com");

      expect(Object.keys(readPersisted().state.records)).toEqual([usernameKey("fresh@example.com")]);
    });

    it("caps the map at 20 records, dropping the oldest", async () => {
      const { recordFailedAttempt, usernameKey } = await loadLockout();

      for (let i = 0; i < 21; i++) {
        vi.setSystemTime(NOW + i * 1_000);
        recordFailedAttempt(`user-${i}@example.com`);
      }

      const records = readPersisted().state.records;
      expect(Object.keys(records)).toHaveLength(20);
      expect(records[usernameKey("user-0@example.com")]).toBeUndefined();
      expect(records[usernameKey("user-20@example.com")]).toBeDefined();
    });
  });

  describe("subscribeLockout / cross-tab", () => {
    it("propagates another tab's lockout via storage events", async () => {
      const { subscribeLockout, getLockoutStatus, usernameKey } = await loadLockout();
      const listener = vi.fn();
      subscribeLockout(listener);

      const envelope = makeEnvelope({ [usernameKey("test.user@example.com")]: lockedRecord(NOW) });
      localStorage.setItem(LOCKOUT_KEY, envelope);
      window.dispatchEvent(new StorageEvent("storage", { key: LOCKOUT_KEY, newValue: envelope }));

      expect(listener).toHaveBeenCalled();
      expect(getLockoutStatus("test.user@example.com").locked).toBe(true);
    });

    it("resets on cross-tab removal and full localStorage.clear()", async () => {
      const { recordFailedAttempt, getLockoutStatus, subscribeLockout } = await loadLockout();
      subscribeLockout(() => {});

      recordFailedAttempt("test.user@example.com");
      window.dispatchEvent(new StorageEvent("storage", { key: LOCKOUT_KEY, newValue: null }));
      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });

      recordFailedAttempt("test.user@example.com");
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
      expect(getLockoutStatus("test.user@example.com")).toEqual({ locked: false, failedCount: 0 });
    });

    it("ignores unrelated keys and unsubscribes cleanly", async () => {
      const { subscribeLockout, recordFailedAttempt } = await loadLockout();
      const listener = vi.fn();
      const unsubscribe = subscribeLockout(listener);

      window.dispatchEvent(new StorageEvent("storage", { key: "some-other-key", newValue: "x" }));
      expect(listener).not.toHaveBeenCalled();

      recordFailedAttempt("test.user@example.com");
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      recordFailedAttempt("test.user@example.com");
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
