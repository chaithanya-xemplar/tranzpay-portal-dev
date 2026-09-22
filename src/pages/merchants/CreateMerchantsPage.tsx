import { type MerchantFormValues, type MerchantPaymentFeesValues } from "../../schemas/merchantsSchema";
import Card from "../../design-system/Card";
import MerchantsForm from "./MerchantsForm";
import MerchantPaymentFeesForm from "./MerchantPaymentFeesForm";
import backIcon from "../../assets/icon-arrow-left.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useCreateMerchant, useCreateMerchantPaymentFees, type FeeConfiguration } from "../../services/merchants/merchantApi";
import { useToast } from "../../design-system/toast/ToastContext";
import axios from "axios";
import { useState } from "react";

interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
}

export default function CreateMerchantsPage() {
  const createMerchant = useCreateMerchant();
  const navigate = useNavigate();
  const { state } = useLocation();

  const corporateId = state?.corporateId;
  const corpName = state?.corpName;

  const { toast } = useToast();

  const createPaymentFees = useCreateMerchantPaymentFees();

  const [createdMerchantId, setCreatedMerchantId] = useState<number | null>(null);

  const handleSubmit = async (values: MerchantFormValues) => {
    try {
      const response = await createMerchant.mutateAsync({
        form: values,
        corporateId,
      });

      const merchantId = Number(response?.data?.merchantId);

      setCreatedMerchantId(merchantId);

      toast({
        variant: "success",
        title: "Merchant Created",
        description: "Merchant basic info saved. Configure payment settings.",
      });

    } catch (error) {
      let message = "Failed to create merchant. Please try again.";

      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        message = error.response?.data?.detail ?? message;
      }

      toast({
        variant: "error",
        title: "Creation Failed",
        description: message,
      });
    }
  };

  const handleSubmitPaymentFees = async (values: MerchantPaymentFeesValues) => {
    if (!createdMerchantId) return;

    const normalizeConfig = (config?: FeeConfiguration | null) =>
      config?.feeType ? config : null;

    const payload = {
      merchantId: createdMerchantId,
      corporateId,
      achFeeConfiguration: normalizeConfig(values.achFeeConfiguration),
      ccFeeConfiguration: normalizeConfig(values.ccFeeConfiguration),
    };

    try {
      await createPaymentFees.mutateAsync(payload);

      toast({
        variant: "success",
        title: "Payment Settings Saved",
        description: "Payment settings saved successfully.",
      });

      navigate("/merchants");

    } catch {
      toast({
        variant: "error",
        title: "Failed",
        description: "Unable to save payment settings.",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-1">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button
            className="mr-2 cursor-pointer"
            onClick={() => navigate("/merchants")}
          >
            <img src={backIcon} alt="back icon" />
          </button>
          <span>New Merchant User</span>
        </div>
      </div>

      <Card>
        <MerchantsForm
          mode="create"
          corpDetails={{ corporateId, corpName }}
          onSubmit={handleSubmit}
          isSubmitting={createMerchant.isPending}
        />
      </Card>

      {/* Payment Settings visible only after merchant created */}
        <Card className="mt-6">
          <MerchantPaymentFeesForm
            mode="create"
            onSubmit={handleSubmitPaymentFees}
            disabled={!createdMerchantId}
            isSubmitting={createPaymentFees.isPending}
          />
        </Card>
    </div>
  );
}