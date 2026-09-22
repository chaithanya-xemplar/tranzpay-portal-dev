// src/services/merchants/merchantApi.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { MerchantFormValues, MerchantPaymentFeesValues } from "../../schemas/merchantsSchema";
import type { AxiosError, AxiosResponse } from "axios";
import { parseJsonString } from "../../utils/parseJsonString";
import { formatPhoneNumber, normalizePhoneNumber } from "../../utils/formatters";

/* ------------------------------------------------------------------ */
/* API response types                                                  */
/* ------------------------------------------------------------------ */

export interface MerchantApiResponse {
  success: boolean;
  count?: number;
  data?: MerchantApiData;
  request?: { id?: number };
}

export interface MerchantApiData {
  merchantId?: number;
  mainProducerId?: number;
  userStatus?: boolean;

  companyName?: string;
  integration?: string;
  tranzPayIdentifier?: string;

  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  timeZone?: string;

  contactFirst?: string;
  contactLast?: string;

  addProducerToTrack?: string;
  corporateId?: number | string;
}


export interface FeeConfiguration {
  feeType?: string;
  feeFormat?: string;
  feeValue?: number;
  batchCloseHours?: number;
  batchCloseMinutes?: number;
  batchCloseMeridiem?: "AM" | "PM";
}

export interface MerchantPaymentFeesApiData {
  merchantId?: number;
  corporateId?: number;
  achFeeConfiguration?: FeeConfiguration | null;
  ccFeeConfiguration?: FeeConfiguration | null;
}

export interface MerchantPaymentFeesApiResponseData {
  merchantId?: number;
  corporateId?: number;
  achFeeConfigurationId?: number | null;
  ccFeeConfigurationId?: number | null;
  achFeeConfiguration?: string | null;
  ccFeeConfiguration?: string | null;
}


/* ------------------------------------------------------------------ */
/* Generic API response (status toggle)                                */
/* ------------------------------------------------------------------ */

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
}

interface StatusUpdateData {
  success?: boolean;
  message?: string;
}

interface ApiErrorBody {
  data?: { message?: string };
}

type StatusUpdateResponse = ApiResponse<StatusUpdateData>;

/* ------------------------------------------------------------------ */
/* Mapping: API -> Form (NO IDs except update-needed ones)             */
/* ------------------------------------------------------------------ */

export const apiToForm = (
  api: MerchantApiData = {}
): MerchantFormValues => ({
  merchantId: api.merchantId,
  mainProducerId: api.mainProducerId,
  userStatus: api.userStatus ?? false,

  companyName: api.companyName ?? "",
  tranzpayIdentifier: api.tranzPayIdentifier ?? "",
  integration: api.integration ?? "",

  address1: api.address1 ?? "",
  address2: api.address2 ?? "",
  city: api.city ?? "",
  state: api.state ?? "",
  zipCode: api.zipCode ?? "",

  primaryPhone: formatPhoneNumber(api.primaryPhone ?? ""),
  secondaryPhone: formatPhoneNumber(api.secondaryPhone ?? ""),

  email: api.email ?? "",
  contactFirst: api.contactFirst ?? "",
  contactLast: api.contactLast ?? "",
  timeZone: api.timeZone ?? "",

  addProducerToTrack: api.addProducerToTrack ?? "",
});

/* ------------------------------------------------------------------ */
/* Payload builders                                                    */
/* ------------------------------------------------------------------ */

const buildBasePayload = (
  form: MerchantFormValues,
  corporateId: number
) => ({
  companyName: form.companyName,
  address1: form.address1,
  address2: form.address2 ?? "",
  city: form.city,
  state: form.state,
  zipCode: form.zipCode,
  integration: form.integration,
  tranzPayIdentifier: form.tranzpayIdentifier,
  primaryPhone: normalizePhoneNumber(form.primaryPhone),
  secondaryPhone: normalizePhoneNumber(form.secondaryPhone ?? ""),
  email: form.email,
  timeZone: form.timeZone,

  contactFirst: form.contactFirst,
  contactLast: form.contactLast,

  corporateId,
});

/* ------------------------------------------------------------------ */
/* Raw API calls                                                       */
/* ------------------------------------------------------------------ */

export const getMerchant = async (id: number): Promise<MerchantApiData> => {
  const { data }: AxiosResponse<MerchantApiResponse> =
    await portalClient.get(`/api/v1/GetMerchant/${id}`);

  if (!data?.data) {
    throw new Error("Invalid response from GetMerchant");
  }

  return data.data;
};

/* -------------------- CREATE -------------------- */

export const createMerchantApi = async (params: {
  form: MerchantFormValues;
  corporateId: number;
}) => {
  const payload = {
    ...buildBasePayload(params.form, params.corporateId),
    userStatus: true,
  };

  const res = await portalClient.post<MerchantApiResponse>(
    "/api/v1/CreateMerchant",
    payload
  );

  return res.data;
};

/* -------------------- UPDATE -------------------- */

export const updateMerchantApi = async (params: {
  form: MerchantFormValues;
  merchantId: number;
  mainProducerId: number;
  corporateId: number;
}) => {
  const payload = {
    ...buildBasePayload(params.form, params.corporateId),
    merchantId: Number(params.merchantId),
    mainProducerId: params.mainProducerId,
    userStatus: params.form.userStatus ?? false,
    addProducerToTrack: params.form.addProducerToTrack ?? "",
  };

  const res = await portalClient.patch<MerchantApiResponse>(
    "/api/v1/UpdateMerchant",
    payload
  );

  return res.data;
};

