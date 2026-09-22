// src/services/merchants/merchantApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { portalClient } from "../axios";
import type { MerchantFormValues } from "../../schemas/merchantsSchema";
import { createWrapper } from "../../test/renderWithClient";

import {
  apiToForm,
  getMerchant,
  createMerchantApi,
  updateMerchantApi,
  getMerchantPaymentFees,
  createMerchantPaymentFeesApi,
  updateMerchantPaymentFeesApi,
  toggleMerchantStatusApi,
  paymentFeesApiToForm,
  useToggleMerchantStatus,
  type MerchantApiData,
  type MerchantPaymentFeesApiData,
} from "./merchantApi";

vi.mock("../axios", () => ({
  portalClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

/* ------------------------------------------------------------------ */
/* Fixtures (obviously fake placeholder data)                          */
/* ------------------------------------------------------------------ */

const mockApiMerchant: MerchantApiData = {
  merchantId: 12,
  mainProducerId: 34,
  userStatus: true,
  companyName: "Test Merchant LLC",
  integration: "API",
  tranzPayIdentifier: "TZP-TEST-001",
  address1: "104 Test Lane",
  address2: "Suite 4",
  city: "Daytona Beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-0100",
  secondaryPhone: "(555) 555-0101",
  email: "merchant@example.com",
  timeZone: "Eastern",
  contactFirst: "Test",
  contactLast: "User",
  addProducerToTrack: "56",
  corporateId: 9,
};

const mockForm: MerchantFormValues = {
  companyName: "Test Merchant LLC",
  tranzpayIdentifier: "TZP-TEST-001",
  integration: "API",
  address1: "104 Test Lane",
  address2: "Suite 4",
  city: "Daytona Beach",
  state: "FL",
  zipCode: "32117",
  primaryPhone: "(555) 555-0100",
  secondaryPhone: "(555) 555-0101",
  email: "merchant@example.com",
  contactFirst: "Test",
  contactLast: "User",
  timeZone: "Eastern",
  addProducerToTrack: "56",
  merchantId: 12,
  mainProducerId: 34,
  userStatus: true,
};

const expectedBasePayload = {
  companyName: "Test Merchant LLC",
  address1: "104 Test Lane",
  address2: "Suite 4",
  city: "Daytona Beach",
  state: "FL",
  zipCode: "32117",
  integration: "API",
  tranzPayIdentifier: "TZP-TEST-001",
  primaryPhone: "5555550100",
  secondaryPhone: "5555550101",
  email: "merchant@example.com",
  timeZone: "Eastern",
  contactFirst: "Test",
  contactLast: "User",
  corporateId: 9,
};

describe("merchantApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ---------------------------- apiToForm ---------------------------- */

  describe("apiToForm", () => {
    it("maps API data to form values, renaming tranzPayIdentifier to tranzpayIdentifier", () => {
      expect(apiToForm(mockApiMerchant)).toEqual({
        merchantId: 12,
        mainProducerId: 34,
        userStatus: true,
        companyName: "Test Merchant LLC",
        tranzpayIdentifier: "TZP-TEST-001",
        integration: "API",
        address1: "104 Test Lane",
        address2: "Suite 4",
        city: "Daytona Beach",
        state: "FL",
        zipCode: "32117",
        primaryPhone: "(555) 555-0100",
        secondaryPhone: "(555) 555-0101",
        email: "merchant@example.com",
        contactFirst: "Test",
        contactLast: "User",
        timeZone: "Eastern",
        addProducerToTrack: "56",
      });
    });

    it("defaults missing values: userStatus false, empty strings, undefined ids", () => {
      expect(apiToForm({})).toEqual({
        merchantId: undefined,
        mainProducerId: undefined,
        userStatus: false,
        companyName: "",
        tranzpayIdentifier: "",
        integration: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        primaryPhone: "",
        secondaryPhone: "",
        email: "",
        contactFirst: "",
        contactLast: "",
        timeZone: "",
        addProducerToTrack: "",
      });
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

  /* ---------------------------- getMerchant ---------------------------- */

  describe("getMerchant", () => {
    it("unwraps data.data from GetMerchant", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: mockApiMerchant },
      } as never);

      const result = await getMerchant(12);

      expect(portalClient.get).toHaveBeenCalledWith("/api/v1/GetMerchant/12");
      expect(result).toEqual(mockApiMerchant);
    });

    it("throws when response data is missing", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      await expect(getMerchant(12)).rejects.toThrow(
        "Invalid response from GetMerchant"
      );
    });
  });

  /* ---------------------------- create ---------------------------- */

  describe("createMerchantApi", () => {
    it("POSTs the base payload with corporateId and userStatus true", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.post).mockResolvedValue({ data: response } as never);

      const result = await createMerchantApi({ form: mockForm, corporateId: 9 });

      expect(portalClient.post).toHaveBeenCalledWith("/api/v1/CreateMerchant", {
        ...expectedBasePayload,
        userStatus: true,
      });
      expect(result).toEqual(response);
    });

    it("defaults optional address2/secondaryPhone to empty strings", async () => {
      vi.mocked(portalClient.post).mockResolvedValue({
        data: { success: true },
      } as never);

      await createMerchantApi({
        form: { ...mockForm, address2: undefined, secondaryPhone: undefined },
        corporateId: 9,
      });

      expect(portalClient.post).toHaveBeenCalledWith("/api/v1/CreateMerchant", {
        ...expectedBasePayload,
        address2: "",
        secondaryPhone: "",
        userStatus: true,
      });
    });
  });

  /* ---------------------------- update ---------------------------- */

  describe("updateMerchantApi", () => {
    it("PATCHes with a Number-coerced merchantId and mainProducerId", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.patch).mockResolvedValue({ data: response } as never);

      const result = await updateMerchantApi({
        form: mockForm,
        merchantId: "12" as unknown as number,
        mainProducerId: 34,
        corporateId: 9,
      });

      expect(portalClient.patch).toHaveBeenCalledWith("/api/v1/UpdateMerchant", {
        ...expectedBasePayload,
        merchantId: 12,
        mainProducerId: 34,
        userStatus: true,
        addProducerToTrack: "56",
      });
      expect(result).toEqual(response);
    });

    it("falls back to userStatus false and empty addProducerToTrack", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: true },
      } as never);

      await updateMerchantApi({
        form: { ...mockForm, userStatus: undefined, addProducerToTrack: undefined },
        merchantId: 12,
        mainProducerId: 34,
        corporateId: 9,
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateMerchant",
        expect.objectContaining({
          userStatus: false,
          addProducerToTrack: "",
        })
      );
    });
  });

  /* ---------------------------- payment fees: get ---------------------------- */

  describe("getMerchantPaymentFees", () => {
    it("parses JSON-string fee configs (PascalCase keys, string numerics) into camelCase numeric objects", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            merchantId: 12,
            corporateId: 9,
            achFeeConfigurationId: 1,
            ccFeeConfigurationId: 2,
            achFeeConfiguration:
              '{"FeeType":"Flat","FeeFormat":"Fixed","FeeValue":"2.5","BatchCloseHours":"10","BatchCloseMinutes":"30","BatchCloseMeridiem":"PM"}',
            ccFeeConfiguration:
              '{"FeeType":"Percentage","FeeFormat":"Rate","FeeValue":"1.75","BatchCloseHours":"9","BatchCloseMinutes":"15","BatchCloseMeridiem":"AM"}',
          },
        },
      } as never);

      const result = await getMerchantPaymentFees(12);

      expect(portalClient.get).toHaveBeenCalledWith(
        "/api/v1/Merchant/12/GetPaymentFees"
      );
      expect(result.achFeeConfiguration).toEqual({
        feeType: "Flat",
        feeFormat: "Fixed",
        feeValue: 2.5,
        batchCloseHours: 10,
        batchCloseMinutes: 30,
        batchCloseMeridiem: "PM",
      });
      expect(result.ccFeeConfiguration).toEqual({
        feeType: "Percentage",
        feeFormat: "Rate",
        feeValue: 1.75,
        batchCloseHours: 9,
        batchCloseMinutes: 15,
        batchCloseMeridiem: "AM",
      });
      expect(result.merchantId).toBe(12);
      expect(result.corporateId).toBe(9);
    });

    it("maps null fee configurations to null", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: {
          success: true,
          data: {
            merchantId: 12,
            corporateId: 9,
            achFeeConfiguration: null,
            ccFeeConfiguration: null,
          },
        },
      } as never);

      const result = await getMerchantPaymentFees(12);

      expect(result.achFeeConfiguration).toBeNull();
      expect(result.ccFeeConfiguration).toBeNull();
    });

    it("throws when response data is missing", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      await expect(getMerchantPaymentFees(12)).rejects.toThrow(
        "Invalid response from GetPaymentFees"
      );
    });
  });

  /* ---------------------------- payment fees: create / update ---------------------------- */

  const feesPayload: MerchantPaymentFeesApiData = {
    merchantId: 12,
    corporateId: 9,
    achFeeConfiguration: {
      feeType: "Flat",
      feeFormat: "Fixed",
      feeValue: 2.5,
      batchCloseHours: 10,
      batchCloseMinutes: 30,
      batchCloseMeridiem: "PM",
    },
    ccFeeConfiguration: null,
  };

  describe("createMerchantPaymentFeesApi", () => {
    it("POSTs the payload to CreatePaymentFees", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.post).mockResolvedValue({ data: response } as never);

      const result = await createMerchantPaymentFeesApi(feesPayload);

      expect(portalClient.post).toHaveBeenCalledWith(
        "/api/v1/Merchant/CreatePaymentFees",
        feesPayload
      );
      expect(result).toEqual(response);
    });
  });

  describe("updateMerchantPaymentFeesApi", () => {
    it("PUTs the payload to UpdatePaymentFees", async () => {
      const response = { success: true, data: {} };
      vi.mocked(portalClient.put).mockResolvedValue({ data: response } as never);

      const result = await updateMerchantPaymentFeesApi(feesPayload);

      expect(portalClient.put).toHaveBeenCalledWith(
        "/api/v1/Merchant/UpdatePaymentFees",
        feesPayload
      );
      expect(result).toEqual(response);
    });
  });

  /* ---------------------------- toggle status ---------------------------- */

  describe("toggleMerchantStatusApi", () => {
    const successResponse = {
      success: true,
      data: { success: true, message: "Status updated" },
    };

    it("uses producerId in merchant-details mode", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: successResponse,
      } as never);

      const result = await toggleMerchantStatusApi({
        mainProducerId: 34,
        producerId: 56,
        merchantId: 12,
        status: false,
        mode: "merchant-details",
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateProducerStatus",
        { producerId: 56, status: false }
      );
      expect(result).toEqual(successResponse);
    });

    it("uses mainProducerId (Number-coerced) outside merchant-details mode", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: successResponse,
      } as never);

      await toggleMerchantStatusApi({
        mainProducerId: "34",
        status: true,
        mode: "list",
      });

      expect(portalClient.patch).toHaveBeenCalledWith(
        "/api/v1/UpdateProducerStatus",
        { producerId: 34, status: true }
      );
    });

    it("throws when the producer id is missing", async () => {
      await expect(
        toggleMerchantStatusApi({
          mainProducerId: 34,
          status: true,
          mode: "merchant-details", // producerId not provided
        })
      ).rejects.toThrow("Producer ID is required");

      expect(portalClient.patch).not.toHaveBeenCalled();
    });

    it("throws the API message when success is false", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: {
          success: false,
          data: { message: "Status update failed" },
        },
      } as never);

      await expect(
        toggleMerchantStatusApi({ mainProducerId: 34, status: false })
      ).rejects.toThrow("Status update failed");
    });

    it("throws the fallback message when success is false without a message", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: false, data: {} },
      } as never);

      await expect(
        toggleMerchantStatusApi({ mainProducerId: 34, status: false })
      ).rejects.toThrow("Failed to update merchant status");
    });
  });

  /* ---------------------------- paymentFeesApiToForm ---------------------------- */

  describe("paymentFeesApiToForm", () => {
    it("returns zeroed ids and undefined configs when API data is undefined", () => {
      expect(paymentFeesApiToForm(undefined)).toEqual({
        merchantId: 0,
        corporateId: 0,
        achFeeConfiguration: undefined,
        ccFeeConfiguration: undefined,
      });
    });

    it("fills config fallbacks including batchCloseMeridiem default AM", () => {
      const result = paymentFeesApiToForm({
        merchantId: 12,
        corporateId: 9,
        achFeeConfiguration: { feeType: "Flat" },
        ccFeeConfiguration: null,
      });

      expect(result).toEqual({
        merchantId: 12,
        corporateId: 9,
        achFeeConfiguration: {
          feeType: "Flat",
          feeFormat: "",
          feeValue: undefined,
          batchCloseHours: undefined,
          batchCloseMinutes: undefined,
          batchCloseMeridiem: "AM",
        },
        ccFeeConfiguration: undefined,
      });
    });
  });

  /* ---------------------------- useToggleMerchantStatus ---------------------------- */

  describe("useToggleMerchantStatus", () => {
    it("invalidates merchant, producers-accounts and merchants-accounts in merchant-details mode", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: true, data: { success: true } },
      } as never);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useToggleMerchantStatus(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          mainProducerId: 34,
          producerId: 56,
          merchantId: 12,
          status: false,
          mode: "merchant-details",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(3);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["merchant", 12] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["producers-accounts"],
        exact: false,
        refetchType: "active",
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["merchants-accounts"],
        exact: false,
        refetchType: "active",
      });
    });

    it("only invalidates merchants-accounts without merchantId or merchant-details mode", async () => {
      vi.mocked(portalClient.patch).mockResolvedValue({
        data: { success: true, data: { success: true } },
      } as never);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useToggleMerchantStatus(), {
        wrapper: Wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          mainProducerId: 34,
          status: true,
          mode: "list",
        });
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["merchants-accounts"],
        exact: false,
        refetchType: "active",
      });
    });
  });
});
