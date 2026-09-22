// src/utils/validators.test.ts

import { describe, it, expect } from "vitest";
import {
  trimmedString,
  numericString,
  nameField,
  cleanNameField,
  companyNameField,
  phoneField,
  optionalPhoneField,
  zipCodeField,
  emailField,
  requiredString,
} from "./validation";

describe("trimmedString", () => {
  it("should trim spaces", () => {
    const schema = trimmedString();

    expect(schema.parse("  Sai  ")).toBe("Sai");
  });
});

describe("numericString", () => {
  it("should remove non-digit characters", () => {
    const schema = numericString();

    expect(schema.parse("(123)-456-7890")).toBe(
      "1234567890"
    );
  });
});

describe("nameField", () => {
  const schema = nameField("First Name");

  it("should validate correct name", () => {
    expect(schema.parse("Sai Kiran")).toBe(
      "Sai Kiran"
    );
  });

  it("should throw error for empty value", () => {
    expect(() => schema.parse("")).toThrow(
      "First Name is required"
    );
  });

  it("should throw error for invalid characters", () => {
    expect(() => schema.parse("@@@")).toThrow(
      "Invalid First Name"
    );
  });

  it("should throw error for name longer than 60 characters", () => {
    expect(() =>
      schema.parse("a".repeat(61))
    ).toThrow(
      "First Name must be at most 60 characters"
    );
  });
});

describe("cleanNameField", () => {
  const schema = cleanNameField("Last Name");

  it("should trim and validate name", () => {
    expect(schema.parse("  Sai  ")).toBe(
      "Sai"
    );
  });
});

describe("companyNameField", () => {
  const schema = companyNameField();

  it("should validate company name", () => {
    expect(schema.parse("ABC Solutions")).toBe(
      "ABC Solutions"
    );
  });

  it("should throw error for invalid company name", () => {
    expect(() => schema.parse("@@@")).toThrow(
      "Invalid company name"
    );
  });

  it("should throw error for short company name", () => {
    expect(() => schema.parse("A")).toThrow(
      "Company name must be at least 2 characters"
    );
  });
});

describe("phoneField", () => {
  const schema = phoneField();

  it("should clean and validate phone number", () => {
    expect(schema.parse("(987)-654-3210")).toBe(
      "9876543210"
    );
  });

  it("should throw error for invalid phone number", () => {
    expect(() => schema.parse("12345")).toThrow(
      "Phone number must be exactly 10 digits"
    );
  });
});

describe("optionalPhoneField", () => {
  const schema = optionalPhoneField();

  it("should allow undefined", () => {
    expect(schema.parse(undefined)).toBeUndefined();
  });

  it("should allow empty string", () => {
    expect(schema.parse("")).toBe("");
  });

  it("should validate proper phone number", () => {
    expect(schema.parse("9876543210")).toBe(
      "9876543210"
    );
  });

  it("should clean formatted phone numbers", () => {
    expect(schema.parse("(987) 654-3210")).toBe(
      "9876543210"
    );
  });

  it("should throw error for invalid phone number", () => {
    expect(() => schema.parse("1234")).toThrow(
      "Phone number must be exactly 10 digits"
    );
  });
});

describe("zipCodeField", () => {
  const schema = zipCodeField();

  it("should clean and validate zip code", () => {
    expect(schema.parse("12-345")).toBe(
      "12345"
    );
  });

  it("should throw error for invalid zip code", () => {
    expect(() => schema.parse("123")).toThrow(
      "Zip Code must be exactly 5 digits"
    );
  });
});

describe("emailField", () => {
  const schema = emailField();

  it("should validate correct email", () => {
    expect(schema.parse("test@example.com")).toBe(
      "test@example.com"
    );
  });

  it("should throw error for invalid email", () => {
    expect(() => schema.parse("invalid-email")).toThrow(
      "Invalid email"
    );
  });
});

describe("requiredString", () => {
  const schema = requiredString("Username");

  it("should trim and validate string", () => {
    expect(schema.parse("  admin  ")).toBe(
      "admin"
    );
  });

  it("should throw error for empty string", () => {
    expect(() => schema.parse("   ")).toThrow(
      "Username is required"
    );
  });
});
