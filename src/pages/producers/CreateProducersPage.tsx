// src/pages/CreateProducersPage.tsx
import { type ProducerFormValues } from "../../schemas/producersSchema";
import Card from "../../design-system/Card";
import ProducersForm from "./ProducersForm";
import { useCreateProducer } from "../../services/producers/producerApi";
import type { UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import Button from "../../design-system/Button";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../design-system/toast/ToastContext";
import axios from "axios";
import Icon from "../../components/Icon/Icon";

interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
}

export default function CreateProducersPage() {
  const createProducer = useCreateProducer();
  const formRef = useRef<UseFormReturn<ProducerFormValues> | null>(null);

  const navigate = useNavigate();
  const {state } = useLocation();
  const merchantId = Number(state?.merchantId);
  const mainProducerId =  Number(state?.mainProducerId);
  const corporateId = Number(state?.corporateId);
  const merchantName = state?.merchantName;

  const { toast } = useToast();
  

  const handleSubmit = async (values: ProducerFormValues) => {
  try {
    await createProducer.mutateAsync({
      form: values,
      merchantId,
      mainProducerId,
      corporateId
    });

    toast({
      variant: "success",
      title: "Producer Created",
      description: "Producer has been created successfully.",
    });

    navigate("/producers");
  } catch (error) {
    let message = "Failed to create producer. Please try again.";

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

  const handleReset = () => {
    if (!formRef.current) return;
    // reset back to initial default values
    formRef.current.reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-1">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button className="mr-2 cursor-pointer" onClick={() => navigate("/producers")}>
            <Icon name="arrow-left" size={24} />
          </button>
          <span>
            New Producer User
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="font-semibold text-sm border cursor-pointer"
            icon="refresh"
            iconPosition="left"
            onClick={handleReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            className="font-semibold text-sm border cursor-pointer"
            icon="save"
            iconPosition="left"
            disabled={createProducer.isPending}
            onClick={() => formRef.current?.handleSubmit(handleSubmit)()}
          >
            Submit
          </Button>
        </div>
      </div>

      <Card>
        <ProducersForm onSubmit={handleSubmit} formRef={formRef} merchantDetails={{merchantName: merchantName}} />
      </Card>
    </div>
  );
}
