// src/services/profile/profileApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import portalClient from "../axios";
import { getUserInfo } from "./profileApi";

// profileApi imports the DEFAULT export from "../axios".
vi.mock("../axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockDetails = {
  userId: 7,
  userName: "test.user",
  name: "Test User",
  email: "test.user@example.com",
  role: "Admin",
  picture: "",
};

describe("profileApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserInfo", () => {
    it("returns data.details from GetUserInfo", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { name: "Test User", details: mockDetails },
      } as never);

      const result = await getUserInfo();

      expect(portalClient.get).toHaveBeenCalledWith("/api/v1/GetUserInfo");
      expect(result).toEqual(mockDetails);
    });

    it("throws when details are missing", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { name: "Test User" },
      } as never);

      await expect(getUserInfo()).rejects.toThrow(
        "Invalid response from GetUserInfo"
      );
    });

    it("propagates API errors", async () => {
      vi.mocked(portalClient.get).mockRejectedValue(new Error("Network Error"));

      await expect(getUserInfo()).rejects.toThrow("Network Error");
    });
  });
});
