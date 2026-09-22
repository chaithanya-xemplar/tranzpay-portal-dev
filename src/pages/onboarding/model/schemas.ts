import { z } from "zod";
import {
  cleanNameField,
  emailField,
  optionalPhoneField,
  requiredString,
  zipCodeField,
} from "../../../utils/validation";

// Slice schemas cover field-level rules; cross-entity rules (ownership totals,
// rail/processor consistency, profile coverage) live in validateSession.ts.
// Schemas are validated imperatively — only the issues are consumed, never the
// transformed output.

const optionalEmail = () =>
  z
    .string()
    .refine((v) => v.trim() === "" || z.string().email().safeParse(v).success, {
      message: "Invalid email",
    });

const optionalUrl = () =>
  z.string().refine((v) => v.trim() === "" || /^https?:\/\/\S+\.\S+/.test(v.trim()), {
    message: "Enter a full URL (https://…)",
  });

// Unlike companyNameField(), legal entity names allow punctuation
// ("Acme Holdings, Inc.").
const legalNameField = (field: string) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(2, `${field} must be at least 2 characters`)
        .max(120, `${field} must be at most 120 characters`)
    );

const einField = () =>
  z
    .string()
    .min(1, "Federal Tax ID is required")
    .refine((v) => /^\d{2}-?\d{7}$/.test(v.trim()), {
      message: "Federal Tax ID must be 9 digits (12-3456789)",
    });

export const addressSchema = z.object({
  line1: requiredString("Address"),
  line2: z.string(),
  city: cleanNameField("City"),
  state: requiredString("State"),
  zip: zipCodeField(),
});

const requiredContactSchema = z.object({
  firstName: cleanNameField("First name"),
  lastName: cleanNameField("Last name"),
  title: z.string(),
  email: emailField(),
  phone: optionalPhoneField(),
});

// ── Account ───────────────────────────────────────────
export const accountSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    existing: z
      .object({ id: z.string(), name: z.string() })
      .passthrough()
      .nullable(),
    newAccount: z.object({
      name: z.string(),
      contact: z.object({
        firstName: z.string(),
        lastName: z.string(),
        title: z.string(),
        email: z.string(),
        phone: z.string(),
      }),
      address: z.object({
        line1: z.string(),
        line2: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "existing") {
      if (!data.existing) {
        ctx.addIssue({
          code: "custom",
          message: "An Account must be selected.",
          path: ["existing"],
        });
      }
      return;
    }
    const draft = data.newAccount;
    if (!draft.name.trim()) {
      ctx.addIssue({ code: "custom", message: "Enter a name for the new Account.", path: ["newAccount", "name"] });
    }
    const contactResult = requiredContactSchema.safeParse(draft.contact);
    if (!contactResult.success) {
      for (const issue of contactResult.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["newAccount", "contact", ...issue.path] });
      }
    }
    const addressResult = addressSchema.safeParse(draft.address);
    if (!addressResult.success) {
      for (const issue of addressResult.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["newAccount", "address", ...issue.path] });
      }
    }
  });

// ── Company ───────────────────────────────────────────
export const companySchema = z.object({
  legalName: legalNameField("Legal name"),
  alias: z.string(),
  federalTaxId: einField(),
  businessStartDate: z.string(),
  website: optionalUrl(),
  mccCode: z.string(),
  timezone: requiredString("Time zone"),
  mailingAddress: addressSchema,
  csPhone: optionalPhoneField(),
  csEmail: optionalEmail(),
  logo: z.string().nullable(),
});

// ── Owners ────────────────────────────────────────────
const ownershipPctField = () =>
  z
    .string()
    .min(1, "Ownership % is required")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Ownership must be greater than 0%",
    })
    .refine((v) => !Number.isFinite(Number(v)) || Number.isInteger(Number(v)), {
      message: "Ownership % must be a whole number",
    })
    .refine((v) => !Number.isFinite(Number(v)) || Number(v) <= 100, {
      message: "Ownership cannot exceed 100%",
    });

