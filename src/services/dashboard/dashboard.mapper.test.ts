// src/services/dashboard/dashboard.mapper.test.ts

import { describe, it, expect } from "vitest";
import { formatCurrency, formatWithSuffix } from "../../utils/formatters";
import { DASHBOARD_ICON_MAP } from "../../constants/constants";

import {
  mapTransactionsPerHour,
  mapDashboardTilesToStatCards,
  mapTransactionCountsToChart,
  type DashboardTile,
  type TransactionCount,
  type TransactionsPerHour,
} from "./dashboard.mapper";

const tile = (overrides: Partial<DashboardTile> = {}): DashboardTile => ({
  title: "Sales This Month",
  icon: "",
  amount: 1234.5,
  lossOrGain: 5,
  ...overrides,
});

describe("mapTransactionsPerHour", () => {
  it("sorts hours numerically, not lexically", () => {
    const input: TransactionsPerHour[] = [
      { hour: "13:00", transactionsCount: 3 },
      { hour: "9:00", transactionsCount: 7 },
    ];

    const result = mapTransactionsPerHour(input);

    expect(result).toEqual([
      { hour: "9 AM", value: 7 },
      { hour: "1 PM", value: 3 },
    ]);
  });

  it("formats midnight, noon, afternoon, and late-evening hours", () => {
    const result = mapTransactionsPerHour([
      { hour: "00:00", transactionsCount: 1 },
      { hour: "12:00", transactionsCount: 2 },
      { hour: "13:00", transactionsCount: 3 },
      { hour: "23:00", transactionsCount: 4 },
    ]);

    expect(result.map((r) => r.hour)).toEqual([
      "12 AM",
      "12 PM",
      "1 PM",
      "11 PM",
    ]);
  });

  it("returns an empty array when called without arguments", () => {
    expect(mapTransactionsPerHour()).toEqual([]);
  });
});

describe("mapDashboardTilesToStatCards", () => {
  it('filters out the "Today Sale" and "This Week" tiles', () => {
    const result = mapDashboardTilesToStatCards([
      tile({ title: "Today Sale" }),
      tile({ title: "This Week" }),
      tile({ title: "Sales This Month" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Sales This Month");
  });

  it("treats lossOrGain 0 as positive", () => {
    const [card] = mapDashboardTilesToStatCards([tile({ lossOrGain: 0 })]);
    expect(card.positive).toBe(true);
  });

  it("marks negative lossOrGain as not positive while change stays absolute", () => {
    const [card] = mapDashboardTilesToStatCards([tile({ lossOrGain: -12.5 })]);

    expect(card.positive).toBe(false);
    expect(card.change).toBe(
      formatWithSuffix(-12.5, "%", { maximumFractionDigits: 1 })
    );
    expect(card.change).toBe(
      formatWithSuffix(12.5, "%", { maximumFractionDigits: 1 })
    );
  });

  it("formats amount as USD currency", () => {
    const [card] = mapDashboardTilesToStatCards([tile({ amount: 1234.5 })]);
    expect(card.amount).toBe(formatCurrency(1234.5, { currency: "USD" }));
  });

  it("uses the title-mapped icon and falls back to the Sales This Month icon", () => {
    const [known, unknown] = mapDashboardTilesToStatCards([
      tile({ title: "Last Transaction" }),
      tile({ title: "Some Future Tile" }),
    ]);

    expect(known.image).toBe(DASHBOARD_ICON_MAP["Last Transaction"]);
    expect(unknown.image).toBe(DASHBOARD_ICON_MAP["Sales This Month"]);
  });

  it("returns an empty array when called without arguments", () => {
    expect(mapDashboardTilesToStatCards()).toEqual([]);
  });
});

describe("mapTransactionCountsToChart", () => {
  it("renames fields to month/Inbound/Outbound", () => {
    const input: TransactionCount[] = [
      { monthName: "Jan", inboundCount: 10, outboundCount: 4 },
      { monthName: "Feb", inboundCount: 8, outboundCount: 6 },
    ];

    expect(mapTransactionCountsToChart(input)).toEqual([
      { month: "Jan", Inbound: 10, Outbound: 4 },
      { month: "Feb", Inbound: 8, Outbound: 6 },
    ]);
  });

  it("returns an empty array for empty or missing input", () => {
    expect(mapTransactionCountsToChart([])).toEqual([]);
    expect(mapTransactionCountsToChart()).toEqual([]);
  });
});
