import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { StoredSession } from "./types";

const SESSION_KEY = "tranzpay.auth.session";
const LEGACY_TOKEN_KEY = "access_token";
const LEGACY_EXPIRY_KEY = "access_token_expires_at";

// tokenStore.ts keeps module-level in-memory state, so each test gets a fresh
// module instance via vi.resetModules() + dynamic import.
const loadStore = async () => {
  const mod = await import("./tokenStore");
  return mod.tokenStore;
};

const makeSession = (overrides: Partial<StoredSession> = {}): StoredSession => ({
  accessToken: "fake-jwt-token",
  tokenType: "Bearer",
  expiresAt: Date.now() + 60_000,
  refreshToken: null,
  ...overrides,
});

describe("tokenStore", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when nothing is stored", async () => {
    const store = await loadStore();

    expect(store.getAccessToken()).toBeNull();
    expect(store.getSession()).toBeNull();
    expect(store.getExpiresAt()).toBeNull();
  });

  it("set persists the session as JSON and getAccessToken returns the token", async () => {
    const store = await loadStore();
    const session = makeSession();

    store.set(session);

    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? "")).toEqual(session);
    expect(store.getAccessToken()).toBe("fake-jwt-token");
    expect(store.getExpiresAt()).toBe(session.expiresAt);
  });

  it("purges legacy two-key storage on module load", async () => {
    localStorage.setItem(LEGACY_TOKEN_KEY, "old-token");
    localStorage.setItem(LEGACY_EXPIRY_KEY, String(Date.now() + 60_000));

    const store = await loadStore();

    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_EXPIRY_KEY)).toBeNull();
    expect(store.getAccessToken()).toBeNull();
  });

  it("hydrates from localStorage only (reload path) and caches in memory", async () => {
    const store = await loadStore();
    localStorage.setItem(SESSION_KEY, JSON.stringify(makeSession()));

    expect(store.getAccessToken()).toBe("fake-jwt-token");

    // After a successful read, the session is cached in memory: silently
    // clearing localStorage (no storage event) does not log the user out.
    localStorage.clear();
    expect(store.getAccessToken()).toBe("fake-jwt-token");
  });

  it("returns null and clears when expiry is exactly now + 5000 (skew boundary)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    const store = await loadStore();

    store.set(makeSession({ expiresAt: Date.now() + 5_000 }));

    expect(store.getAccessToken()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("returns the token when expiry is now + 5001 (just past the skew boundary)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    const store = await loadStore();

    store.set(makeSession({ expiresAt: Date.now() + 5_001 }));

    expect(store.getAccessToken()).toBe("fake-jwt-token");
  });

  it("getSession returns an expired session without self-clearing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    const store = await loadStore();
    const session = makeSession({ expiresAt: Date.now() - 1_000 });

    store.set(session);

    expect(store.getSession()).toEqual(session);
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });

  it("clears and returns null on corrupt JSON in storage", async () => {
    const store = await loadStore();
    localStorage.setItem(SESSION_KEY, "{not-json");

    expect(store.getAccessToken()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("clears and returns null when the stored shape fails validation", async () => {
    const store = await loadStore();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ tokenType: "Bearer" }));

    expect(store.getAccessToken()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("getAuthHeader combines tokenType and token, null when no fresh session", async () => {
    const store = await loadStore();

    expect(store.getAuthHeader()).toBeNull();

    store.set(makeSession({ tokenType: "Bearer" }));
    expect(store.getAuthHeader()).toBe("Bearer fake-jwt-token");
  });

  it("clear removes the session key and getAccessToken returns null", async () => {
    const store = await loadStore();

    store.set(makeSession());
    store.clear();

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(store.getAccessToken()).toBeNull();
  });

  it("notifies subscribers on set and clear, and unsubscribe stops notifications", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const session = makeSession();

    store.set(session);
    expect(listener).toHaveBeenCalledWith(session, "local");

    store.clear();
    expect(listener).toHaveBeenCalledWith(null, "local");
    expect(listener).toHaveBeenCalledTimes(2);

    // clear() on an already-empty store does not re-notify
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.set(session);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("cross-tab storage event invalidates the memory cache and notifies", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(makeSession());
    listener.mockClear();

    // Simulate another tab logging out: storage changes underneath us.
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: SESSION_KEY, newValue: null })
    );

    expect(listener).toHaveBeenCalledWith(null, "cross-tab");
    expect(store.getAccessToken()).toBeNull();
  });

  it("cross-tab login surfaces the other tab's session", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const session = makeSession({ accessToken: "other-tab-token" });

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SESSION_KEY,
        newValue: JSON.stringify(session),
      })
    );

    expect(listener).toHaveBeenCalledWith(session, "cross-tab");
    expect(store.getAccessToken()).toBe("other-tab-token");
  });

  it("ignores storage events for unrelated keys", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", { key: "some-other-key", newValue: "x" })
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
