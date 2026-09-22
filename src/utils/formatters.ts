// src/utils/formatters.ts

/* ------------------------------------------------------------------ */
/* Number Formatter (base)                                            */
/* ------------------------------------------------------------------ */

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat(undefined, options).format(value);
};

/* ------------------------------------------------------------------ */
/* Currency Formatter                                                 */
/* ------------------------------------------------------------------ */

export const formatCurrency = (
  value: number,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
) => {
  const {
    currency = "USD",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

/* ------------------------------------------------------------------ */
/* Percentage Formatter                                               */
/* ------------------------------------------------------------------ */

export const formatPercentage = (
  value: number,
  options?: {
    absolute?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
) => {
  const {
    absolute = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options || {};

  const val = absolute ? Math.abs(value) : value;

  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(val / 100);
};

/* ------------------------------------------------------------------ */
/* Compact Number (1K, 1M, etc.)                                      */
/* ------------------------------------------------------------------ */

export const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

/* ------------------------------------------------------------------ */
/* Phone Formatter                                                    */
/* ------------------------------------------------------------------ */

export const formatPhoneNumber = (value: string) => {
  const rawDigits = value.replace(/\D/g, "");
  const digits =
    rawDigits.length === 11 && rawDigits.startsWith("1")
      ? rawDigits.slice(1)
      : rawDigits;

  if (rawDigits.length > 10 && digits.length !== 10) return value;

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");

export const formatIntegerInput = (value: string) => value.replace(/\D/g, "");

/* ------------------------------------------------------------------ */
/* Account Number Masking                                             */
/* ------------------------------------------------------------------ */

/**
 * "123456789" → "••••6789". Bank account and routing numbers must never be
 * rendered or logged in full, so only the last 4 digits survive.
 *
 * Values of 4 digits or fewer are masked entirely rather than passed through —
 * a short value would otherwise be revealed completely. Empty/nullish input
 * returns "" so callers can render their own placeholder.
 */
export const maskAccountNumber = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "";

  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";

  const bullets = "•".repeat(4);

  return digits.length <= 4 ? bullets : `${bullets}${digits.slice(-4)}`;
};

/* ------------------------------------------------------------------ */
/* Custom Suffix Formatter (fallback % without Intl)                  */
/* ------------------------------------------------------------------ */

export const formatWithSuffix = (
  value: number,
  suffix: string,
  options?: {
    absolute?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
) => {
  const {
    absolute = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options || {};

  const val = absolute ? Math.abs(value) : value;

  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(val);

  return `${formatted}${suffix}`;
};

/* ------------------------------------------------------------------ */
/* Countdown Formatter (M:SS)                                          */
/* ------------------------------------------------------------------ */

/** 1_797_000 → "29:57". Sub-second remainders round up so a live countdown never shows 0:00 early. */
export const formatMsAsMinSec = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};
