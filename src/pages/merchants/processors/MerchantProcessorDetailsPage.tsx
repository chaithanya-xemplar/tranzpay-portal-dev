import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../../design-system/toast/ToastContext";
import MerchantProcessorForm from "./MerchantProcessorForm";
import {
  useGetMerchantProcessor,
  useUpdateMerchantProcessor
} from "./merchantProcessor.api";
import type { ProcessorPayload } from "./types";

const safeParse = (value: string | null) => {
  if (!value) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export default function MerchantProcessorDetailsPage() {
  const { id, processorId } = useParams<{
    id: string;
    processorId: string;
  }>();

  const merchantId = Number(id);
  const paymentProcessorCompanyId = Number(processorId);

  const navigate = useNavigate();
  const { toast } = useToast();

  /* ---------------- GET ---------------- */

  const { data, isLoading } =
    useGetMerchantProcessor(
      merchantId,
      paymentProcessorCompanyId
    );
  
  const rawProcessoredData = data?.data?.[0];

  const processorData = rawProcessoredData
    ? {
        processorType: rawProcessoredData.identifier,
        IsACHType: rawProcessoredData.ach,
        IsCCType: rawProcessoredData.cc,
        achConfiguration: safeParse(rawProcessoredData.achConfig),
        ccConfiguration: safeParse(rawProcessoredData.ccConfig),
      }
    : undefined;
  /* ---------------- UPDATE ---------------- */

  const updateMutation =
    useUpdateMerchantProcessor(merchantId);

  const handleUpdate = (payload: ProcessorPayload) => {
    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: "Processor Updated",
          description:
            "Merchant processor updated successfully",
        });

        navigate(
          `/merchants/${merchantId}/processors`
        );
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <MerchantProcessorForm
      mode="view"
      initialData={processorData}
      onSubmit={handleUpdate}
      isSubmitting={updateMutation.isPending}
    />
  );
}