import { useEffect, useState } from "react";
import { useForm, Controller, type Control } from "react-hook-form";

import {
  merchantPaymentFeesSchema,
  type MerchantPaymentFeesFormValues,
  type MerchantPaymentFeesValues,
} from "../../schemas/merchantsSchema";
import { zodResolver } from "@hookform/resolvers/zod";

import FieldError from "../../design-system/FieldError";
import Button from "../../design-system/Button";
import achIcon from "../../assets/icon-ach.svg";
import ccIcon from "../../assets/icon-cc.svg";

/* ================= TYPES ================= */
interface Props {
  initialValues?: Partial<MerchantPaymentFeesValues>;
  onSubmit: (values: MerchantPaymentFeesValues) => void;
  mode?: "create" | "edit";
  isSubmitting?: boolean;
  disabled?: boolean;
}

type FeeConfiguration =
  NonNullable<MerchantPaymentFeesValues["achFeeConfiguration"]>;

const isConfigFilled = (data?: FeeConfiguration | null): boolean => {
  if (!data) return false;

  return (
    (data.feeType && data.feeType.trim() !== "") ||
    (data.feeFormat && data.feeFormat.trim() !== "") ||
    data.feeValue != null ||
    data.batchCloseHours != null ||
    data.batchCloseMinutes != null ||
    data.batchCloseMeridiem != null
  );
};

/* ================= TIME PICKER ================= */

type FeeTimePath =
  | "achFeeConfiguration.batchCloseHours"
  | "achFeeConfiguration.batchCloseMinutes"
  | "achFeeConfiguration.batchCloseMeridiem"
  | "ccFeeConfiguration.batchCloseHours"
  | "ccFeeConfiguration.batchCloseMinutes"
  | "ccFeeConfiguration.batchCloseMeridiem";

interface TimePickerProps {
  control: Control<MerchantPaymentFeesValues>;
  hoursName: FeeTimePath;
  minutesName: FeeTimePath;
  meridiemName: FeeTimePath;
}

