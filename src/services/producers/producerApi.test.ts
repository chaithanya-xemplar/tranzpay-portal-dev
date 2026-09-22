// src/services/producers/producerApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { portalClient } from "../axios";
import type { ProducerFormValues } from "../../schemas/producersSchema";

import {
  apiToForm,
  getProducerApi,
  createProducerApi,
  updateProducerApi,
  toggleProducerStatusApi,
  type ProducerApiData,
} from "./producerApi";

vi.mock("../axios", () => ({
  portalClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockProducer: ProducerApiData = {
  producerId: 12,
  userStatus: false,
  corporateId: 3,
  companyName: "Demo Producer LLC",
  address1: "104 Test Lane",
  address2: "Suite 2",
  city: "Daytona Beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-0100",
  secondaryPhone: "(555) 555-0101",
  email: "producer@example.com",
  timeZone: "Central",
  contactFirst: "Pat",
  contactLast: "Lee",
  addProducerToTrack: "track-1",
  tranzPayIdentifier: "tpid-demo",
  mainProducerId: 4,
  merchantId: 9,
};

const mockForm: ProducerFormValues = {
  producerId: 12,
  mainProducerId: 4,
  merchantId: 9,
  corporateId: 3,
  userStatus: false,
  companyName: "Demo Producer LLC",
  address1: "104 Test Lane",
  address2: "Suite 2",
  city: "Daytona Beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-0100",
  secondaryPhone: "(555) 555-0101",
  email: "producer@example.com",
  timeZone: "Central",
  contactFirst: "Pat",
  contactLast: "Lee",
  addProducerToTrack: "track-1",
  tranzPayIdentifier: "tpid-demo",
};

const basePayload = {
  companyName: mockForm.companyName,
  address1: mockForm.address1,
  address2: mockForm.address2,
  city: mockForm.city,
  state: mockForm.state,
  zipCode: mockForm.zipCode,
  primaryPhone: "5555550100",
  secondaryPhone: "5555550101",
  email: mockForm.email,
  timeZone: mockForm.timeZone,
  contactFirst: mockForm.contactFirst,
  contactLast: mockForm.contactLast,
  tranzPayIdentifier: mockForm.tranzPayIdentifier,
  addProducerToTrack: mockForm.addProducerToTrack,
  userStatus: false,
  corporateId: 3,
  merchantId: 9,
  mainProducerId: 4,
};

describe("producerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("apiToForm", () => {
    it("maps full API data to form values", () => {
      expect(apiToForm(mockProducer)).toEqual({
        ...mockForm,
        primaryPhone: "(555) 555-0100",
        secondaryPhone: "(555) 555-0101",
      });
    });

    it("defaults userStatus to TRUE when missing", () => {
      expect(apiToForm({}).userStatus).toBe(true);
      expect(apiToForm().userStatus).toBe(true);
    });

    it("preserves an explicit false userStatus", () => {
      expect(apiToForm({ userStatus: false }).userStatus).toBe(false);
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

    it("returns empty strings and undefined ids for missing values", () => {
      expect(apiToForm({})).toEqual({
        producerId: undefined,
        mainProducerId: undefined,
        merchantId: undefined,
        corporateId: undefined,
        userStatus: true,
        companyName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        primaryPhone: "",
        secondaryPhone: "",
        email: "",
        timeZone: "",
        contactFirst: "",
        contactLast: "",
        addProducerToTrack: "",
        tranzPayIdentifier: "",
      });
    });
  });

  describe("getProducerApi", () => {
    it("returns producer data on success", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: mockProducer },
      } as never);

      const result = await getProducerApi(12);

      expect(portalClient.get).toHaveBeenCalledWith("/api/v1/GetProducer/12");
      expect(result).toEqual(mockProducer);
    });

    it("throws when success is false", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: false, data: mockProducer },
      } as never);

      await expect(getProducerApi(12)).rejects.toThrow(
        "Invalid response from GetProducer"
      );
    });

    it("throws when data is missing", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      await expect(getProducerApi(12)).rejects.toThrow(
        "Invalid response from GetProducer"
      );
    });
  });

  describe("createProducerApi", () => {
    it("POSTs the base payload including corporateId/merchantId/mainProducerId", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.post).mockResolvedValue({ data: response } as never);

      const result = await createProducerApi({
        form: mockForm,
        corporateId: 3,
        merchantId: 9,
        mainProducerId: 4,
      });

      expect(portalClient.post).toHaveBeenCalledWith(
        "/api/v1/CreateProducer",
        basePayload
      );
      expect(result).toEqual(response);
    });

    it("throws when success is false", async () => {
      vi.mocked(portalClient.post).mockResolvedValue({
        data: { success: false },
      } as never);

      await expect(
        createProducerApi({
          form: mockForm,
          corporateId: 3,
          merchantId: 9,
          mainProducerId: 4,
        })
      ).rejects.toThrow("Failed to create producer");
    });
  });

  describe("updateProducerApi", () => {
    it("PATCHes the base payload plus producerId", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.patch).mockResolvedValue({ data: response } as never);

      const result = await updateProducerApi({
        form: mockForm,
        producerId: 12,
        corporateId: 3,
        merchantId: 9,
        mainProducerId: 4,
      });

      expect(portalClient.patch).toHaveBeenCalledWith("/api/v1/UpdateProducer", {
        ...basePayload,
        producerId: 12,
      });
      expect(result).toEqual(response);
    });

    it("throws when success is false", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: false },
      } as never);

      await expect(
        updateProducerApi({
          form: mockForm,
          producerId: 12,
          corporateId: 3,
          merchantId: 9,
          mainProducerId: 4,
        })
      ).rejects.toThrow("Failed to update producer");
    });
  });

  describe("toggleProducerStatusApi", () => {
    it("PATCHes a PascalCase body with Number-coerced ProducerId", async () => {
      const response = {
        success: true,
        data: { success: true, message: "Status updated" },
      };
      vi.mocked(portalClient.patch).mockResolvedValue({ data: response } as never);

      const result = await toggleProducerStatusApi({
        producerId: "12",
        status: true,
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateProducerStatus",
        { ProducerId: 12, Status: true }
      );
      expect(result).toEqual(response);
    });

    it("throws the API message when success is false", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: false, data: { message: "Producer is locked" } },
      } as never);

      await expect(
        toggleProducerStatusApi({ producerId: 12, status: false })
      ).rejects.toThrow("Producer is locked");
    });

    it("falls back to a default error message", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: false, data: {} },
      } as never);

      await expect(
        toggleProducerStatusApi({ producerId: 12, status: false })
      ).rejects.toThrow("Failed to update producer status");
    });
  });
});
