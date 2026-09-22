// src/utils/errorUtils.test.ts

import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import { getErrorMessage, getTraceId } from "./error";

describe("getErrorMessage", () => {
  it("should return detail from axios error response", () => {
    const error = new AxiosError(
      "Request failed"
    );

    error.response = {
      data: {
        detail: "Invalid credentials",
      },
    } as AxiosError["response"];

    expect(getErrorMessage(error)).toBe(
      "Invalid credentials"
    );
  });

  it("should return title when detail is not available", () => {
    const error = new AxiosError(
      "Request failed"
    );

    error.response = {
      data: {
        title: "Unauthorized",
      },
    } as AxiosError["response"];

    expect(getErrorMessage(error)).toBe(
      "Unauthorized"
    );
  });

  it("should return axios message when detail and title are not available", () => {
    const error = new AxiosError(
      "Network Error"
    );

    error.response = {
      data: {},
    } as AxiosError["response"];

    expect(getErrorMessage(error)).toBe(
      "Network Error"
    );
  });

  it("should return standard error message", () => {
    const error = new Error(
      "Something failed"
    );

    expect(getErrorMessage(error)).toBe(
      "Something failed"
    );
  });

  it("should return fallback message for unknown errors", () => {
    expect(
      getErrorMessage("unknown error")
    ).toBe("Something went wrong");
  });
});

describe("getTraceId", () => {
  it("should return traceId from axios error response", () => {
    const error = new AxiosError(
      "Request failed"
    );

    error.response = {
      data: {
        traceId: "trace-123",
      },
    } as AxiosError["response"];

    expect(getTraceId(error)).toBe(
      "trace-123"
    );
  });

  it("should return undefined when traceId is not available", () => {
    const error = new AxiosError(
      "Request failed"
    );

    error.response = {
      data: {},
    } as AxiosError["response"];

    expect(getTraceId(error)).toBeUndefined();
  });

  it("should return undefined for non axios errors", () => {
    const error = new Error(
      "Regular error"
    );

    expect(getTraceId(error)).toBeUndefined();
  });
});