const TimePickerField = ({
  control,
  hoursName,
  minutesName,
  meridiemName,
}: TimePickerProps) => {
  return (
    <div className="flex gap-0.5">
      <Controller
        control={control}
        name={hoursName}
        render={({ field }) => (
          <select
            {...field}
            value={field.value ?? 12}
            onChange={(e) =>
              field.onChange(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="input-base-form w-24"
          >
            <option value="">HH</option>
            {Array.from({ length: 12 }, (_, i) => {
              const val = String(i + 1);
              return (
                <option key={val} value={val}>
                  {val}
                </option>
              );
            })}
          </select>
        )}
      />

      <Controller
        control={control}
        name={minutesName}
        render={({ field }) => (
          <select
            {...field}
            value={field.value ?? 0}
            onChange={(e) =>
              field.onChange(Number(e.target.value))
            }
            className="input-base-form w-24"
          >
            <option value="">MM</option>
            {Array.from({ length: 60 }, (_, i) => {
              const label = i.toString().padStart(2, "0");
              return (
                <option key={i} value={i}>
                  {label}
                </option>
              );
            })}
          </select>
        )}
      />

      <Controller
        control={control}
        name={meridiemName}
        render={({ field }) => (
          <select
            {...field}
            onChange={(e) => field.onChange(e.target.value || undefined)}
            className="input-base-form w-24"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        )}
      />
    </div>
  );
};

/* ================= COMPONENT ================= */

export default function MerchantPaymentFeesForm({
  initialValues,
  onSubmit,
  mode = "edit",
  isSubmitting,
  disabled = false,
}: Props) {
  const [formError, setFormError] = useState<string | null>(null);

  const buildFormValues = (
    values?: Partial<MerchantPaymentFeesValues>
  ): MerchantPaymentFeesFormValues => ({
    merchantId: Number(values?.merchantId ?? 0),
    corporateId: Number(values?.corporateId ?? 0),

    achFeeConfiguration: {
      ...values?.achFeeConfiguration,
      batchCloseHours: values?.achFeeConfiguration?.batchCloseHours ?? 12,
      batchCloseMinutes: values?.achFeeConfiguration?.batchCloseMinutes ?? 0,
      batchCloseMeridiem: values?.achFeeConfiguration?.batchCloseMeridiem ?? "AM",
    },

    ccFeeConfiguration: {
      ...values?.ccFeeConfiguration,
      batchCloseHours: values?.ccFeeConfiguration?.batchCloseHours ?? 12,
      batchCloseMinutes: values?.ccFeeConfiguration?.batchCloseMinutes ?? 0,
      batchCloseMeridiem: values?.ccFeeConfiguration?.batchCloseMeridiem ?? "AM",
    },
  });

  const form = useForm<MerchantPaymentFeesFormValues>({
    resolver: zodResolver(merchantPaymentFeesSchema),
    defaultValues: buildFormValues(initialValues),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset(buildFormValues(initialValues));
  }, [initialValues, reset]);

  useEffect(() => {
    if (formError) setFormError(null);
  }, [watch()]);

  const achFeeFormat = watch("achFeeConfiguration.feeFormat");
  const ccFeeFormat = watch("ccFeeConfiguration.feeFormat");

  const handleReset = () => {
    reset(buildFormValues(initialValues));
    setFormError(null);
  };

  const handleFormSubmit = (values: MerchantPaymentFeesFormValues) => {
    const achFilled = isConfigFilled(values.achFeeConfiguration);
    const ccFilled = isConfigFilled(values.ccFeeConfiguration);

    if (!achFilled && !ccFilled) {
      setFormError(
        "Please configure at least one payment method (ACH or CC)."
      );
      return;
    }

    setFormError(null);
    onSubmit(values);
  };

  const isCreateMode = mode === "create";

  const hasConfig =
    !!initialValues?.achFeeConfiguration ||
    !!initialValues?.ccFeeConfiguration;

  const showSaveMerchantMessage = isCreateMode && disabled;

  const showNoConfigMessage = !isCreateMode && !hasConfig;

  const fieldsDisabled = mode === "create" && disabled;

  const buttonsDisabled = fieldsDisabled || isSubmitting;

  const fieldClass = "flex flex-col gap-1 min-w-[200px]";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="mt-6 border-0 rounded-lg bg-white"
    >
      {/* ✅ GLOBAL ERROR */}
      {formError && (
        <div className="mx-4 mb-3 p-3 text-sm text-error bg-red-50 border border-red-200 rounded">
          {formError}
        </div>
      )}

      {showSaveMerchantMessage && (
        <div className="p-4 text-sm text-error">
          Submit merchant basic information first to configure payment settings.
        </div>
      )}

      {showNoConfigMessage && (
        <div className="p-4 text-sm text-error border-b border-divider">
          No payment fee configuration available. Please add configuration and save.
        </div>
      )}

      {/* HEADER */}
      <div
        className={`flex items-center justify-between py-3 ${
          fieldsDisabled ? "bg-gray-100 opacity-70" : "bg-white"
        }`}
      >
        <h2 className="pl-4 text-base font-bold text-dark-grey">
          Payment Settings
        </h2>

        <div className="flex items-center gap-3 pr-4">
          <Button
            variant="outline"
            className="font-semibold text-sm border cursor-pointer"
            icon="refresh"
            iconPosition="left"
            onClick={handleReset}
            type="button"
            disabled={buttonsDisabled}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            className="font-semibold text-sm border cursor-pointer"
            icon="save"
            iconPosition="left"
            type="submit"
            disabled={buttonsDisabled}
          >
            Save
          </Button>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <fieldset 
        disabled={fieldsDisabled} 
        className={`p-5 border-t border-divider ${
          fieldsDisabled ? "bg-gray-100 opacity-70" : "bg-white"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
        
        {/* ================= ACH SETTINGS ================= */}
          <div className="pb-5 pr-5">
            <div className="font-bold mb-5 text-dark-grey">
              <div className="flex gap-3 items-center">
                <img src={achIcon} className="w-6 h-6"/>
                ACH Settings
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className={fieldClass}>
                <label className="label-base">ACH Fee Type</label>
                <select
                  {...register("achFeeConfiguration.feeType")}
                  className="input-base-form"
                >
                  <option value="">Select Type</option>
                  <option value="Convenience">Convenience</option>
                  <option value="Traditional">Traditional</option>
                </select>
                <FieldError message={errors.achFeeConfiguration?.feeType?.message} />
              </div>

              <div className={fieldClass}>
                <label className="label-base">ACH Fee Format</label>
                <select
                  {...register("achFeeConfiguration.feeFormat")}
                  className="input-base-form"
                >
                  <option value="">Select Format</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Dollar">Dollar</option>
                </select>
                <FieldError message={errors.achFeeConfiguration?.feeFormat?.message} />
              </div>

              <div className={fieldClass}>
                <label className="label-base">ACH Fee Value</label>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    {...register("achFeeConfiguration.feeValue", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Fee cannot be negative",
                      },
                    })}
                    className="input-base-form appearance-none pr-10"
                    placeholder="0.00"
                  />

                  {achFeeFormat === "Percentage" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  )}
                </div>

                <FieldError
                  message={errors.achFeeConfiguration?.feeValue?.message}
                />
              </div>

              {/* Batch Close Time */}
              <div className="flex flex-col gap-1">
                  <label className="label-base">Batch Close Time</label>

                  <TimePickerField
                      control={form.control}
                      hoursName="achFeeConfiguration.batchCloseHours"
                      minutesName="achFeeConfiguration.batchCloseMinutes"
                      meridiemName="achFeeConfiguration.batchCloseMeridiem"
                  />
                  <FieldError
                    message={
                      errors.achFeeConfiguration?.batchCloseHours?.message ||
                      errors.achFeeConfiguration?.batchCloseMinutes?.message ||
                      errors.achFeeConfiguration?.batchCloseMeridiem?.message
                    }
                  />
              </div>

            </div>
          </div>

          {/* ================= CC SETTINGS ================= */}
          
          <div className={`pb-5 pl-5 border-l-[1px] border-gray-200`}>
            <div className="font-bold mb-5 text-dark-grey">
              <div className="flex gap-3 items-center">
                <img src={ccIcon} className="w-6 h-6"/>
                CC Settings
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className={fieldClass}>
                <label className="label-base">CC Fee Type</label>
                <select
                  {...register("ccFeeConfiguration.feeType")}
                  className="input-base-form"
                >
                  <option value="">Select Type</option>
                  <option value="Convenience">Convenience</option>
                  <option value="Traditional">e</option>
                </select>
                <FieldError message={errors.ccFeeConfiguration?.feeType?.message} />
              </div>

              <div className={fieldClass}>
                <label className="label-base">CC Fee Format</label>
                <select
                  {...register("ccFeeConfiguration.feeFormat")}
                  className="input-base-form"
                >
                  <option value="">Select Format</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Dollar">Dollar</option>
                </select>
                <FieldError message={errors.ccFeeConfiguration?.feeFormat?.message} />
              </div>

              <div className={fieldClass}>
                <label className="label-base">CC Fee Value</label>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    {...register("ccFeeConfiguration.feeValue", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Fee cannot be negative",
                      },
                    })}
                    className="input-base-form appearance-none pr-10"
                    placeholder="0.00"
                  />

                  {ccFeeFormat === "Percentage" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  )}
                </div>

                <FieldError
                  message={errors.ccFeeConfiguration?.feeValue?.message}
                />
              </div>

              <div className="flex flex-col gap-1">
                  <label className="label-base">Batch Close Time</label>

                  <TimePickerField
                      control={form.control}
                      hoursName="ccFeeConfiguration.batchCloseHours"
                      minutesName="ccFeeConfiguration.batchCloseMinutes"
                      meridiemName="ccFeeConfiguration.batchCloseMeridiem"
                  />
                  <FieldError
                    message={
                      errors.ccFeeConfiguration?.batchCloseHours?.message ||
                      errors.ccFeeConfiguration?.batchCloseMinutes?.message ||
                      errors.ccFeeConfiguration?.batchCloseMeridiem?.message
                    }
                  />
              </div>

            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