export const principalOwnerSchema = z.object({
  id: z.string(),
  kind: z.literal("principal"),
  fullName: legalNameField("Full name"),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string(),
  ownershipPct: ownershipPctField(),
  dob: requiredString("Date of birth"),
  ssn: z.string(),
  ssnLast4: z.string(),
  ssnProvided: z.boolean(),
  driversLicense: z.string(),
  homeAddress: addressSchema,
  contactEmail: emailField(),
  contactPhone: optionalPhoneField(),
  email: z.string(),
  phone: z.string(),
}).superRefine((data, ctx) => {
  if (!data.ssnProvided || data.ssnLast4.replace(/\D/g, "").length !== 4) {
    ctx.addIssue({ code: "custom", message: "SSN is required", path: ["ssn"] });
  }
});

export const parentCompanyOwnerSchema = z.object({
  id: z.string(),
  kind: z.literal("parentCompany"),
  name: legalNameField("Company name"),
  ein: einField(),
  ownershipPct: ownershipPctField(),
  address: addressSchema,
  contactName: z.string(),
  contactEmail: emailField(),
  contactPhone: optionalPhoneField(),
});

// validateSession picks the right schema per owner.kind — a discriminated
// union can't be used here because principalOwnerSchema carries a superRefine.

// ── Merchants ─────────────────────────────────────────
// Advanced settings are optional except the conditionals below; only the
// rule-bearing slices are modeled — everything else passes through.
const merchantAdvancedSchema = z
  .object({
    behavior: z
      .object({
        customPaylinkEnabled: z.boolean(),
        customPaylink: z.string(),
      })
      .passthrough(),
    apiCustomFields: z.array(z.string()).max(16, "At most 16 API custom fields (slots 5–20)"),
    achVerifi: z
      .object({
        enabled: z.boolean(),
        accountMode: z.enum(["default", "custom"]),
        username: z.string(),
        accountId: z.string(),
        password: z.string(),
        passwordSet: z.boolean(),
      })
      .passthrough(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.behavior.customPaylinkEnabled) {
      const slug = data.behavior.customPaylink.trim();
      if (!slug) {
        ctx.addIssue({
          code: "custom",
          message: "Paylink endpoint is required when Custom Paylink is enabled",
          path: ["behavior", "customPaylink"],
        });
      } else if (!/^[a-z0-9-]+$/.test(slug)) {
        ctx.addIssue({
          code: "custom",
          message: "Endpoint may only contain lowercase letters, numbers and dashes",
          path: ["behavior", "customPaylink"],
        });
      }
    }
    const verifi = data.achVerifi;
    if (verifi.enabled && verifi.accountMode === "custom") {
      if (!verifi.username.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "ACHVerifi username is required",
          path: ["achVerifi", "username"],
        });
      }
      if (!verifi.accountId.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "ACHVerifi account ID is required",
          path: ["achVerifi", "accountId"],
        });
      }
      if (!verifi.passwordSet && !verifi.password.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "ACHVerifi password is required",
          path: ["achVerifi", "password"],
        });
      }
    }
  });

export const merchantSchema = z
  .object({
    id: z.string(),
    dba: requiredString("DBA"),
    alias: requiredString("Alias"),
    useCompanyMailingAddress: z.boolean(),
    address: z.object({
      line1: z.string(),
      line2: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    }),
    phone: optionalPhoneField(),
    email: optionalEmail(),
    contactFirstName: z.string(),
    contactLastName: z.string(),
    processing: z.unknown(),
    advanced: merchantAdvancedSchema,
  })
  .superRefine((data, ctx) => {
    if (data.useCompanyMailingAddress) return;
    const result = addressSchema.safeParse(data.address);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["address", ...issue.path] });
      }
    }
  });

export const merchantsSchema = z.array(merchantSchema);

// ── Profiles ──────────────────────────────────────────
export const profileSchema = z.object({
  id: z.string(),
  merchantId: requiredString("Merchant"),
  label: requiredString("Label"),
  active: z.boolean(),
});

export const profilesSchema = z.array(profileSchema);

// ── Users ─────────────────────────────────────────────
export const userSchema = z.object({
  id: z.string(),
  firstName: cleanNameField("First name"),
  lastName: cleanNameField("Last name"),
  email: emailField(),
  templateId: requiredString("Profile template"),
  active: z.boolean(),
  apiAccess: z.boolean(),
  apiKey: z.string(),
});

export const usersSchema = z.array(userSchema);
