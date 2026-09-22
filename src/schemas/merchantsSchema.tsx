// src/schemas/merchantsSchema.ts
import { z } from "zod";
import {
  cleanNameField,
  companyNameField,
  phoneField,
  optionalPhoneField,
  zipCodeField,
  emailField,
  requiredString,
} from "../utils/validation";

export const merchantSchema = z.object({
  /* ---------------- Basic Info ---------------- */

  corpName: z.string().optional(),

  companyName: companyNameField(),

  tranzpayIdentifier: requiredString("Tranzpay Identifier"),

  integration: z.string().optional(),

  /* ---------------- Address ---------------- */

  address1: requiredString("Address"),
  address2: z.string().optional(),

  city: cleanNameField("City"),

  state: requiredString("State"),

  zipCode: zipCodeField(),

  /* ---------------- Contact ---------------- */

  primaryPhone: phoneField("Primary phone"),

  secondaryPhone: optionalPhoneField(),

  email: emailField(),

  contactFirst: cleanNameField("First name"),

  contactLast: cleanNameField("Last name"),

  timeZone: requiredString("Time zone"),

  /* ---------------- Other ---------------- */

  addProducerToTrack: z.string().optional(),

  merchantId: z.number().optional(),
  mainProducerId: z.number().optional(),
  userStatus: z.boolean().optional(),
});

export type MerchantFormValues = z.infer<typeof merchantSchema>;

/* ---------------- Fee Configuration Schema ---------------- */

const feeConfigurationSchema = z
  .object({
    feeType: z.string().optional(),
    feeFormat: z.string().optional(),
    feeValue: z.number().optional(),
    batchCloseHours: z.number().optional(),
    batchCloseMinutes: z.number().optional(),
    batchCloseMeridiem: z.enum(["AM", "PM"]).optional(),
  })
  .superRefine((data, ctx) => {
    // ✅ safer check for "any field filled"
    const anyFieldFilled =
      data.feeType?.trim() ||
      data.feeFormat?.trim() ||
      data.feeValue != null ||
      data.batchCloseHours != null ||
      data.batchCloseMinutes != null ||
      data.batchCloseMeridiem;

    if (!anyFieldFilled) return;

    // ✅ required validations
    if (!data.feeType?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Fee Type is required",
        path: ["feeType"],
      });
    }

    if (!data.feeFormat?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Fee Format is required",
        path: ["feeFormat"],
      });
    }

    if (data.feeValue == null) {
      ctx.addIssue({
        code: "custom",
        message: "Fee Value is required",
        path: ["feeValue"],
      });
    }

    if (data.batchCloseHours == null) {
      ctx.addIssue({
        code: "custom",
        message: "Batch close hour required",
        path: ["batchCloseHours"],
      });
    }

    if (data.batchCloseMinutes == null) {
      ctx.addIssue({
        code: "custom",
        message: "Batch close minutes required",
        path: ["batchCloseMinutes"],
      });
    }

    if (!data.batchCloseMeridiem) {
      ctx.addIssue({
        code: "custom",
        message: "AM/PM required",
        path: ["batchCloseMeridiem"],
      });
    }
  });

/* ---------------- Payment Fees Schema ---------------- */

export const merchantPaymentFeesSchema = z.object({
  merchantId: z.number(),
  corporateId: z.number(),

  achFeeConfiguration: feeConfigurationSchema
    .nullable()
    .optional(),

  ccFeeConfiguration: feeConfigurationSchema
    .nullable()
    .optional(),
});

export type MerchantPaymentFeesValues =
  z.infer<typeof merchantPaymentFeesSchema>;

export type MerchantPaymentFeesFormValues =
  z.infer<typeof merchantPaymentFeesSchema>;