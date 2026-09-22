import { describe, expect, it } from "vitest";
import { stepError } from "./stepProps";

const fieldErrors = {
  "merchants.0.dba": "DBA is required",
  "company.legalName": "Legal name must be at least 2 characters",
};

describe("stepError", () => {
  it("returns the message for a known path when the step should show errors", () => {
    expect(stepError(fieldErrors, "merchants.0.dba", true)).toBe("DBA is required");
  });

  it("returns undefined when the step is not yet showing errors, even if one exists", () => {
    expect(stepError(fieldErrors, "merchants.0.dba", false)).toBeUndefined();
  });

  it("returns undefined for a path with no recorded error", () => {
    expect(stepError(fieldErrors, "merchants.1.dba", true)).toBeUndefined();
    expect(stepError({}, "company.legalName", true)).toBeUndefined();
  });
});
