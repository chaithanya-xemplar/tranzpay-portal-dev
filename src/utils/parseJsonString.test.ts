// src/utils/parseJsonString.test.ts

import { describe, it, expect, vi, afterEach } from "vitest";
import { parseJsonString } from "./parseJsonString";

describe("parseJsonString", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return null when value is null", () => {
    expect(parseJsonString(null)).toBeNull();
  });

  it("should return null when value is undefined", () => {
    expect(parseJsonString(undefined)).toBeNull();
  });

  it("should return null when value is empty string", () => {
    expect(parseJsonString("")).toBeNull();
  });

  it("should parse valid JSON string", () => {
    const json = JSON.stringify({
      Name: "Sai",
      Status: "ACTIVE",
    });

    const result = parseJsonString<{
      name: string;
      status: string;
    }>(json);

    expect(result).toEqual({
      name: "Sai",
      status: "ACTIVE",
    });
  });

  it("should transform first letter of keys to lowercase", () => {
    const json = JSON.stringify({
      CorporateId: 1001,
      CompanyName: "ABC Corp",
    });

    const result = parseJsonString<{
      corporateId: number;
      companyName: string;
    }>(json);

    expect(result).toEqual({
      corporateId: 1001,
      companyName: "ABC Corp",
    });
  });

  it("should convert feeValue to number", () => {
    const json = JSON.stringify({
      FeeValue: "25",
    });

    const result = parseJsonString<{
      feeValue: number;
    }>(json);

    expect(result).toEqual({
      feeValue: 25,
    });
  });

  it("should convert batchCloseHours to number", () => {
    const json = JSON.stringify({
      BatchCloseHours: "12",
    });

    const result = parseJsonString<{
      batchCloseHours: number;
    }>(json);

    expect(result).toEqual({
      batchCloseHours: 12,
    });
  });

  it("should convert batchCloseMinutes to number", () => {
    const json = JSON.stringify({
      BatchCloseMinutes: "30",
    });

    const result = parseJsonString<{
      batchCloseMinutes: number;
    }>(json);

    expect(result).toEqual({
      batchCloseMinutes: 30,
    });
  });

  it("should return undefined for empty numeric fields", () => {
    const json = JSON.stringify({
      FeeValue: "",
      BatchCloseHours: null,
    });

    const result = parseJsonString<{
      feeValue?: number;
      batchCloseHours?: number;
    }>(json);

    expect(result).toEqual({
      feeValue: undefined,
      batchCloseHours: undefined,
    });
  });

  it("should return null for invalid JSON", () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = parseJsonString("{invalid json}");

    expect(result).toBeNull();

    expect(consoleSpy).toHaveBeenCalled();
  });
});