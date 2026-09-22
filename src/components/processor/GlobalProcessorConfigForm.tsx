import React, { useEffect, useState } from "react";
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type FieldArrayPath,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";

import {
  globalProcessorSchema,
  type GlobalProcessorConfigFormType,
} from "../../schemas/globalProcessorSchema";

import {
  useUpdateProcessor,
  type ProcessorCompany,
} from "../../services/processors/processorsApi";

import checkedIcon from "../../assets/icon-check-mark-fill-selected.svg";
import unCheckedIcon from "../../assets/icon-check-mark-fill-unselected.svg";
import achIcon from "../../assets/icon-ach.svg";
import ccIcon from "../../assets/icon-cc.svg";

import Button from "../../design-system/Button";
import Card from "../../design-system/Card";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon/Icon";

/* ✅ Payment Type */
type PaymentType = "ACH" | "CC";

interface Props {
  processor?: ProcessorCompany;
  defaultValues?: Partial<GlobalProcessorConfigFormType>;
  mode?: "create" | "edit";
  onCreate?: (values: GlobalProcessorConfigFormType) => Promise<void>;
}

const GlobalProcessorConfigForm: React.FC<Props> = ({
  processor,
  defaultValues,
  mode = "edit",
  onCreate,
}) => {
  const navigate = useNavigate();

  const isCreateMode = mode === "create";

  /* ✅ Safe FirstData Check */
  const isFirstData =
    processor?.processor?.trim().toLowerCase() === "first data";

  /* ✅ Update Mutation */
  const updateMutation = useUpdateProcessor();

  /* ✅ Delete Modal State */
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedTppIndex, setSelectedTppIndex] = useState<number | null>(null);

  /* ✅ Form Setup */
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GlobalProcessorConfigFormType>({
    resolver: zodResolver(globalProcessorSchema),
    defaultValues: defaultValues ?? {
      processorName: "",
      identifier: "",
      paymentTypes: [],
      baseUrl: "",
      groupId: "",
      tppIds: [],
    },
  });

  /* ✅ Field Array */
  type FieldPath = FieldArrayPath<GlobalProcessorConfigFormType>;

  const {
    fields: tppFields,
    append: addTpp,
    remove: removeTpp,
    replace,
  } = useFieldArray({
    control,
    name: "tppIds" as FieldPath,
  });

  /* ✅ Prefill Form Values */
  useEffect(() => {
    if (!defaultValues) return;

    reset({
      ...defaultValues,
      tppIds: defaultValues.tppIds ?? [],
    });

    replace(defaultValues.tppIds ?? []);
  }, [defaultValues, reset, replace]);

  /* ✅ Payment Watch */
  const selectedPayments = watch("paymentTypes") as PaymentType[];
  const watchedTppIds = watch("tppIds");
  const selectedTppValue =
    selectedTppIndex !== null ? watchedTppIds?.[selectedTppIndex] : "";

  const togglePayment = (type: PaymentType) => {
    const updated = selectedPayments.includes(type)
      ? selectedPayments.filter((p) => p !== type)
      : [...selectedPayments, type];

    setValue("paymentTypes", updated, { shouldValidate: true });
  };

  /* ✅ Submit */
  const onSubmit: SubmitHandler<GlobalProcessorConfigFormType> = async (
    formData
  ) => {
    if (isCreateMode && onCreate) {
      await onCreate(formData);
      return;
    }

    if (processor) {
      updateMutation.mutate({
        processor,
        values: formData,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 mt-1">
        <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
          <button
            type="button"
            className="mr-2 cursor-pointer"
            onClick={() => navigate("/processors")}
          >
            <Icon name="chevron-left" size={20} />
          </button>

          <span>
            {isCreateMode ? "Create Processor" : processor?.processor}
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="font-semibold text-sm border cursor-pointer"
            icon="refresh"
            iconPosition="left"
            onClick={() => reset(defaultValues)}
          >
            Reset
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="font-semibold text-sm border cursor-pointer"
            icon="save"
            iconPosition="left"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Card */}
      <Card className="p-5">
        <div className="font-bold text-dark-grey">Basic Information</div>

        {/* Name + Identifier */}
        <div className="grid grid-cols-4 gap-5 pt-5">
          {/* Processor Name */}
          <div>
            <label className="label-base">Processor Name</label>
            <input
              {...register("processorName")}
              className={`input-base-form ${errors.processorName ? "error" : ""}`}
              placeholder="Enter Processor Name"
              readOnly={!isCreateMode}
            />

            {errors.processorName && (
              <p className="error-base">{errors.processorName.message}</p>
            )}
          </div>

          {/* Identifier */}
          <div>
            <label className="label-base">Identifier</label>
            <input
              {...register("identifier")}
              className={`input-base-form ${errors.identifier ? "error" : ""}`}
              placeholder="Enter Identifier"
              readOnly={!isCreateMode}
            />

            {errors.identifier && (
              <p className="error-base">{errors.identifier.message}</p>
            )}
          </div>
        </div>

        {/* Payment Types */}
        <div className="mt-5">
          <p className="label-base">Select Payment Types</p>

          <div className="mt-1 flex gap-4">
            {(["ACH", "CC"] as PaymentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => togglePayment(type)}
                className={`flex w-48 items-center font-bold justify-between rounded-lg border px-4 py-3 ${
                  selectedPayments.includes(type)
                    ? "border-primary bg-primary_light2 text-primary"
                    : "text-light-grey border-divider bg-gray-100"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <img src={type === "ACH" ? achIcon : ccIcon} />
                  {type}
                </div>

                <img
                  src={
                    selectedPayments.includes(type)
                      ? checkedIcon
                      : unCheckedIcon
                  }
                />
              </button>
            ))}
          </div>

          {errors.paymentTypes && (
            <p className="error-base">{errors.paymentTypes.message}</p>
          )}
        </div>

        {/* Base URL */}
        <div className="mt-5">
          <label className="label-base">Primary Base URL</label>
          <input
            {...register("baseUrl")}
            placeholder="https://api.processor.com"
            className={`input-base-form ${errors.baseUrl ? "error" : ""}`}
          />

          {errors.baseUrl && (
            <p className="error-base">{errors.baseUrl.message}</p>
          )}
        </div>

        {/* FirstData Only */}
        {!isCreateMode && isFirstData && (
          <div>
            {/* Group ID */}
            <div className="grid grid-cols-4 mt-4">
              <div>
                <label className="label-base">Group ID</label>
                <input
                  {...register("groupId")}
                  readOnly={!isCreateMode}
                  className={`input-base-form ${errors.groupId ? "error" : ""}`}
                />

                {errors.groupId && (
                  <p className="error-base">{errors.groupId.message}</p>
                )}
              </div>
            </div>

            {/* TPP IDs */}
            <div className="mt-4">
              <p className="font-bold text-dark-grey text-sm">TPP IDs</p>

              {tppFields.map((row, index) => (
                <div key={row.id} className="mt-3 grid grid-cols-4">
                    {/* Grid width reference */}
                      <div className="">
                        <input
                          {...register(`tppIds.${index}`)}
                          className={`input-base-form w-full ${
                            errors.tppIds?.[index] ? "error" : ""
                          }`}
                          placeholder={`TPP ID ${index + 1}`}
                        />

                        {errors.tppIds?.[index] && (
                          <p className="error-base">
                            {errors.tppIds[index]?.message}
                          </p>
                        )}
                      </div>

                      <div className="pl-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTppIndex(index);
                            setOpenDeleteModal(true);
                          }}
                          className="shrink-0 text-medium-grey border border-divider rounded-sm p-2.5 hover:text-error hover:border-error"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                  </div>
                ))}

              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border text-sm font-semibold mt-4"
                icon="plus"
                iconPosition="left"
                onClick={() => addTpp("")}
              >
                Add TPP ID
              </Button>
            </div>
          </div>
        )}
      </Card>


      {/* Delete Modal */}
      {openDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-error">
              Confirm Delete
            </h3>

            <p className="mt-3 text-sm text-gray-600">
              Remove TPP ID{" "}
              <span className="font-semibold text-error">
                {selectedTppValue || "(empty)"}
              </span>
              ?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpenDeleteModal(false);
                  setSelectedTppIndex(null);
                }}
                className="rounded-lg w-20 px-4 py-2 text-sm text-primary border border-primary_light1 bg-primary_light2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedTppIndex !== null) {
                    removeTpp(selectedTppIndex);
                  }
                  setOpenDeleteModal(false);
                  setSelectedTppIndex(null);
                }}
                className="rounded-lg w-20 font-semibold bg-error px-4 py-2 text-sm text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default GlobalProcessorConfigForm;
