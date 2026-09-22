import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLockout } from "./useLockout";
import {
  lockoutStore,
  recordFailedAttempt,
  clearLockout,
  usernameKey,
} from "../store/lockoutStore";

const LOCKOUT_KEY = "tranzpay.auth.lockout";
const LOCKOUT_DURATION_MS = 30 * 60_000;
const NOW = new Date("2026-07-10T12:00:00Z");

const lockUser = (username: string) => {
  recordFailedAttempt(username);
  recordFailedAttempt(username);
  recordFailedAttempt(username);
};

describe("useLockout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    localStorage.clear();
    lockoutStore.setState({ records: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports unlocked with zero failures for an unknown username", () => {
    const { result } = renderHook(() => useLockout("unknown@example.com"));

    expect(result.current).toEqual({
      locked: false,
      msRemaining: null,
      lockedUntil: null,
      failedCount: 0,
    });
  });

  it("exposes the running failure count before lockout", () => {
    recordFailedAttempt("test.user@example.com");
    recordFailedAttempt("test.user@example.com");

    const { result } = renderHook(() => useLockout("test.user@example.com"));

    expect(result.current.locked).toBe(false);
    expect(result.current.failedCount).toBe(2);
  });

  it("shows a ticking countdown while locked", () => {
    lockUser("test.user@example.com");

    const { result } = renderHook(() => useLockout("test.user@example.com"));
    expect(result.current.locked).toBe(true);
    expect(result.current.msRemaining).toBe(LOCKOUT_DURATION_MS);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.msRemaining).toBe(LOCKOUT_DURATION_MS - 1_000);
  });

  it("flips to unlocked at expiry without a reload", () => {
    lockUser("test.user@example.com");

    const { result } = renderHook(() => useLockout("test.user@example.com"));
    expect(result.current.locked).toBe(true);

    act(() => {
      vi.advanceTimersByTime(LOCKOUT_DURATION_MS);
    });

    expect(result.current.locked).toBe(false);
    expect(result.current.msRemaining).toBeNull();
  });

  it("recomputes on focus after a clock jump (laptop sleep)", () => {
    lockUser("test.user@example.com");

    const { result } = renderHook(() => useLockout("test.user@example.com"));
    expect(result.current.locked).toBe(true);

    act(() => {
      // Jump past expiry WITHOUT firing timers (sleep suppresses them)
      vi.setSystemTime(new Date(NOW.getTime() + LOCKOUT_DURATION_MS + 1));
      window.dispatchEvent(new Event("focus"));
    });

    expect(result.current.locked).toBe(false);
  });

  it("re-evaluates when the username changes (per-username lockout)", () => {
    lockUser("locked.user@example.com");

    const { result, rerender } = renderHook(({ username }) => useLockout(username), {
      initialProps: { username: "locked.user@example.com" },
    });
    expect(result.current.locked).toBe(true);

    rerender({ username: "other.user@example.com" });
    expect(result.current.locked).toBe(false);
  });

  it("unlocks live when the record is cleared (successful login elsewhere in the tab)", () => {
    lockUser("test.user@example.com");

    const { result } = renderHook(() => useLockout("test.user@example.com"));
    expect(result.current.locked).toBe(true);

    act(() => {
      clearLockout("test.user@example.com");
    });

    expect(result.current.locked).toBe(false);
  });

  it("picks up a lockout triggered in another tab (storage event)", () => {
    const { result } = renderHook(() => useLockout("test.user@example.com"));
    expect(result.current.locked).toBe(false);

    const envelope = JSON.stringify({
      state: {
        records: {
          [usernameKey("test.user@example.com")]: {
            failedCount: 3,
            lockedUntil: NOW.getTime() + LOCKOUT_DURATION_MS,
            source: "local",
            updatedAt: NOW.getTime(),
          },
        },
      },
      version: 1,
    });

    act(() => {
      localStorage.setItem(LOCKOUT_KEY, envelope);
      window.dispatchEvent(new StorageEvent("storage", { key: LOCKOUT_KEY, newValue: envelope }));
    });

    expect(result.current.locked).toBe(true);
  });

  it("stops its timer on unmount", () => {
    lockUser("test.user@example.com");

    const { unmount } = renderHook(() => useLockout("test.user@example.com"));

    // The environment owns other fake timers — assert only that unmount
    // releases the hook's tick timer.
    const before = vi.getTimerCount();
    unmount();

    expect(vi.getTimerCount()).toBeLessThan(before);
  });
});
