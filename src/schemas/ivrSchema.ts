import { z } from "zod";

const numberField = (label: string) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || Number.isNaN(val)) {
        return undefined;
      }
      return Number(val);
    },
    z
      .number({ message: `${label} is required` })
      .min(0, `${label} cannot be negative`)
  );

export const ivrFormSchema = z.object({
  status: z.enum(["Pending", "Active", "In-Active"], {
    message: "Status is required",
  }),

  allowAch: z.boolean(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only numbers"),

  callRate: numberField("Call rate"),
  minuteRate: numberField("Minute rate"),
  smsRate: numberField("SMS rate"),
  monthlyFee: numberField("Monthly fee"),
});

export type IvrFormValues = z.infer<typeof ivrFormSchema>;
