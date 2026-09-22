// src/utils/columnBuilders.test.ts

import { describe, it, expect } from "vitest";
import { buildColumnsFromApi } from "./columnBuilders";
import type { CellContext } from "@tanstack/react-table";
import { prettifyHeader } from "./columnBuilders";

const mockColumns = [
  {
    id: "corporateId",
    header: "Corporate Id",
  },
  {
    id: "companyName",
    header: "Company Name",
  },
  {
    id: "username",
    header: "Username",
  },
  {
    id: "email",
    header: "Email",
  },
  {
    id: "merchants",
    header: "Merchants",
  },
  {
    id: "status",
    header: "Status",
  },
];

const mockCellContext = (
  value: unknown
): CellContext<unknown, unknown> =>
  ({
    getValue: () => value,
  }) as CellContext<unknown, unknown>;

describe("buildColumnsFromApi", () => {
  it("should build columns correctly from API response", () => {
    const result = buildColumnsFromApi(mockColumns);

    expect(result).toHaveLength(6);

    expect(result[0]).toMatchObject({
      accessorKey: "corporateId",
      id: "corporateId",
      header: "Corporate Id",
    });

    expect(result[1]).toMatchObject({
      accessorKey: "companyName",
      id: "companyName",
      header: "Company Name",
    });

    expect(result[5]).toMatchObject({
      accessorKey: "status",
      id: "status",
      header: "Status",
    });
  });

  it("should return '-' for null values", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[0].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext(null))).toBe("-");
  });

  it("should return '-' for undefined values", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[0].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext(undefined))).toBe("-");
  });

  it("should return '-' for empty string", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[0].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext(""))).toBe("-");
  });

  it("should stringify object values", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[4].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext({
        merchantId: 101,
        merchantName: "Demo Merchant",
      }))).toBe(JSON.stringify({
            merchantId: 101,
            merchantName: "Demo Merchant",
        })
      );
  });

  it("should return string values correctly", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[5].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext("ACTIVE"))).toBe("ACTIVE");

  });

  it("should convert number values to string", () => {
    const result = buildColumnsFromApi(mockColumns);

    const cell = result[0].cell as (
        ctx: CellContext<unknown, unknown>
    ) => unknown;

    expect(cell(mockCellContext(1001))).toBe("1001");

  });

  it("should default meta to empty object", () => {
    const result = buildColumnsFromApi(mockColumns);

    expect(result[0].meta).toEqual({});
  });
});

describe("prettifyHeader", () => {
  it("should replace underscores with spaces", () => {
    expect(prettifyHeader("company_name")).toBe("Company name");
  });

  it("should add spaces before capital letters", () => {
    expect(prettifyHeader("companyName")).toBe("Company Name");
  });

  it("should handle mixed underscore and camelCase", () => {
    expect(prettifyHeader("merchant_accountId")).toBe(
      "Merchant account Id"
    );
  });

  it("should remove extra spaces", () => {
    expect(prettifyHeader("company__name")).toBe("Company name");
  });

  it("should capitalize first letter", () => {
    expect(prettifyHeader("status")).toBe("Status");
  });

  it("should trim leading and trailing spaces", () => {
    expect(prettifyHeader("  companyName  ")).toBe(
      "Company Name"
    );
  });
});