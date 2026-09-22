// src/services/corps/corpApi.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { CorpFormValues } from "../../schemas/corpsSchema";
import type { AxiosError, AxiosResponse } from "axios";
import { formatPhoneNumber, normalizePhoneNumber } from "../../utils/formatters";

/* ------------------------------------------------------------------ */
/* Generic API response                                                */
/* ------------------------------------------------------------------ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  count?: number;
  data?: T;
  request?: { id?: number } & Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* API data types                                                      */
/* ------------------------------------------------------------------ */

export interface CorpApiData {
  corporateId?: number;
  companyName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  timeZone?: string;
}

export type CorpApiResponse = ApiResponse<CorpApiData>;

/* ------------------------------------------------------------------ */
/* Mapping: API -> Form                                                */
/* ------------------------------------------------------------------ */

export const apiToForm = (
  api: CorpApiData = {}
): CorpFormValues & { corporateId?: number } => ({
  corporateId: api.corporateId,
  companyName: api.companyName ?? "",
  address1: api.address1 ?? "",
  address2: api.address2 ?? "",
  city: api.city ?? "",
  state: api.state ?? "",
  zipCode: api.zipCode ?? "",
  primaryPhone: formatPhoneNumber(api.primaryPhone ?? ""),
  secondaryPhone: formatPhoneNumber(api.secondaryPhone ?? ""),
  contactFirstName: api.contactFirstName ?? "",
  contactLastName: api.contactLastName ?? "",
  email: api.email ?? "",
  timeZone: api.timeZone ?? "",
});

/* ------------------------------------------------------------------ */
/* Payload builders (same pattern as Merchant)                         */
/* ------------------------------------------------------------------ */

const buildBasePayload = (form: CorpFormValues) => ({
  companyName: form.companyName,
  address1: form.address1,
  address2: form.address2 ?? "",
  city: form.city,
  state: form.state,
  zipCode: form.zipCode,
  primaryPhone: normalizePhoneNumber(form.primaryPhone),
  secondaryPhone: normalizePhoneNumber(form.secondaryPhone ?? ""),
  contactFirstName: form.contactFirstName,
  contactLastName: form.contactLastName,
  email: form.email,
  timeZone: form.timeZone,
});

const buildCreatePayload = (form: CorpFormValues) => ({
  ...buildBasePayload(form),
});

const buildUpdatePayload = (
  form: CorpFormValues & { corporateId?: number }
) => {
  if (!form.corporateId) {
    throw new Error("corporateId is required for update");
  }

  return {
    id: form.corporateId,
    ...buildBasePayload(form),
  };
};

/* ------------------------------------------------------------------ */
/* Raw API calls                                                       */
/* ------------------------------------------------------------------ */

export const getCorp = async (id: number): Promise<CorpApiData> => {
  const { data }: AxiosResponse<CorpApiResponse> = await portalClient.get(
    `/api/v1/GetCorporate/${id}`
  );

  if (!data?.data) {
    throw new Error("Invalid response from GetCorporate");
  }

  return data.data;
};

export const createCorpApi = async (form: CorpFormValues) => {
  const payload = buildCreatePayload(form);

  const res = await portalClient.post<CorpApiResponse>(
    "/api/v1/CreateCorporate",
    payload
  );

  return res.data;
};

export const updateCorpApi = async (
  form: CorpFormValues & { corporateId?: number }
) => {
  const payload = buildUpdatePayload(form);

  const res = await portalClient.post<CorpApiResponse>(
    "/api/v1/UpdateCorporate",
    payload
  );

  return res.data;
};

/* ------------------------------------------------------------------ */
/* React Query hooks                                                   */
/* ------------------------------------------------------------------ */

export const useGetCorp = (id?: number) =>
  useQuery({
    queryKey: ["corp", id],
    enabled: Number.isFinite(id as number),
    staleTime: 60_000,
    queryFn: async () => apiToForm(await getCorp(id as number)),
  });

export const useCreateCorp = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createCorpApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corps-accounts"] });
    },
  });
};

export const useUpdateCorp = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateCorpApi,
    onSuccess: (_res, variables) => {
      if (variables.corporateId) {
        qc.invalidateQueries({
          queryKey: ["corp", variables.corporateId],
        });
      }

      qc.invalidateQueries({
        queryKey: ["corps-accounts"],
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Toggle status (same as Merchant pattern)                             */
/* ------------------------------------------------------------------ */

export interface ToggleCorpStatusPayload {
  corporateId: number | string;
  status: boolean;
}

interface StatusUpdateData {
  success?: boolean;
  message?: string;
}

interface ApiErrorBody {
  data?: {
    message?: string;
  };
}

type StatusUpdateResponse = ApiResponse<StatusUpdateData>;

export const toggleCorpStatusApi = async (
  payload: ToggleCorpStatusPayload
) => {
  const body = {
    corporateId: Number(payload.corporateId),
    Status: payload.status,
  };

  const res = await portalClient.patch<StatusUpdateResponse>(
    "/api/v1/UpdateCorporateStatus",
    body
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.data?.message || "Failed to update corporate status"
    );
  }

  return res.data;
};

export const useToggleCorpStatus = () => {
  const qc = useQueryClient();

  return useMutation<
    StatusUpdateResponse,
    AxiosError<ApiErrorBody>,
    ToggleCorpStatusPayload
  >({
    mutationFn: toggleCorpStatusApi,
    onSuccess: (_res, variables) => {
      const corporateId = variables.corporateId;

      if (corporateId !== undefined) {
        qc.invalidateQueries({
          queryKey: ["corp", corporateId],
        });
      }

      qc.invalidateQueries({
        queryKey: ["corps-accounts"],
      });
    },
  });
};
