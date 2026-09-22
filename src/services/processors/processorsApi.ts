import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { GlobalProcessorConfigFormType } from "../../schemas/globalProcessorSchema";

/* ============================================================
 ✅ TYPES
============================================================ */

export interface ProcessorCompany {
  id: number;
  processor: string;
  abbreviation: string;
  ach: boolean;
  cc: boolean;
  baseUrl: string;

  /* ✅ FirstData Only */
  groupId?: string;
  tppIds?: string[];
}

/* ✅ API Wrapper Response */
interface ProcessorDetailResponse {
  success: boolean;
  data: ProcessorCompany;
}

/* ============================================================
 ✅ ADDITIONAL URL TYPES
============================================================ */

export interface ProcessorUrl {
  id: number;
  urlType: string;
  url: string;
  status: boolean;
}

/* ✅ Wrapper Response */
interface ProcessorUrlsResponse {
  success: boolean;
  data: ProcessorUrl[];
}

/* ============================================================
 ✅ GET PROCESSOR DETAILS
============================================================ */

export const useProcessorDetails = (id: number) => {
  return useQuery({
    queryKey: ["processor-details", id],
    queryFn: async () => {
      const res = await portalClient.get<ProcessorDetailResponse>(
        `/api/v1/GetPaymentProcessorCompany/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

/* ============================================================
 ✅ CREATE PROCESSOR
============================================================ */

export const useCreateProcessor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: GlobalProcessorConfigFormType) => {
      return portalClient.post(
        `/api/v1/CreatePaymentProcessorCompany`,
        mapCreateProcessorFormToApiPayload(values)
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processors"] });
    },
  });
};


/* ============================================================
 ✅ UPDATE PROCESSOR
============================================================ */

export const useUpdateProcessor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      processor: ProcessorCompany;
      values: GlobalProcessorConfigFormType;
    }) => {
      return portalClient.post(
        `/api/v1/UpdatePaymentProcessorCompany`,
        mapProcessorFormToApiPayload(payload.processor, payload.values)
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processors"] });
      queryClient.invalidateQueries({ queryKey: ["processor-details"] });
    },
  });
};

/* ============================================================
 ✅ GET PROCESSOR URLS
============================================================ */

export const useProcessorUrls = (processorId: number) => {
  return useQuery({
    queryKey: ["processor-urls", processorId],

    queryFn: async () => {
      const res = await portalClient.post<ProcessorUrlsResponse>(
        `/api/v1/PaymentProcessor/${processorId}/GetUrls`,
        {
          pageSize: 50,
          currentPage: 1,
        }
      );

      return res.data.data ?? [];
    },

    enabled: !!processorId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

/* ============================================================
 ✅ CREATE URL
============================================================ */

export const useCreateProcessorUrl = (processorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { urlType: string; url: string }) => {
      return portalClient.post(`/api/v1/CreatePaymentProcessorURL`, {
        paymentProcessorCompanyId: processorId,
        urlType: payload.urlType,
        url: payload.url,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["processor-urls", processorId],
      });
    },
  });
};

/* ============================================================
 ✅ UPDATE URL
============================================================ */

export const useUpdateProcessorUrl = (processorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProcessorUrl) => {
      return portalClient.post(`/api/v1/UpdatePaymentProcessorURL`, {
        id: payload.id,
        urlType: payload.urlType,
        url: payload.url,
        status: payload.status,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["processor-urls", processorId],
      });
    },
  });
};

/* ============================================================
 ✅ DELETE URL (Soft Delete → status=false)
============================================================ */

export const useDeleteProcessorUrl = (processorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: ProcessorUrl) => {
      return portalClient.post(`/api/v1/UpdatePaymentProcessorURL`, {
        id: url.id,
        urlType: url.urlType,
        url: url.url,
        status: false,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["processor-urls", processorId],
      });
    },
  });
};

/* ============================================================
 ✅ MAPPING HELPERS
============================================================ */

export function mapProcessorApiToFormValues(
  processor: ProcessorCompany
): Partial<GlobalProcessorConfigFormType> {
  return {
    processorName: processor.processor,
    identifier: processor.abbreviation,

    paymentTypes: [
      processor.ach ? "ACH" : null,
      processor.cc ? "CC" : null,
    ].filter(Boolean) as ("ACH" | "CC")[],

    baseUrl: processor.baseUrl,
    groupId: processor.groupId ?? "",
    tppIds: processor.tppIds ?? [],
  };
}

export function mapProcessorFormToApiPayload(
  processor: ProcessorCompany,
  form: GlobalProcessorConfigFormType
) {
  const isFirstData = processor.processor === "First Data";

  return {
    id: processor.id,
    processor: processor.processor,
    abbreviation: form.identifier,

    ach: form.paymentTypes.includes("ACH"),
    cc: form.paymentTypes.includes("CC"),

    baseUrl: form.baseUrl,

    groupId: isFirstData ? form.groupId ?? "" : "",
    tppIds: isFirstData
      ? (form.tppIds || []).filter((id) => id.trim() !== "")
      : [],
  };
}

export function mapCreateProcessorFormToApiPayload(
  form: GlobalProcessorConfigFormType
) {
  return {
    processor: form.processorName,
    abbreviation: form.identifier,

    achPayments: form.paymentTypes.includes("ACH"),
    ccPayments: form.paymentTypes.includes("CC"),

    baseUrl: form.baseUrl,

    // Backend requires these
    groupId: "",
    tppIds: [],
  };
}


