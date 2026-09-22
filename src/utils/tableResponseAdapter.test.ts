import { describe, it, expect } from "vitest";
import { adaptTableResponse } from "./tableResponseAdapter";

const columns = [{ id: "name", header: "Name" }];
const rows = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
];

describe("adaptTableResponse", () => {
  it("throws 'Invalid API response' for non-object responses", () => {
    expect(() => adaptTableResponse("merchants-accounts", null)).toThrow(
      "Invalid API response"
    );
    expect(() => adaptTableResponse("merchants-accounts", "oops")).toThrow(
      "Invalid API response"
    );
    expect(() => adaptTableResponse("merchants-accounts", undefined)).toThrow(
      "Invalid API response"
    );
  });

  it("prefers pagination.totalRecordsCount over count and data.length", () => {
    const result = adaptTableResponse("merchants-accounts", {
      data: rows,
      columns,
      count: 50,
      pagination: { totalRecordsCount: 120 },
    });
    expect(result.total).toBe(120);
  });

  it("falls back to count when totalRecordsCount is missing or not a number", () => {
    expect(
      adaptTableResponse("merchants-accounts", {
        data: rows,
        columns,
        count: 50,
      }).total
    ).toBe(50);

    expect(
      adaptTableResponse("merchants-accounts", {
        data: rows,
        columns,
        count: 50,
        pagination: { totalRecordsCount: "120" },
      }).total
    ).toBe(50);
  });

  it("falls back to data.length when neither pagination nor count is usable", () => {
    const result = adaptTableResponse("merchants-accounts", {
      data: rows,
      columns,
    });
    expect(result.total).toBe(2);
  });

  it("defaults data to [] when missing or not an array", () => {
    const missing = adaptTableResponse("merchants-accounts", { columns });
    expect(missing.data).toEqual([]);
    expect(missing.total).toBe(0);

    const notArray = adaptTableResponse("merchants-accounts", {
      data: "nope",
      columns,
    });
    expect(notArray.data).toEqual([]);
  });

  it("builds header-cased columns from the first row for users-accounts", () => {
    const result = adaptTableResponse("users-accounts", {
      data: [
        { userId: 1, firstName: "Test", email: "user@example.com" },
        { userId: 2, firstName: "Other", email: "other@example.com" },
      ],
      // Backend columns are ignored for this dataset.
      columns: [{ id: "ignored", header: "Ignored" }],
    });
    expect(result.columns).toEqual([
      { id: "userId", header: "User Id" },
      { id: "firstName", header: "First Name" },
      { id: "email", header: "Email" },
    ]);
    expect(result.total).toBe(2);
  });

  it("returns empty columns for users-accounts when data is empty", () => {
    const result = adaptTableResponse("users-accounts", { data: [] });
    expect(result.columns).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("throws with the dataset key when columns are missing for other datasets", () => {
    expect(() =>
      adaptTableResponse("corps-accounts", { data: rows })
    ).toThrow("Columns missing in API response for dataset: corps-accounts");

    expect(() =>
      adaptTableResponse("api-logs", { data: rows, columns: "not-an-array" })
    ).toThrow("Columns missing in API response for dataset: api-logs");
  });
});
