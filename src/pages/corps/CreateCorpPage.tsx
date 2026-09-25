import CorpForm from "./CorpsForm";
import type { CorpFormValues } from "../../schemas/corpsSchema";
import Card from "../../design-system/Card";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import Button from "../../design-system/Button";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../design-system/toast/ToastContext";
import { useCreateCorp } from "../../services/corps/corpApi";
import Icon from "../../components/Icon/Icon";
import { getErrorMessage } from "../../utils/error";

export default function CreateCorpPage() {
  const createCorp = useCreateCorp();
  const formRef = useRef<UseFormReturn<CorpFormValues> | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (values: CorpFormValues) => {
    try {
        await createCorp.mutateAsync(values);
        toast({
          variant: "success",
          title: "Success",
          description: "Company created successfully.",
        });
        navigate("/corps");
      } catch (err) {
        const message = getErrorMessage(err) || "Company not Created";

        toast({
          variant: "error",
          title: "Error",
          description: message,
        });
      }
  };

  const handleReset = () => {
    if (!formRef.current) return;
    formRef.current.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-1">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button
            type="button"
            className="mr-2 cursor-pointer"
            onClick={() => navigate("/corps")}
            aria-label="Back to companies"
          >
            <Icon name="arrow-left" size={24} />
          </button>
          <span>
            New Company
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            icon="refresh"
            iconPosition="left"
            type="button"
            onClick={handleReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            icon="save"
            iconPosition="left"
            type="button"
            disabled={createCorp.isPending}
            onClick={() => formRef.current?.handleSubmit(handleSubmit)()}
          >
            Submit
          </Button>
        </div>
      </div>

      <Card>
        <CorpForm mode="create" onSubmit={handleSubmit} formRef={formRef} />
      </Card>
    </div>
  );
}
