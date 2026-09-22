import api from "../../../services/axios";
import type { ProcessorPayload } from "./types";
import { useQuery, useMutation } from "@tanstack/react-query";

/* --------------------------------------------- */
/* GET Processor Configuration */
/* --------------------------------------------- */

export const getMerchantProcessor = async (
  merchantId: number,
  paymentProcessorCompanyId: number
) => {
  const { data } = await api.post(
    `/api/v1/Merchant/PaymentProcessorConfigurations`,
    {
      merchantId,
      paymentProcessorCompanyId,
    }
  );

  return data;
};

export const useGetMerchantProcessor = (
  merchantId: number,
  paymentProcessorCompanyId: number
) => {
  return useQuery({
    queryKey: [
      "merchant-processor",
      merchantId,
      paymentProcessorCompanyId,
    ],
    queryFn: () =>
      getMerchantProcessor(
        merchantId,
        paymentProcessorCompanyId
      ),
    enabled: !!merchantId && !!paymentProcessorCompanyId,
  });
};


/* --------------------------------------------- */
/* Create Merchant Processor */
/* POST /api/v1/Merchant/{id}/CreateProcessor */
/* --------------------------------------------- */

export const createMerchantProcessor = async (
  merchantId: number,
  payload: ProcessorPayload
) => {
  const { data } = await api.post(
    `/api/v1/Merchant/${merchantId}/CreateProcessor`,
    payload
  );

  return data;
};


export const useCreateMerchantProcessor = (merchantId: number) => {
  return useMutation({
    mutationFn: (payload: ProcessorPayload) =>
      createMerchantProcessor(merchantId, payload),
  });
};

/* --------------------------------------------- */
/* UPDATE Processor */
/* --------------------------------------------- */

export const updateMerchantProcessor = async (
  merchantId: number,
  payload: ProcessorPayload
) => {
  const { data } = await api.patch(
    `/api/v1/Merchant/${merchantId}/UpdateProcessor`,
    payload
  );

  return data;
};

export const useUpdateMerchantProcessor = (
  merchantId: number
) => {
  return useMutation({
    mutationFn: (payload: ProcessorPayload) =>
      updateMerchantProcessor(merchantId, payload),
  });
};