// src/services/corps/corpApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalClient } from "../axios";

import {
  apiToForm,
  getCorp,
  createCorpApi,
  updateCorpApi,
  toggleCorpStatusApi,
} from "./corpApi";

vi.mock("../axios", () => ({
  portalClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockCorp = {
  corporateId: 3,
  companyName: "test account",
  address1: "104 test lane",
  address2: "",
  city: "Daytona beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-5555",
  secondaryPhone: "(555) 555-5555",
  contactFirstName: "Test",
  contactLastName: "testing testing",
  email: "test@gmail.com",
  timeZone: "Central",
};

const mockForm = {
  corporateId: 3,
  companyName: "test account",
  address1: "104 test lane",
  address2: "",
  city: "Daytona beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-5555",
  secondaryPhone: "(555) 555-5555",
  contactFirstName: "Test",
  contactLastName: "testing testing",
  email: "test@gmail.com",
  timeZone: "Central",
};

describe("corpApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("apiToForm", () => {
    it("should map API data to form values", () => {
      expect(apiToForm(mockCorp)).toEqual({
        ...mockForm,
        primaryPhone: "(555) 555-5555",
        secondaryPhone: "(555) 555-5555",
      });
    });

    it("should return empty strings for missing values", () => {
      expect(apiToForm({})).toEqual({
        corporateId: undefined,
        companyName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        primaryPhone: "",
        secondaryPhone: "",
        contactFirstName: "",
        contactLastName: "",
        email: "",
        timeZone: "",
      });
    });

    it("should handle partial API data", () => {
      const result = apiToForm({
        companyName: "Demo Corp",
      });

      expect(result.companyName).toBe("Demo Corp");
      expect(result.city).toBe("");
      expect(result.email).toBe("");
    });

    it("normalizes phone display values from mixed API formats", () => {
      expect(
        apiToForm({
          primaryPhone: "1111111111",
          secondaryPhone: "222-222-2222",
        })
      ).toMatchObject({
        primaryPhone: "(111) 111-1111",
        secondaryPhone: "(222) 222-2222",
      });
    });
  });

  describe("getCorp", () => {
    it("should return corporate data", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: {
          success: true,
          data: mockCorp,
        },
      } as never);

      const result = await getCorp(3);

      expect(portalClient.get).toHaveBeenCalledWith(
        "/api/v1/GetCorporate/3"
      );

      expect(result).toEqual(mockCorp);
    });

    it("should throw when response data is missing", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: {
          success: true,
          data: null,
        },
      } as never);

      await expect(getCorp(3)).rejects.toThrow(
        "Invalid response from GetCorporate"
      );
    });

    it("should propagate API errors", async () => {
      vi.mocked(portalClient.get).mockRejectedValue(
        new Error("Network Error")
      );

      await expect(getCorp(3)).rejects.toThrow(
        "Network Error"
      );
    });
  });

  describe("createCorpApi", () => {
    it("should create a corporation", async () => {
      const response = {
        success: true,
        data: {},
      };

      vi.mocked(portalClient.post).mockResolvedValue({
        data: response,
      } as never);

      const result = await createCorpApi(mockForm);

      expect(portalClient.post).toHaveBeenCalledWith(
        "/api/v1/CreateCorporate",
        {
          companyName: mockForm.companyName,
          address1: mockForm.address1,
          address2: mockForm.address2,
          city: mockForm.city,
          state: mockForm.state,
          zipCode: mockForm.zipCode,
          primaryPhone: "5555555555",
          secondaryPhone: "5555555555",
          contactFirstName: mockForm.contactFirstName,
          contactLastName: mockForm.contactLastName,
          email: mockForm.email,
          timeZone: mockForm.timeZone,
        }
      );

      expect(result).toEqual(response);
    });

    it("should propagate create API errors", async () => {
      vi.mocked(portalClient.post).mockRejectedValue(
        new Error("Create Failed")
      );

      await expect(
        createCorpApi(mockForm)
      ).rejects.toThrow("Create Failed");
    });
  });

  describe("updateCorpApi", () => {
    it("should update corporation", async () => {
      const response = {
        success: true,
        data: {},
      };

      vi.mocked(portalClient.post).mockResolvedValue({
        data: response,
      } as never);

      const result = await updateCorpApi(mockForm);

      expect(portalClient.post).toHaveBeenCalledWith(
        "/api/v1/UpdateCorporate",
        {
          id: 3,
          companyName: mockForm.companyName,
          address1: mockForm.address1,
          address2: mockForm.address2,
          city: mockForm.city,
          state: mockForm.state,
          zipCode: mockForm.zipCode,
          primaryPhone: "5555555555",
          secondaryPhone: "5555555555",
          contactFirstName: mockForm.contactFirstName,
          contactLastName: mockForm.contactLastName,
          email: mockForm.email,
          timeZone: mockForm.timeZone,
        }
      );

      expect(result).toEqual(response);
    });

    it("should throw when corporateId is missing", async () => {
      await expect(
        updateCorpApi({
          ...mockForm,
          corporateId: undefined,
        })
      ).rejects.toThrow(
        "corporateId is required for update"
      );
    });

    it("should propagate update API errors", async () => {
      vi.mocked(portalClient.post).mockRejectedValue(
        new Error("Update Failed")
      );

      await expect(
        updateCorpApi(mockForm)
      ).rejects.toThrow("Update Failed");
    });
  });

  describe("toggleCorpStatusApi", () => {
    it("should update status successfully", async () => {
      const response = {
        success: true,
        data: {
          success: true,
          message: "Status updated successfully",
        },
      };

      vi.mocked(portalClient.patch).mockResolvedValue({
        data: response,
      } as never);

      const result = await toggleCorpStatusApi({
        corporateId: 3,
        status: false,
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateCorporateStatus",
        {
          corporateId: 3,
          Status: false,
        }
      );

      expect(result).toEqual(response);
    });

    it("should convert string corporateId to number", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: {
          success: true,
          data: {},
        },
      } as never);

      await toggleCorpStatusApi({
        corporateId: "3",
        status: true,
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateCorporateStatus",
        {
          corporateId: 3,
          Status: true,
        }
      );
    });

    it("should throw API message when success is false", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: {
          success: false,
          data: {
            message: "Status update failed",
          },
        },
      } as never);

      await expect(
        toggleCorpStatusApi({
          corporateId: 3,
          status: false,
        })
      ).rejects.toThrow("Status update failed");
    });

    it("should throw default error message", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: {
          success: false,
          data: {},
        },
      } as never);

      await expect(
        toggleCorpStatusApi({
          corporateId: 3,
          status: false,
        })
      ).rejects.toThrow(
        "Failed to update corporate status"
      );
    });

    it("should propagate patch API errors", async () => {
      vi.mocked(portalClient.patch).mockRejectedValue(
        new Error("Patch Failed")
      );

      await expect(
        toggleCorpStatusApi({
          corporateId: 3,
          status: false,
        })
      ).rejects.toThrow("Patch Failed");
    });
  });
});
