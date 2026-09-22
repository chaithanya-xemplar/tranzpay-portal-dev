import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("first"));
    expect(result.current).toBe("first");
  });

  it("updates only after the default 300ms delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: "first" } }
    );

    rerender({ value: "second" });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("second");
  });

  it("only applies the last value on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: "start" } }
    );

    rerender({ value: "a" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "c" });

    // Intermediate values never surface.
    expect(result.current).toBe("start");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("c");
  });

  it("honors a custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 500),
      { initialProps: { value: 1 } }
    );

    rerender({ value: 2 });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(2);
  });
});
