// src/services/dashboard/dashboardApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalClient } from "../axios";
import { getDashboard, type DashboardApiData } from "./dashboardApi";

vi.mock("../axios", () => ({
  portalClient: {
    get: vi.fn(),
  },
}));

const mockData: DashboardApiData = {
  dashboardTiles: [
    { title: "Sales This Month", icon: "", amount: 100, lossOrGain: 2 },
  ],
  transactionCounts: [{ monthName: "Jan", inboundCount: 1, outboundCount: 2 }],
  transactionsPerHour: [{ hour: "09:00", transactionsCount: 5 }],
};

describe("getDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the unwrapped data.data payload", async () => {
    vi.mocked(portalClient.get).mockResolvedValue({
      data: { success: true, data: mockData },
    } as never);

    const result = await getDashboard();

    expect(portalClient.get).toHaveBeenCalledWith(
      "/api/v1/GetDashboardTransactions"
    );
    expect(result).toEqual(mockData);
  });

  it("throws when the data payload is missing", async () => {
    vi.mocked(portalClient.get).mockResolvedValue({
      data: { success: true, data: null },
    } as never);

    await expect(getDashboard()).rejects.toThrow("Invalid dashboard response");
  });

  it("throws when the envelope itself is missing", async () => {
    vi.mocked(portalClient.get).mockResolvedValue({ data: null } as never);

    await expect(getDashboard()).rejects.toThrow("Invalid dashboard response");
  });

  it("propagates API errors", async () => {
    vi.mocked(portalClient.get).mockRejectedValue(new Error("Network Error"));

    await expect(getDashboard()).rejects.toThrow("Network Error");
  });
});
