import { useNavigate, useParams } from "react-router-dom";
import MerchantProcessorForm from "./MerchantProcessorForm";
import type { ProcessorPayload } from "./types";
import { useCreateMerchantProcessor } from "./merchantProcessor.api";
import { useToast } from "../../../design-system/toast/ToastContext";

export default function CreateMerchantProcessorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const merchantId = Number(id ?? 0);

  const { mutate, isPending } =
    useCreateMerchantProcessor(merchantId);

  const handleCreate = (payload: ProcessorPayload) => {
    mutate(payload, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: "Processor Created",
          description: "Merchant processor created successfully",
        });

        navigate(`/merchants/${merchantId}/processors`);
      },
      onError: () => {
        toast({
          variant: "error",
          title: "Creation Failed",
          description: "Unable to create merchant processor",
        });
      },
    });
  };

  return (
    <MerchantProcessorForm
      mode="create"
      onSubmit={handleCreate}
      isSubmitting={isPending}
    />
  );
}