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

export const producerSchema = z.object({
  /* ---------------- IDs ---------------- */

  producerId: z.number().optional(),
  mainProducerId: z.number().optional(),
  merchantId: z.number().optional(),
  corporateId: z.number().optional(),

  /* ---------------- Status ---------------- */

  userStatus: z.boolean(),

  /* ---------------- Company ---------------- */

  companyName: companyNameField(),

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

  /* ---------------- Other ---------------- */

  timeZone: requiredString("Time zone"),

  tranzPayIdentifier: requiredString("Tranzpay Identifier"),

  addProducerToTrack: z.string().optional(),
});

export type ProducerFormValues = z.infer<typeof producerSchema>;