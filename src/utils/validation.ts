import { z } from "zod";

/* ---------------- Regex ---------------- */

export const nameRegex = /^(?=.*[\p{L}\p{N}])[\p{L}\p{M}\p{N}\s'-]+$/u;
export const digitsOnly = /^\d+$/;

/* ---------------- Base Transformers ---------------- */

// Trim spaces
export const trimmedString = () =>
  z.string().transform((val) => val.trim());

// Remove non-digits
export const numericString = () =>
  z.string().transform((val) => val.replace(/\D/g, ""));

/* ---------------- Reusable Validators ---------------- */

// Name field
export const nameField = (field: string) =>
  z
    .string()
    .min(1, `${field} is required`)
    .max(60, `${field} must be at most 60 characters`)
    .regex(nameRegex, `Invalid ${field}`);

// Clean + validate name (BEST PRACTICE)
export const cleanNameField = (field: string) =>
  trimmedString().pipe(nameField(field));

// Company name
export const companyNameField = () =>
  z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(60, "Company name must be at most 60 characters")
    .regex(nameRegex, "Invalid company name");

// Phone
export const phoneField = (field = "Phone number") =>
  z
    .string()
    .transform((val) => val.replace(/\D/g, "")) // auto-clean
    .pipe(
      z
        .string()
        .length(10, `${field} must be exactly 10 digits`)
        .regex(digitsOnly, `${field} must contain only numbers`)
    );

// Optional phone
export const optionalPhoneField = () =>
  z
    .string()
    .transform((val) => {
      if (val.trim() === "") return "";
      return val.replace(/\D/g, "");
    })
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // ✅ allow empty

        return val.length === 10;
      },
      {
        message: "Phone number must be exactly 10 digits",
      }
    )
    .optional();

// Zip
export const zipCodeField = () =>
  z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .length(5, "Zip Code must be exactly 5 digits")
        .regex(digitsOnly, "Zip Code must contain only numbers")
    );

// Email
export const emailField = () =>
  z.string().email("Invalid email");

// Required string
export const requiredString = (field: string) =>
  trimmedString().pipe(
    z.string().min(1, `${field} is required`)
  );
