// src/services/blacklisted-accounts/blacklistedAccountsApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalClient } from "../axios";
import { updateBlacklistStatusApi } from "./blacklistedAccountsApi";

vi.mock("../axios", () => ({
  portalClient: {
    patch: vi.fn(),
  },
}));

// Numeric internal IDs only — never account or routing numbers.
const payload = {
  bankAccountBlacklistId: 42,
  producerId: 7,
  release: true,
};

describe("updateBlacklistStatusApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCHes a PascalCase body and returns the response data", async () => {
    const response = { success: true, data: { message: "Released" } };
    vi.mocked(portalClient.patch).mockResolvedValue({ data: response } as never);

    const result = await updateBlacklistStatusApi(payload);

    expect(portalClient.patch).toHaveBeenCalledWith(
      "/api/v1/UpdateBlacklistedBankAccount",
      {
        Release: true,
        ProducerId: 7,
        BankAccountBlacklistId: 42,
      }
    );
    expect(result).toEqual(response);
  });

  it("throws the API message when success is false", async () => {
    vi.mocked(portalClient.patch).mockResolvedValue({
      data: { success: false, data: { message: "Account already released" } },
    } as never);

    await expect(updateBlacklistStatusApi(payload)).rejects.toThrow(
      "Account already released"
    );
  });

  it("falls back to a default error message", async () => {
    vi.mocked(portalClient.patch).mockResolvedValue({
      data: { success: false },
    } as never);

    await expect(updateBlacklistStatusApi(payload)).rejects.toThrow(
      "Failed to update blacklist status"
    );
  });

  it("propagates API errors", async () => {
    vi.mocked(portalClient.patch).mockRejectedValue(new Error("Network Error"));

    await expect(updateBlacklistStatusApi(payload)).rejects.toThrow(
      "Network Error"
    );
  });
});
