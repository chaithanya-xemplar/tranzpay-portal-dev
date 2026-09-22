import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { ProducerFormValues } from "../../schemas/producersSchema";
import type { AxiosError, AxiosResponse } from "axios";
import { formatPhoneNumber, normalizePhoneNumber } from "../../utils/formatters";

/* ------------------------------------------------------------------ */
/* API response types                                                   */
/* ------------------------------------------------------------------ */

interface ApiResponse<T = unknown> {
  success: boolean;
  count?: number;
  data?: T;
  request?: { id?: number } & Record<string, unknown>;
}

export interface ProducerApiData {
  producerId?: number;
  userStatus?: boolean;
  corporateId?: number;
  companyName?: string;
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
  tranzPayIdentifier?: string;
  mainProducerId?: number;
  merchantId?: number;
}

/* ------------------------------------------------------------------ */
/* API → Form mapper                                                    */
/* ------------------------------------------------------------------ */

export const apiToForm = (
  api: ProducerApiData = {}
): ProducerFormValues => ({
  producerId: api.producerId,
  mainProducerId: api.mainProducerId,
  merchantId: api.merchantId,
  userStatus: api.userStatus ?? true,
  corporateId: api.corporateId,
  companyName: api.companyName ?? "",
  address1: api.address1 ?? "",
  address2: api.address2 ?? "",
  city: api.city ?? "",
  state: api.state ?? "",
  zipCode: api.zipCode ?? "",

  primaryPhone: formatPhoneNumber(api.primaryPhone ?? ""),
  secondaryPhone: formatPhoneNumber(api.secondaryPhone ?? ""),
  email: api.email ?? "",
  timeZone: api.timeZone ?? "",
  contactFirst: api.contactFirst ?? "",
  contactLast: api.contactLast ?? "",
  addProducerToTrack: api.addProducerToTrack ?? "",
  tranzPayIdentifier: api.tranzPayIdentifier ?? "",

});

/* ------------------------------------------------------------------ */
/* Payload builders                                                     */
/* ------------------------------------------------------------------ */

const buildBasePayload = (
  form: ProducerFormValues,
  corporateId: number,
  merchantId: number,
  mainProducerId: number
) => ({
  companyName: form.companyName,
  address1: form.address1,
  address2: form.address2 ?? "",
  city: form.city,
  state: form.state,
  zipCode: form.zipCode,

  primaryPhone: normalizePhoneNumber(form.primaryPhone),
  secondaryPhone: normalizePhoneNumber(form.secondaryPhone ?? ""),
  email: form.email,
  timeZone: form.timeZone,
  contactFirst: form.contactFirst,
  contactLast: form.contactLast,
  tranzPayIdentifier: form.tranzPayIdentifier ?? "",
  addProducerToTrack: form.addProducerToTrack ?? "",
  userStatus: form.userStatus ?? true,

  corporateId,
  merchantId,
  mainProducerId,
});

/* ------------------------------------------------------------------ */
/* Raw API calls                                                        */
/* ------------------------------------------------------------------ */

export const getProducerApi = async (
  id: number
): Promise<ProducerApiData> => {
  const { data }: AxiosResponse<ApiResponse<ProducerApiData>> =
    await portalClient.get(`/api/v1/GetProducer/${id}`);

  if (!data?.success || !data.data) {
    throw new Error("Invalid response from GetProducer");
  }

  return data.data;
};

/* -------------------- CREATE -------------------- */

export const createProducerApi = async (params: {
  form: ProducerFormValues;
  corporateId: number;
  merchantId: number;
  mainProducerId: number;
}) => {
  const payload = buildBasePayload(
    params.form,
    params.corporateId,
    params.merchantId,
    params.mainProducerId
  );
  const res = await portalClient.post<ApiResponse>(
    "/api/v1/CreateProducer",
    payload
  );
  if (!res.data?.success) {
    throw new Error("Failed to create producer");
  }
  return res.data;
};


/* -------------------- UPDATE -------------------- */

export const updateProducerApi = async (params: {
  form: ProducerFormValues;
  producerId: number;
  corporateId: number;
  merchantId: number;
  mainProducerId: number;
}) => {
  const payload = {
    ...buildBasePayload(
      params.form,
      params.corporateId,
      params.merchantId,
      params.mainProducerId
    ),
    producerId: params.producerId,
  };

  const res = await portalClient.patch<ApiResponse>(
    "/api/v1/UpdateProducer",
    payload
  );

  if (!res.data?.success) {
    throw new Error("Failed to update producer");
  }

  return res.data;
};

/* ------------------------------------------------------------------ */
/* React Query hooks                                                    */
/* ------------------------------------------------------------------ */

export const useGetProducer = (id?: number) =>
  useQuery({
    queryKey: ["producer", id],
    enabled: Number.isFinite(id),
    staleTime: 60_000,
    queryFn: async () => apiToForm(await getProducerApi(id as number)),
  });

export const useCreateProducer = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createProducerApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["producers-accounts"] });
    },
  });
};

export const useUpdateProducer = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateProducerApi,
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({
        queryKey: ["producer", variables.producerId],
      });

      qc.invalidateQueries({
        queryKey: ["producers-accounts"],
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Toggle Producer Status                                               */
/* ------------------------------------------------------------------ */

export interface ToggleProducerStatusPayload {
  producerId: number | string;
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

export const toggleProducerStatusApi = async (
  payload: ToggleProducerStatusPayload
) => {
  const body = {
    ProducerId: Number(payload.producerId),
    Status: payload.status,
  };

  const res = await portalClient.patch<StatusUpdateResponse>(
    "/api/v1/UpdateProducerStatus",
    body
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.data?.message || "Failed to update producer status"
    );
  }

  return res.data;
};

export const useToggleProducerStatus = () => {
  const qc = useQueryClient();

  return useMutation<
    StatusUpdateResponse,
    AxiosError<ApiErrorBody>,
    ToggleProducerStatusPayload
  >({
    mutationFn: toggleProducerStatusApi,
    onSuccess: (_res, variables) => {
      if (variables.producerId) {
        qc.invalidateQueries({
          queryKey: ["producer", variables.producerId],
        });
      }

      qc.invalidateQueries({
        queryKey: ["producers-accounts"],
      });
    },
  });
};
