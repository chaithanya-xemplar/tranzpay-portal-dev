import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { AxiosError } from "axios";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ApiErrorBody {
  message?: string;
}

export interface UpdateBlacklistPayload {
  bankAccountBlacklistId: number;
  producerId: number;
  release: boolean;
}

export interface UnblockAccountResponse {
  success: boolean;
  data?: {
    message?: string;
  };
}

/* ------------------------------------------------------------------ */
/* API CALL                                                           */
/* ------------------------------------------------------------------ */

export const updateBlacklistStatusApi = async (
  payload: UpdateBlacklistPayload
) => {
  const body = {
    Release: payload.release,
    ProducerId: payload.producerId,
    BankAccountBlacklistId: payload.bankAccountBlacklistId,
  };

  const res = await portalClient.patch(
    "/api/v1/UpdateBlacklistedBankAccount",
    body
  );

  if (!res.data?.success) {
    throw new Error(
      res.data?.data?.message || "Failed to update blacklist status"
    );
  }

  return res.data;
};

/* ------------------------------------------------------------------ */
/* MUTATION HOOK                                                       */
/* ------------------------------------------------------------------ */

export const useUpdateBlacklistStatus = () => {
  const qc = useQueryClient();

  return useMutation<
    UnblockAccountResponse,
    AxiosError<ApiErrorBody>,
    UpdateBlacklistPayload
  >({
      mutationFn: updateBlacklistStatusApi,
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: ["blacklisted-accounts"],
        });
      },
    });
};
