import { useParams } from "react-router-dom";
import { useMemo } from "react";
import Card from "../../../design-system/Card";
import MerchantsForm from "../MerchantsForm";
import {
  getMerchant,
  paymentFeesApiToForm,
  useGetMerchant,
  useGetMerchantPaymentFees,
  useUpdateMerchant,
  useUpdateMerchantPaymentFees,
  type FeeConfiguration,
} from "../../../services/merchants/merchantApi";
import { useQuery } from "@tanstack/react-query";
import type { MerchantFormValues, MerchantPaymentFeesValues } from "../../../schemas/merchantsSchema";
import { useToast } from "../../../design-system/toast/ToastContext";
import MerchantPaymentFeesForm from "../MerchantPaymentFeesForm";

export default function MerchantInfoTab() {
  const { id } = useParams<{ id: string }>();
  const merchantId = useMemo(() => Number(id), [id]);

  const { toast } = useToast();
  const updateMerchant = useUpdateMerchant();

  const { data: initialValues, isLoading } =
    useGetMerchant(merchantId);

  const { data: merchantApiMetaData } = useQuery({
    queryKey: ["merchant-raw", merchantId],
    enabled: Number.isFinite(merchantId),
    queryFn: () => getMerchant(merchantId),
  });

  const { data: paymentFeesInitialValues, isLoading: feesLoading } =
    useGetMerchantPaymentFees(merchantId);
  console.log(paymentFeesInitialValues, "2");

  const updatePaymentFees = useUpdateMerchantPaymentFees();

  if (isLoading || !initialValues) {
    return <Card>Loading...</Card>;
  }

  const handleSubmit = async (values: MerchantFormValues) => {
    if (!merchantApiMetaData) {
      toast({ variant: "error", title: "Missing merchant metadata" });
      return;
    }

    await updateMerchant.mutateAsync({
      form: values,
      merchantId,
      mainProducerId: merchantApiMetaData.mainProducerId ?? 0,
      corporateId: Number(merchantApiMetaData.corporateId ?? 0),
    });

    toast({
      variant: "success",
      title: "Merchant Updated",
      description: "Merchant details saved successfully.",
    });
  };

  const handleSubmitPaymentFees = async (values: MerchantPaymentFeesValues) => {
    if (!merchantApiMetaData) {
      toast({ variant: "error", title: "Missing merchant metadata" });
      return;
    }

    const normalizeConfig = (config?: FeeConfiguration | null) =>
      config?.feeType ? config : null;

    const payload = {
      merchantId,
      corporateId: Number(merchantApiMetaData.corporateId ?? 0),
      achFeeConfiguration: normalizeConfig(values.achFeeConfiguration),
      ccFeeConfiguration: normalizeConfig(values.ccFeeConfiguration),
    };

    try {
      await updatePaymentFees.mutateAsync(payload);

      toast({
        variant: "success",
        title: "Payment Settings Saved",
        description: "Payment settings updated successfully.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Update Failed",
        description: "Unable to update payment settings.",
      });
    }
  };

  if (isLoading || feesLoading || !initialValues) {
    return <Card>Loading...</Card>;
  }

  return (
    <>
      <Card>
        <MerchantsForm
          mode="edit"
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={updateMerchant.isPending}
        />
      </Card>

      <Card className="mt-6">
        <MerchantPaymentFeesForm
          mode="edit"
          initialValues={paymentFeesApiToForm(paymentFeesInitialValues)}
          onSubmit={handleSubmitPaymentFees}
          isSubmitting={updatePaymentFees.isPending}
          // disabled={!paymentFeesInitialValues}
        />
      </Card>
    </>
  );
}