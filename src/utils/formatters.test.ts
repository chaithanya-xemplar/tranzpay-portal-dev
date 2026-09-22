import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatIntegerInput,
  formatPhoneNumber,
  normalizePhoneNumber,
  formatWithSuffix,
  formatMsAsMinSec,
  maskAccountNumber,
} from "./formatters";

/**
 * All expectations are computed via Intl.NumberFormat with the same locale
 * (undefined = runtime default) so the tests are locale-independent —
 * never hardcode thousands/decimal separators or currency symbols.
 */

describe("formatNumber", () => {
  it("formats with the default locale and no options", () => {
    const expected = new Intl.NumberFormat(undefined).format(1234567.89);
    expect(formatNumber(1234567.89)).toBe(expected);
  });

  it("passes Intl options through", () => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    };
    const expected = new Intl.NumberFormat(undefined, options).format(5);
    expect(formatNumber(5, options)).toBe(expected);
  });
});

describe("formatCurrency", () => {
  it("defaults to USD with 2 fraction digits", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.5);
    expect(formatCurrency(1234.5)).toBe(expected);
  });

  it("honors custom currency and fraction digits", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(1234.5);
    expect(
      formatCurrency(1234.5, {
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    ).toBe(expected);
    // A different currency must produce a different string than USD.
    expect(formatCurrency(10, { currency: "EUR" })).not.toBe(formatCurrency(10));
  });
});

describe("formatPercentage", () => {
  const percentExpected = (
    value: number,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  ) =>
    new Intl.NumberFormat(undefined, {
      style: "percent",
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);

  it("divides by 100 (50 renders as fifty percent, not 5000%)", () => {
    expect(formatPercentage(50)).toBe(percentExpected(0.5));
  });

  it("takes the absolute value by default", () => {
    expect(formatPercentage(-25)).toBe(percentExpected(0.25));
    expect(formatPercentage(-25)).toBe(formatPercentage(25));
  });

  it("keeps the sign when absolute is false", () => {
    expect(formatPercentage(-25, { absolute: false })).toBe(
      percentExpected(-0.25)
    );
  });

  it("honors custom fraction digits", () => {
    expect(
      formatPercentage(12.345, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    ).toBe(percentExpected(0.12345, 1, 1));
  });
});

describe("formatCompactNumber", () => {
  const compactExpected = (value: number) =>
    new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

  it("compacts thousands and millions with at most 1 fraction digit", () => {
    expect(formatCompactNumber(1000)).toBe(compactExpected(1000));
    expect(formatCompactNumber(1_500_000)).toBe(compactExpected(1_500_000));
    // Compact output must be shorter than the plain-formatted number.
    expect(formatCompactNumber(1_500_000).length).toBeLessThan(
      new Intl.NumberFormat(undefined).format(1_500_000).length
    );
  });

  it("passes small values (<1000) through unchanged", () => {
    expect(formatCompactNumber(999)).toBe(
      new Intl.NumberFormat(undefined).format(999)
    );
    expect(formatCompactNumber(0)).toBe(
      new Intl.NumberFormat(undefined).format(0)
    );
  });
});

describe("formatPhoneNumber", () => {
  it("formats a 10 digit US phone number", () => {
    expect(formatPhoneNumber("8435550142")).toBe("(843) 555-0142");
  });

  it("formats leading-country-code US phone numbers", () => {
    expect(formatPhoneNumber("+1 (843) 555-0142")).toBe("(843) 555-0142");
  });

  it("passes through longer values unchanged", () => {
    expect(formatPhoneNumber("+1 (843) 555-0142 ext 99")).toBe("+1 (843) 555-0142 ext 99");
    expect(formatPhoneNumber("843555014299")).toBe("843555014299");
  });

  it("supports partial input while typing", () => {
    expect(formatPhoneNumber("843")).toBe("843");
    expect(formatPhoneNumber("8435")).toBe("(843) 5");
    expect(formatPhoneNumber("843555")).toBe("(843) 555");
  });
});

describe("formatIntegerInput", () => {
  it("keeps only digits", () => {
    expect(formatIntegerInput("12.5%")).toBe("125");
    expect(formatIntegerInput("abc 40")).toBe("40");
  });
});

describe("normalizePhoneNumber", () => {
  it("keeps only digits", () => {
    expect(normalizePhoneNumber("(843) 555-0142")).toBe("8435550142");
    expect(normalizePhoneNumber("+1 843 555 0142 ext 99")).toBe("1843555014299");
  });
});

describe("maskAccountNumber", () => {
  it("reveals only the last 4 digits", () => {
    expect(maskAccountNumber("123456789")).toBe("••••6789");
    expect(maskAccountNumber("000123456789012")).toBe("••••9012");
  });

  it("masks short values entirely rather than exposing them", () => {
    expect(maskAccountNumber("1234")).toBe("••••");
    expect(maskAccountNumber("7")).toBe("••••");
  });

  it("strips separators before taking the last 4 digits", () => {
    expect(maskAccountNumber("1234-5678-9012")).toBe("••••9012");
    expect(maskAccountNumber(" 021 000 021 ")).toBe("••••0021");
  });

  it("accepts numeric input", () => {
    expect(maskAccountNumber(123456789)).toBe("••••6789");
  });

  it("returns an empty string for nullish or digitless input", () => {
    expect(maskAccountNumber(null)).toBe("");
    expect(maskAccountNumber(undefined)).toBe("");
    expect(maskAccountNumber("")).toBe("");
    expect(maskAccountNumber("N/A")).toBe("");
  });

  it("never returns any digit from the masked portion", () => {
    expect(maskAccountNumber("987654321")).not.toContain("98765");
  });
});

describe("formatWithSuffix", () => {
  const plainExpected = (
    value: number,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  ) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);

  it("appends the suffix and takes the absolute value by default", () => {
    expect(formatWithSuffix(-12.345, "%")).toBe(`${plainExpected(12.345)}%`);
  });

  it("keeps the sign when absolute is false and honors fraction digits", () => {
    expect(formatWithSuffix(-5, "%", { absolute: false })).toBe(
      `${plainExpected(-5)}%`
    );
    expect(
      formatWithSuffix(1.5, " bps", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    ).toBe(`${plainExpected(1.5, 2, 2)} bps`);
  });
});

describe("formatMsAsMinSec", () => {
  it("formats zero and negative values as 0:00", () => {
    expect(formatMsAsMinSec(0)).toBe("0:00");
    expect(formatMsAsMinSec(-500)).toBe("0:00");
  });

  it("rounds sub-second remainders up so a countdown never shows 0:00 early", () => {
    expect(formatMsAsMinSec(500)).toBe("0:01");
    expect(formatMsAsMinSec(59_001)).toBe("1:00");
  });

  it("formats minute:second with zero-padded seconds", () => {
    expect(formatMsAsMinSec(1_797_000)).toBe("29:57");
    expect(formatMsAsMinSec(9_000)).toBe("0:09");
  });

  it("does not roll minutes into hours (matches the 30-min lockout scale)", () => {
    expect(formatMsAsMinSec(61 * 60_000)).toBe("61:00");
  });
});
