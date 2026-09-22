import { z } from "zod";
import { PROCESSOR_CONFIG } from "./processorConfig";
import type { ProcessorCode, PaymentType } from "./types";

export const buildProcessorSchema = (
  code: ProcessorCode,
  payments: PaymentType[]
) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  const config = PROCESSOR_CONFIG[code];

  payments.forEach((type) => {
    const fields = config[type];
    if (!fields) return;

    fields.forEach((f) => {
      if (f.readOnly) return;

      let validator = z
        .string()
        .trim()
        .min(1, `${f.label} is required`);

      if (f.type === "number") {
        validator = validator.regex(/^\d+$/, "Numbers only");
      }

      // Custom validations
      if (f.apiName === "CompanyID") {
        validator = validator.regex(/^\d{10}$/, "Must be 10 digits");
      }

      if (f.apiName === "DepositRoutingNumber") {
        validator = validator.regex(/^\d{9}$/, "Must be 9 digits");
      }

      if (f.apiName === "MerchantCategoryCode") {
        validator = validator.regex(/^\d{4}$/, "Must be 4 digits");
      }

      // IMPORTANT: prefixed field key
      shape[`${type}_${f.apiName}`] = validator;
    });
  });

  return z.object(shape);
};