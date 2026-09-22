import { z } from "zod";
import { optionalPhoneField, phoneField } from "../utils/validation";

export const contactInformationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Invalid zip code"),
  primaryPhone: phoneField("Primary phone"),
  secondaryPhone: optionalPhoneField(),
  timeZone: z.string()
});

export type ContactInformationValues = z.infer<typeof contactInformationSchema>;
