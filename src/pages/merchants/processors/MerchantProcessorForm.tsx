import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";

import type {
  Mode,
  ProcessorApiResponse,
  ProcessorCode,
  PaymentType,
  ProcessorPayload,
} from "./types";

import { PROCESSOR_CONFIG } from "./processorConfig";
import { buildProcessorSchema } from "./processorSchema";

import Card from "../../../design-system/Card";
import Button from "../../../design-system/Button";
import achIcon from "../../../assets/icon-ach.svg";
import ccIcon from "../../../assets/icon-cc.svg";
import z from "zod";
import { Eye, EyeOff } from "lucide-react";
import Icon from "../../../components/Icon/Icon";

/* ------------------------------------------------ */

interface Props {
  mode: Mode; // "create" | "view"
  initialData?: ProcessorApiResponse;
  onSubmit?: (payload: ProcessorPayload) => void;
  isSubmitting?: boolean;
}

export default function MerchantProcessorForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [processorCode, setProcessorCode] =
    useState<ProcessorCode | "">("");

  const [activePayments, setActivePayments] =
    useState<PaymentType[]>([]);

  const [isEditing, setIsEditing] = useState(mode === "create");

  const [visibleFields, setVisibleFields] = useState<
      Record<string, boolean>
    >({});

  // ✅ Store original values for Cancel restore
  const originalValuesRef = useRef<Record<string, string>>({});
  const { id: merchantId } = useParams();
  const navigate = useNavigate();

  const toggleVisibility = (fieldKey: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  /* ------------------------------------------------ */
  /* Detect Processor in View Mode */
  /* ------------------------------------------------ */

  const handleBack = () => {
    if (merchantId) {
      navigate(`/merchants/${merchantId}/processors`);
    } else {
      navigate(-1); // fallback to previous page
    }
  };

  useEffect(() => {
    if (!initialData) return;

    const matched = Object.entries(PROCESSOR_CONFIG).find(
      ([code]) => code === initialData.processorType
    );


    if (!matched) return;

    const code = matched[0] as ProcessorCode;
    setProcessorCode(code);

    const payments: PaymentType[] = [];
    if (initialData.IsACHType) payments.push("ACH");
    if (initialData.IsCCType) payments.push("CC");

    setActivePayments(payments);
  }, [initialData]);

  /* ------------------------------------------------ */
  /* Create Mode → Auto Enable Supported Payments */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (mode !== "create") return;
      if (!processorCode) {
        setActivePayments([]);
        return;
      }

      const supported =
        PROCESSOR_CONFIG[processorCode].supportedPayments;

      setActivePayments(supported);
    }, [processorCode, mode]);

  /* ------------------------------------------------ */
  /* Build Schema Dynamically */
  /* ------------------------------------------------ */

  const schema = useMemo(() => {
    // CREATE MODE → processorCode is required
    if (mode === "create") {
      if (!processorCode) {
        return z.object({
          processorCode: z
            .string()
            .min(1, "Processor selection is required"),
        });
      }

      return buildProcessorSchema(
        processorCode,
        activePayments
      );
    }

    // VIEW / EDIT MODE → NEVER require processorCode
    if (processorCode !== "") {
      return buildProcessorSchema(
        processorCode,
        activePayments
      );
    }

    // fallback safe schema
    return z.record(z.string(), z.any());
  }, [mode, processorCode, activePayments]);

  type ProcessorFormValues = Record<string, unknown>;

  const resolver = useMemo(() => {
    if (mode === "create" || isEditing) {
      return zodResolver(schema);
    }
    return undefined;
  }, [schema, mode, isEditing]);

  const form = useForm<ProcessorFormValues>({
    resolver: resolver,
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "firstError",
    shouldUnregister: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  /* ------------------------------------------------ */
  /* Load Existing Configurations */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (!initialData || !processorCode) return;

    const values: Record<string, string> = {};

    if (initialData.achConfiguration) {
      Object.entries(initialData.achConfiguration).forEach(([k, v]) => {
        values[`ACH_${k}`] = String(v);
      });
    }

    if (initialData.ccConfiguration) {
      Object.entries(initialData.ccConfiguration).forEach(([k, v]) => {
        values[`CC_${k}`] = String(v);
      });
    }

    originalValuesRef.current = values; // ✅ store original
    reset(values);
  }, [initialData, processorCode, reset]);

  /* ------------------------------------------------ */
  /* Reset / Cancel Logic */
  /* ------------------------------------------------ */

  const handleReset = () => {
    if (mode === "create") {
      reset();
      setProcessorCode("");
      setActivePayments([]);
    } else {
      setIsEditing(false);
      reset(originalValuesRef.current);
    }
  };

  /* ------------------------------------------------ */
  /* Submit */
  /* ------------------------------------------------ */

  const submit = (values: Record<string, unknown>) => {
    if (!processorCode) return;

    const config = PROCESSOR_CONFIG[processorCode];

    const buildConfig = (type: PaymentType) => {
      const fields = config[type];
      if (!fields) return "";

      const obj: Record<string, string> = {};

      fields.forEach((f) => {
        if (f.readOnly) return;

        const key = `${type}_${f.apiName}`;
        obj[f.apiName] = String(values[key] ?? "");
      });

      return JSON.stringify(obj);
    };

    const payload: ProcessorPayload = {
      processorType: config.processorType,
      IsACHType: activePayments.includes("ACH"),
      IsCCType: activePayments.includes("CC"),
      achConfiguration: activePayments.includes("ACH")
        ? buildConfig("ACH")
        : "",
      ccConfiguration: activePayments.includes("CC")
        ? buildConfig("CC")
        : "",
    };

    onSubmit?.(payload);

    // ✅ After update return to view mode
    if (mode !== "create") {
      setIsEditing(false);
    }
  };

  /* ------------------------------------------------ */
  /* Render Section */
  /* ------------------------------------------------ */

  const renderSection = (type: PaymentType) => {
    if (!processorCode) return null;

    const fields = PROCESSOR_CONFIG[processorCode][type];
    if (!fields) return null;

    const twoColumnLayout = activePayments.length === 2;

    return (
      <Card className="p-5">
        <div className="font-bold mb-5 text-dark-grey">
          <div className="flex gap-3 items-center">
            <img src={type === "ACH" ? achIcon : ccIcon} className="w-6 h-6"/>
            {type} Settings
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            twoColumnLayout
              ? "grid-cols-1"
              : "grid-cols-4"
          }`}
        >
          {fields.map((field) => (
            <div key={field.apiName} className="flex flex-col">
              <label className="label-base">
                {field.label}
              </label>

              {(() => {
                const fieldKey = `${type}_${field.apiName}`;
                const error = errors[fieldKey];

                return (
                  <>
                    <div className="relative">
                      <input
                        {...register(fieldKey)}
                        readOnly={!isEditing || field.readOnly}
                        type={
                          field.type === "password"
                            ? visibleFields[fieldKey]
                              ? "text"
                              : "password"
                            : field.type ?? "text"
                        }
                        placeholder={field.placeholder ?? field.label}
                        className={`input-base-form w-full ${
                          field.type === "password" ? "pr-10" : ""
                        } ${error ? "error" : ""}`}
                      />

                      {field.type === "password" && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => toggleVisibility(fieldKey)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        >
                          {visibleFields[fieldKey] ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      )}
                    </div>

                    {error && (
                      <span className="error-base">
                        {String(error.message)}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  /* ------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------ */
  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="flex justify-between items-center mb-4">

        <div className="flex justify-between items-center text-[16px] font-bold text-dark-grey">
          <button
            type="button"
            onClick={handleBack}
            className="mr-2"
          >
            <Icon name="arrow-left" size={24} />
          </button>

          <span>
          {mode === "create"
            ? "Create Processor"
            : "Processor Details"}
          </span>
        </div>


        <div className="flex gap-2">

          {/* CREATE MODE */}
          {mode === "create" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="font-semibold text-sm border cursor-pointer"
                icon="refresh"
                iconPosition="left"
                onClick={handleReset}
              >
                Reset
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="font-semibold text-sm border cursor-pointer"
                icon="save"
                iconPosition="left"
              >
                Save
              </Button>
            </>
          )}

          {/* VIEW MODE */}
          {mode !== "create" && !isEditing && (
            <Button
              type="button"
              variant="outline"
              className="font-semibold text-sm border cursor-pointer"
              icon="edit"
              iconPosition="left"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}

          {/* EDIT MODE */}
          {mode !== "create" && isEditing && (
            <>
              <Button
                type="button"
                variant="outline"
                className="font-semibold text-sm border cursor-pointer"
                icon="x"
                iconPosition="left"
                onClick={handleReset}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="font-semibold text-sm border cursor-pointer"
                icon="save"
                iconPosition="left"
              >
                Save
              </Button>
            </>
          )}

        </div>
      </div>

      {/* Processor Dropdown (Create Only) */}
      {mode === "create" && (
        <Card className="p-5 mb-5">
          <div className="pb-5 text-dark-grey font-bold text-[16px]">Add Processor</div>
          <div className="flex flex-col w-64">
              <label className="label-base" htmlFor="processorCode">
                Select Processor
              </label>
              <div className="select-wrapper">
                <select
                    {...register("processorCode")}
                    className={`input-base-form select-custom ${
                      errors.processorCode ? "error" : ""
                    }`}
                    onChange={(e) =>
                      setProcessorCode(
                        e.target.value as ProcessorCode
                      )
                    }
                  >
                  <option value="">Select Processor</option>
                  {Object.entries(PROCESSOR_CONFIG).map(
                    ([code, config]) => (
                      <option key={code} value={code}>
                        {config.processorType}
                      </option>
                    )
                  )}
                </select>
                {errors.processorCode && (
                  <span className="error-base">
                    {String(errors.processorCode.message)}
                  </span>
                )}
              </div>
          </div>
        </Card>
      )}

      {/* ACH / CC Sections */}
      {processorCode && activePayments.length > 0 && (
        <div
          className={`grid gap-6 ${
            activePayments.length === 1
              ? "grid-cols-1"
              : "grid-cols-2"
          }`}
        >
          {activePayments.map((type) =>
            renderSection(type)
          )}
        </div>
      )}
    </form>
  );
}
