import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalClient } from "../axios";
import type { IvrFormValues } from "../../schemas/ivrSchema";
import type { IvrAccount } from "../../pages/ivr/IvrAccountsPage";

export type IvrStatus = "Pending" | "Active" | "In-Active";

export const useSaveIvrAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      ivr: IvrAccount;
      values: IvrFormValues;
    }) => {
      return portalClient.patch(
        "/api/v1/UpdateIvr",
        mapFormToApiPayload(payload.ivr, payload.values)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ivr-accounts"] });
    },
  });
};

export function mapFormToApiPayload(
  ivr: IvrAccount,
  form: IvrFormValues
) {
  return {
    id: ivr.id,
    producerId: ivr.producerId,
    merchantId: ivr.merchantId,
    companyName: ivr.companyName,
    phone: ivr.phone,
    status: form.status,
    allowAch: form.allowAch ? "Yes" : "No", // 🔥 conversion here
    callRate: form.callRate,
    minuteRate: form.minuteRate,
    smsRate: form.smsRate,
    monthlyFee: form.monthlyFee,
  };
}
