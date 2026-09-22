import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createEmptySession } from "../model/defaults";
import { STORAGE_KEY_PREFIX } from "../model/storage";
import { useOnboardingSession } from "./useOnboardingSession";

function storedCompanyName(sessionId: string): string | undefined {
  const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
  if (!raw) return undefined;
  return (JSON.parse(raw) as { company: { legalName: string } }).company.legalName;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useOnboardingSession", () => {
  it("debounces autosave: no write before 700ms, write after", async () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "Acme" } }));
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(storedCompanyName(initial.id)).toBeUndefined();
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(storedCompanyName(initial.id)).toBe("Acme");
    expect(result.current.isSaving).toBe(false);
    expect(result.current.savedAt).toBeInstanceOf(Date);
  });

  it("restarts the debounce window on rapid patches", async () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "A" } }));
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "AB" } }));
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(storedCompanyName(initial.id)).toBeUndefined();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });
    expect(storedCompanyName(initial.id)).toBe("AB");
  });

  it("saveNow flushes the pending write immediately", async () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "Flushed" } }));
    });
    await act(async () => {
      result.current.saveNow();
      await Promise.resolve();
    });
    expect(storedCompanyName(initial.id)).toBe("Flushed");
  });

  it("patch stamps updatedAt", () => {
    const initial = createEmptySession("Test User");
    initial.updatedAt = "2026-01-01T00:00:00.000Z";
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, startedBy: "Someone Else" }));
    });
    expect(result.current.session.updatedAt).not.toBe("2026-01-01T00:00:00.000Z");
  });

  it("saveNow: isSaving goes true → false and savedAt is stamped, advancing on later saves", async () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    // The mount effect schedules the initial autosave, so a save is pending.
    expect(result.current.isSaving).toBe(true);
    expect(result.current.savedAt).toBeNull();

    await act(async () => {
      result.current.saveNow();
      await Promise.resolve();
    });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.savedAt).toBeInstanceOf(Date);
    const firstSavedAt = result.current.savedAt as Date;
    expect(storedCompanyName(initial.id)).toBe("");

    // A patch re-arms the debounce and flips isSaving back on.
    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "Later" } }));
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(700);
      await Promise.resolve();
    });
    expect(result.current.isSaving).toBe(false);
    expect((result.current.savedAt as Date).getTime()).toBeGreaterThan(firstSavedAt.getTime());
    expect(storedCompanyName(initial.id)).toBe("Later");
  });

  it("unmount clears the pending autosave without flushing (nothing is written)", async () => {
    const initial = createEmptySession("Test User");
    const { result, unmount } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "Ghost" } }));
    });
    unmount();

    // The effect cleanup cancels the timer, so the draft never reaches storage.
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(localStorage.getItem(STORAGE_KEY_PREFIX + initial.id)).toBeNull();
  });

  it("saveNow flushes the pending timer so the debounce does not double-write", async () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.patch((d) => ({ ...d, company: { ...d.company, legalName: "Once" } }));
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    await act(async () => {
      result.current.saveNow();
      await Promise.resolve();
    });
    expect(setItemSpy).toHaveBeenCalledTimes(1);

    // Advancing past the debounce window must not fire a second write.
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    setItemSpy.mockRestore();
  });

  it("goToStep marks the departing step visited (once) and moves the current step", () => {
    const initial = createEmptySession("Test User");
    const { result } = renderHook(() => useOnboardingSession(initial));

    act(() => {
      result.current.goToStep("company");
    });
    expect(result.current.session.currentStepId).toBe("company");
    // the step being entered for the first time is NOT visited yet
    expect(result.current.session.visitedSteps).toEqual(["account"]);

    act(() => {
      result.current.goToStep("account");
    });
    act(() => {
      result.current.goToStep("company");
    });
    expect(result.current.session.visitedSteps.filter((s) => s === "account")).toHaveLength(1);
    expect(result.current.session.visitedSteps).toContain("company");
  });
});
