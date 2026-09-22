import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSessionExpiry } from "./useSessionExpiry";
import { tokenStore } from "../services/auth/tokenStore";
import { endSession } from "../services/auth/session";
import type { StoredSession } from "../services/auth/types";

vi.mock("../services/auth/session", () => ({
  endSession: vi.fn(),
}));

const WARN_BEFORE_MS = 2 * 60_000;
// Mirrors the hook's skew guard: countdown runs against expiresAt - skew.
const CLOCK_SKEW_MS = 5_000;

const makeSession = (ttlMs: number): StoredSession => ({
  accessToken: "fake-jwt-token",
  tokenType: "Bearer",
  expiresAt: Date.now() + ttlMs,
  refreshToken: null,
});

describe("useSessionExpiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
    localStorage.clear();
    tokenStore.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports no-session when nothing is stored", () => {
    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));

    expect(result.current.status).toBe("no-session");
    expect(result.current.msRemaining).toBeNull();
  });

  it("is active until the warning boundary, then warns with a ticking countdown", () => {
    tokenStore.set(makeSession(10 * 60_000)); // 10 min

    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));
    expect(result.current.status).toBe("active");

    act(() => {
      vi.advanceTimersByTime(8 * 60_000); // to T-2min
    });
    expect(result.current.status).toBe("warning");
    expect(result.current.msRemaining).toBe(WARN_BEFORE_MS - CLOCK_SKEW_MS);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.msRemaining).toBe(WARN_BEFORE_MS - CLOCK_SKEW_MS - 1_000);
  });

  it("ends the session with 'expired' when the countdown runs out", () => {
    tokenStore.set(makeSession(3 * 60_000));

    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));

    act(() => {
      vi.advanceTimersByTime(3 * 60_000);
    });

    expect(endSession).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledWith("expired");
    expect(result.current.status).toBe("no-session");
  });

  it("resets to active when a new session arrives mid-countdown", () => {
    tokenStore.set(makeSession(3 * 60_000));

    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));

    act(() => {
      vi.advanceTimersByTime(90_000); // inside the warning window
    });
    expect(result.current.status).toBe("warning");

    act(() => {
      tokenStore.set(makeSession(30 * 60_000)); // fresh login / future refresh
    });
    expect(result.current.status).toBe("active");
    expect(endSession).not.toHaveBeenCalled();
  });

  it("recomputes immediately on visibilitychange after a clock jump (laptop sleep)", () => {
    tokenStore.set(makeSession(10 * 60_000));

    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));
    expect(result.current.status).toBe("active");

    act(() => {
      // Jump the clock past expiry WITHOUT firing timers (sleep suppresses them)
      vi.setSystemTime(new Date("2026-07-10T12:20:00Z"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(endSession).toHaveBeenCalledWith("expired");
  });

  it("goes to no-session when the store is cleared (logout elsewhere)", () => {
    tokenStore.set(makeSession(10 * 60_000));

    const { result } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));
    expect(result.current.status).toBe("active");

    act(() => {
      tokenStore.clear();
    });

    expect(result.current.status).toBe("no-session");
    expect(endSession).not.toHaveBeenCalled();
  });

  it("stops all timers on unmount", () => {
    tokenStore.set(makeSession(3 * 60_000));

    const { unmount } = renderHook(() => useSessionExpiry(WARN_BEFORE_MS));
    unmount();

    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });

    expect(endSession).not.toHaveBeenCalled();
  });
});
