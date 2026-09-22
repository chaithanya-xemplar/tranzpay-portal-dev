import { z } from "zod";
import {
  companyNameField,
  nameField,
  phoneField,
  optionalPhoneField,
  zipCodeField,
  emailField,
  requiredString,
  cleanNameField,
} from "../utils/validation";

export const corpSchema = z.object({
  companyName: companyNameField(),

  address1: requiredString("Address"),
  address2: z.string().optional(),

  city: nameField("City"),
  state: z.string().min(2, "Select a valid state"),

  zipCode: zipCodeField(),

  primaryPhone: phoneField("Primary phone"),
  secondaryPhone: optionalPhoneField(),

  contactFirstName: cleanNameField("First name"),
  contactLastName: cleanNameField("Last name"),

  email: emailField(),

  timeZone: requiredString("Time Zone"),

  userStatus: z.boolean().optional(),
  corporateId: z.number().optional(),
});

export type CorpFormValues = z.infer<typeof corpSchema>;