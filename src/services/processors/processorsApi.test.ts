// src/services/processors/processorsApi.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { portalClient } from "../axios";
import { createWrapper } from "../../test/renderWithClient";
import type { GlobalProcessorConfigFormType } from "../../schemas/globalProcessorSchema";

import {
  mapProcessorApiToFormValues,
  mapProcessorFormToApiPayload,
  mapCreateProcessorFormToApiPayload,
  useProcessorDetails,
  useProcessorUrls,
  type ProcessorCompany,
  type ProcessorUrl,
} from "./processorsApi";

vi.mock("../axios", () => ({
  portalClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const firstDataProcessor: ProcessorCompany = {
  id: 7,
  processor: "First Data",
  abbreviation: "FD",
  ach: true,
  cc: true,
  baseUrl: "https://api.example.com",
  groupId: "group-100",
  tppIds: ["tpp-1", "tpp-2"],
};

const baseForm: GlobalProcessorConfigFormType = {
  processorName: "First Data",
  identifier: "FD",
  paymentTypes: ["ACH", "CC"],
  baseUrl: "https://api.example.com",
  groupId: "group-100",
  tppIds: ["tpp-1", "tpp-2"],
};

describe("processorsApi mappers", () => {
  describe("mapProcessorApiToFormValues", () => {
    it("maps a full processor to form values", () => {
      expect(mapProcessorApiToFormValues(firstDataProcessor)).toEqual({
        processorName: "First Data",
        identifier: "FD",
        paymentTypes: ["ACH", "CC"],
        baseUrl: "https://api.example.com",
        groupId: "group-100",
        tppIds: ["tpp-1", "tpp-2"],
      });
    });

    it("derives paymentTypes from ach/cc flags", () => {
      expect(
        mapProcessorApiToFormValues({ ...firstDataProcessor, ach: true, cc: false })
          .paymentTypes
      ).toEqual(["ACH"]);

      expect(
        mapProcessorApiToFormValues({ ...firstDataProcessor, ach: false, cc: true })
          .paymentTypes
      ).toEqual(["CC"]);

      expect(
        mapProcessorApiToFormValues({ ...firstDataProcessor, ach: false, cc: false })
          .paymentTypes
      ).toEqual([]);
    });

    it("defaults groupId to empty string and tppIds to empty array", () => {
      const result = mapProcessorApiToFormValues({
        ...firstDataProcessor,
        groupId: undefined,
        tppIds: undefined,
      });

      expect(result.groupId).toBe("");
      expect(result.tppIds).toEqual([]);
    });
  });

  describe("mapProcessorFormToApiPayload", () => {
    it("keeps groupId and trims blank tppIds for First Data", () => {
      const result = mapProcessorFormToApiPayload(firstDataProcessor, {
        ...baseForm,
        tppIds: ["tpp-1", "", "   ", "tpp-2"],
      });

      expect(result).toEqual({
        id: 7,
        processor: "First Data",
        abbreviation: "FD",
        ach: true,
        cc: true,
        baseUrl: "https://api.example.com",
        groupId: "group-100",
        tppIds: ["tpp-1", "tpp-2"],
      });
    });

    it("defaults an undefined groupId to empty string for First Data", () => {
      const result = mapProcessorFormToApiPayload(firstDataProcessor, {
        ...baseForm,
        groupId: undefined,
        tppIds: undefined,
      });

      expect(result.groupId).toBe("");
      expect(result.tppIds).toEqual([]);
    });

    it("forces empty groupId/tppIds for non-First-Data processors", () => {
      const tsys: ProcessorCompany = {
        ...firstDataProcessor,
        id: 8,
        processor: "TSYS",
        abbreviation: "TS",
      };

      const result = mapProcessorFormToApiPayload(tsys, baseForm);

      expect(result.groupId).toBe("");
      expect(result.tppIds).toEqual([]);
    });

    it("maps paymentTypes back to ach/cc booleans", () => {
      const result = mapProcessorFormToApiPayload(firstDataProcessor, {
        ...baseForm,
        paymentTypes: ["CC"],
      });

      expect(result.ach).toBe(false);
      expect(result.cc).toBe(true);
    });
  });

  describe("mapCreateProcessorFormToApiPayload", () => {
    it("uses achPayments/ccPayments keys and always empties groupId/tppIds", () => {
      expect(
        mapCreateProcessorFormToApiPayload({
          ...baseForm,
          paymentTypes: ["ACH"],
        })
      ).toEqual({
        processor: "First Data",
        abbreviation: "FD",
        achPayments: true,
        ccPayments: false,
        baseUrl: "https://api.example.com",
        groupId: "",
        tppIds: [],
      });
    });
  });
});

describe("processorsApi hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useProcessorDetails", () => {
    it("unwraps res.data.data from GetPaymentProcessorCompany", async () => {
      vi.mocked(portalClient.get).mockResolvedValue({
        data: { success: true, data: firstDataProcessor },
      } as never);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useProcessorDetails(7), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(portalClient.get).toHaveBeenCalledWith(
        "/api/v1/GetPaymentProcessorCompany/7"
      );
      expect(result.current.data).toEqual(firstDataProcessor);
    });
  });

  describe("useProcessorUrls", () => {
    it("POSTs GetUrls with fixed paging and returns the url list", async () => {
      const urls: ProcessorUrl[] = [
        { id: 1, urlType: "Auth", url: "https://api.example.com/auth", status: true },
      ];

      vi.mocked(portalClient.post).mockResolvedValue({
        data: { success: true, data: urls },
      } as never);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useProcessorUrls(9), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(portalClient.post).toHaveBeenCalledWith(
        "/api/v1/PaymentProcessor/9/GetUrls",
        { pageSize: 50, currentPage: 1 }
      );
      expect(result.current.data).toEqual(urls);
    });

    it("falls back to an empty array when data is missing", async () => {
      vi.mocked(portalClient.post).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useProcessorUrls(9), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });
});
