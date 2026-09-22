import { z } from "zod";

export const globalProcessorSchema = z.object({
  processorName: z.string().min(2, "Processor name is required"),

  identifier: z.string().min(2, "Identifier is required"),

  /* ✅ Multi Payment Types */
  paymentTypes: z
    .array(z.enum(["ACH", "CC"]))
    .min(1, "Select at least one payment type"),

  // baseUrl: z.string().url("Base URL must be valid"),
  baseUrl: z.string().url("Base URL must be valid"),

  /* ✅ FirstData Extra */
  groupId: z.string().optional(),

  tppIds: z.array(z.string()).optional(),
});

export type GlobalProcessorConfigFormType =
  z.infer<typeof globalProcessorSchema>;