export const getMerchantPaymentFees = async (
  merchantId: number
): Promise<MerchantPaymentFeesApiData> => {

  const { data }: AxiosResponse<ApiResponse<MerchantPaymentFeesApiResponseData>> =
    await portalClient.get(`/api/v1/Merchant/${merchantId}/GetPaymentFees`);

  if (!data?.data) {
    throw new Error("Invalid response from GetPaymentFees");
  }

  const apiData = data.data;

  return {
    ...apiData,
    achFeeConfiguration: parseJsonString(apiData.achFeeConfiguration),
    ccFeeConfiguration: parseJsonString(apiData.ccFeeConfiguration),
  };
};

export const createMerchantPaymentFeesApi = async (
  payload: MerchantPaymentFeesApiData
) => {
  const res = await portalClient.post<ApiResponse<MerchantPaymentFeesApiResponseData>>(
    "/api/v1/Merchant/CreatePaymentFees",
    payload
  );

  return res.data;
};

export const updateMerchantPaymentFeesApi = async (
  payload: MerchantPaymentFeesApiData
) => {
  const res = await portalClient.put<ApiResponse<MerchantPaymentFeesApiResponseData>>(
    "/api/v1/Merchant/UpdatePaymentFees",
    payload
  );

  return res.data;
};

/* ------------------------------------------------------------------ */
/* Toggle merchant status                                              */
/* ------------------------------------------------------------------ */

export interface ToggleMerchantStatusPayload {
  mainProducerId: number | string;
  status: boolean;
  merchantId?: number;
  producerId?: number;
  mode?: "merchant-details" | "list" | "corp-details";
}

export const toggleMerchantStatusApi = async (
  payload: ToggleMerchantStatusPayload
) => {
  const producerId =
    payload.mode === "merchant-details"
      ? payload.producerId
      : payload.mainProducerId;

  if (!producerId) {
    throw new Error("Producer ID is required");
  }

  const body = {
    producerId: Number(producerId),
    status: payload.status,
  };

  const res = await portalClient.patch<StatusUpdateResponse>(
    "/api/v1/UpdateProducerStatus",
    body
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.data?.message || "Failed to update merchant status"
    );
  }

  return res.data;
};

/* ------------------------------------------------------------------ */
/* React Query hooks                                                   */
/* ------------------------------------------------------------------ */

export const useGetMerchant = (id?: number) =>
  useQuery({
    queryKey: ["merchant", id],
    enabled: Number.isFinite(id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: () => getMerchant(id as number).then(apiToForm),
  });

export const useCreateMerchant = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createMerchantApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchants-accounts"] });
    },
  });
};

export const useUpdateMerchant = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateMerchantApi,
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({
        queryKey: ["merchant", variables.merchantId],
      });

      qc.invalidateQueries({
        queryKey: ["merchants-accounts"],
      });
    },
  });
};

export const useToggleMerchantStatus = () => {
  const qc = useQueryClient();

  return useMutation<
    StatusUpdateResponse,
    AxiosError<ApiErrorBody>,
    ToggleMerchantStatusPayload
  >({
    mutationFn: toggleMerchantStatusApi,
    onSuccess: (_res, variables) => {
      if (variables.merchantId) {
        qc.invalidateQueries({
          queryKey: ["merchant", variables.merchantId],
        });
      }

      if(variables.mode === "merchant-details") {
        qc.invalidateQueries({
          queryKey: ["producers-accounts"],
          exact: false,
          refetchType: "active",
        });
      }

      qc.invalidateQueries({
        queryKey: ["merchants-accounts"],
        exact: false,
        refetchType: "active",
      });
    },
  });
};


//useGetMerchantPaymentFees

export const useGetMerchantPaymentFees = (merchantId?: number) =>
  useQuery({
    queryKey: ["merchant-payment-fees", merchantId],
    enabled: Number.isFinite(merchantId),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: () =>
      getMerchantPaymentFees(merchantId as number),
  });

// useCreateMerchantPaymentFees
export const useCreateMerchantPaymentFees = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createMerchantPaymentFeesApi,
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({
        queryKey: ["merchant-payment-fees", variables.merchantId],
      });
    },
  });
};

// useUpdateMerchantPaymentFees

export const useUpdateMerchantPaymentFees = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateMerchantPaymentFeesApi,
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({
        queryKey: ["merchant-payment-fees", variables.merchantId],
      });
    },
  });
};

export const paymentFeesApiToForm = (
  api?: MerchantPaymentFeesApiData
): Partial<MerchantPaymentFeesValues> => ({
  merchantId: api?.merchantId ?? 0,
  corporateId: api?.corporateId ?? 0,

  achFeeConfiguration: api?.achFeeConfiguration
    ? {
        feeType: api.achFeeConfiguration.feeType ?? "",
        feeFormat: api.achFeeConfiguration.feeFormat ?? "",
        feeValue: api.achFeeConfiguration.feeValue ?? undefined,
        batchCloseHours: api.achFeeConfiguration.batchCloseHours ?? undefined,
        batchCloseMinutes: api.achFeeConfiguration.batchCloseMinutes ?? undefined,
        batchCloseMeridiem:
          api.achFeeConfiguration.batchCloseMeridiem ?? "AM",
      }
    : undefined,

  ccFeeConfiguration: api?.ccFeeConfiguration
    ? {
        feeType: api.ccFeeConfiguration.feeType ?? "",
        feeFormat: api.ccFeeConfiguration.feeFormat ?? "",
        feeValue: api.ccFeeConfiguration.feeValue ?? undefined,
        batchCloseHours: api.ccFeeConfiguration.batchCloseHours ?? undefined,
        batchCloseMinutes: api.ccFeeConfiguration.batchCloseMinutes ?? undefined,
        batchCloseMeridiem:
          api.ccFeeConfiguration.batchCloseMeridiem ?? "AM",
      }
    : undefined,
});
