// src/pages/ProducerDetailsPage.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import Card from "../../design-system/Card";
import Button from "../../design-system/Button";
import ProducersForm from "./ProducersForm";
import {
  useGetProducer,
  useUpdateProducer,
} from "../../services/producers/producerApi";
import type { ProducerFormValues } from "../../schemas/producersSchema";
import { useToast } from "../../design-system/toast/ToastContext";
import Icon from "../../components/Icon/Icon";
import ErrorBoundaryPage from "../../components/ErrorBoundaryPage";


export default function ProducerDetailsPage() {
  const { id: idParam } = useParams<{ id: string }>();

  // ✅ same pattern as MerchantDetailsPage
  const producerId = useMemo(
    () => (idParam ? Number(idParam) : NaN),
    [idParam]
  );
  const hasValidId = Number.isFinite(producerId);



  const updateProducer = useUpdateProducer();
  const formRef = useRef<UseFormReturn<ProducerFormValues> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    data: initialValues,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProducer(producerId);

  // ---------- Handlers ----------
  const handleSubmit = async (values: ProducerFormValues) => {
    try {
      await updateProducer.mutateAsync({
        form: values,
        producerId: producerId,
        corporateId: Number(initialValues?.corporateId),
        merchantId: Number(initialValues?.merchantId),
        mainProducerId: Number(initialValues?.mainProducerId),
      });

      toast({
        variant: "success",
        title: "Processing Profile Updated",
        description: "Processing profile details saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update processing profile.",
      });
    }
  };

  const handleReset = () => {
    if (!formRef.current || !initialValues) return;
    formRef.current.reset(initialValues);
  };

  // ---------- UI STATES ----------
  if (!hasValidId) {
    return (
      <div className="p-4">
        <div className="mb-2 text-red-600 font-medium">
          Invalid or missing processing profile id in the URL. Expected /producers/:id
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4 mt-1">
          <div className="text-lg font-bold pl-1 text-dark-grey">
            Processing Profile Information
          </div>
        </div>
        <Card>
          <div className="animate-pulse p-6">Loading processing profile…</div>
        </Card>
      </div>
    );
  }

  if (isError || !initialValues) {
    return (
      <ErrorBoundaryPage
        error={error}
        title="Failed to load processing profile"
        onReload={() => refetch()}
        onSecondaryClick={() => navigate("/producers")}
        secondaryActionLabel="Back to Processing Profiles"
      />
    );
  }

  // ---------- MAIN UI ----------
  return (
    <div>
      <div className="flex justify-between items-center mb-4 mt-1">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button className="mr-2 cursor-pointer" onClick={() => navigate("/producers")}>
            <Icon name="arrow-left" size={24} />
          </button>
          <span>
            {initialValues.companyName}
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
            disabled={updateProducer.isPending}
            onClick={() => formRef.current?.handleSubmit(handleSubmit)()}
          >
            Save
          </Button>
        </div>
      </div>

      <Card>
        <ProducersForm
          onSubmit={handleSubmit}
          formRef={formRef}
          initialValues={initialValues}
        />
      </Card>
    </div>
  );
}
