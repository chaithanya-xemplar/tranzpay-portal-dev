import { describe, it, expect } from "vitest";
import type { ZodType } from "zod";
import {
  createEmptySession,
  createMerchant,
  createParentCompany,
  createPrincipal,
  createUser,
} from "./defaults";
import {
  accountSchema,
  addressSchema,
  companySchema,
  merchantSchema,
  parentCompanyOwnerSchema,
  principalOwnerSchema,
  profileSchema,
  userSchema,
  usersSchema,
} from "./schemas";
import type { AddressValues, CompanySlice, OnboardingUser, ParentCompanyOwner, PrincipalOwner } from "./types";

function issues(schema: ZodType, value: unknown): { path: string; message: string }[] {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

function messageAt(schema: ZodType, value: unknown, path: string): string | undefined {
  return issues(schema, value).find((i) => i.path === path)?.message;
}

function validAddress(): AddressValues {
  return { line1: "1 Demo St", line2: "", city: "Charleston", state: "SC", zip: "29401" };
}

function validCompany(): CompanySlice {
  return {
    ...createEmptySession("Test User").company,
    legalName: "Acme Holdings, Inc.",
    federalTaxId: "12-3456789",
    mailingAddress: validAddress(),
  };
}

function validPrincipal(): PrincipalOwner {
  return {
    ...createPrincipal(),
    fullName: "Renee Park",
    firstName: "Renee",
    lastName: "Park",
    ownershipPct: "100",
    dob: "1985-06-15",
    ssn: "",
    ssnLast4: "0000",
    ssnProvided: true,
    homeAddress: validAddress(),
    contactEmail: "renee@example.com",
    email: "renee@example.com",
  };
}

function validParentCompany(): ParentCompanyOwner {
  return {
    ...createParentCompany(),
    name: "Atlas Holdings, Inc.",
    ein: "12-3456789",
    ownershipPct: "40",
    address: validAddress(),
    contactEmail: "ops@example.com",
  };
}

function validUser(): OnboardingUser {
  return createUser({
    firstName: "Alice",
    lastName: "Hawkins",
    email: "alice@example.com",
    templateId: "viewer",
    active: true,
  });
}

describe("addressSchema", () => {
  it("accepts a complete address and normalizes the zip", () => {
    const parsed = addressSchema.parse({ ...validAddress(), zip: "294-01" });
    expect(parsed.zip).toBe("29401");
  });

  it.each([
    ["line1", "", "Address is required"],
    ["city", "", "City is required"],
    ["state", "", "State is required"],
    ["zip", "123", "Zip Code must be exactly 5 digits"],
  ] as const)("rejects %s = %j", (field, value, message) => {
    expect(messageAt(addressSchema, { ...validAddress(), [field]: value }, field)).toBe(message);
  });

  it("allows an empty line2", () => {
    expect(addressSchema.safeParse(validAddress()).success).toBe(true);
  });
});

describe("accountSchema", () => {
  const emptyAccount = () => createEmptySession("Test User").account;

  it("requires a selection in existing mode", () => {
    expect(messageAt(accountSchema, emptyAccount(), "existing")).toBe("An Account must be selected.");
  });

  it("accepts existing mode once an account is selected, ignoring the blank draft", () => {
    const account = {
      ...emptyAccount(),
      existing: {
        id: "ACC-1",
        name: "Atlas Holdings",
        contact: { firstName: "A", lastName: "B", title: "", email: "a@example.com", phone: "" },
        address: validAddress(),
      },
    };
    expect(accountSchema.safeParse(account).success).toBe(true);
  });

  it("validates the new-account draft in new mode: name, contact, and address", () => {
    const account = { ...emptyAccount(), mode: "new" as const };
    const found = issues(accountSchema, account);
    expect(found.find((i) => i.path === "newAccount.name")?.message).toBe("Enter a name for the new Account.");
    expect(found.some((i) => i.path === "newAccount.contact.firstName")).toBe(true);
    expect(found.some((i) => i.path === "newAccount.contact.email")).toBe(true);
    expect(found.some((i) => i.path === "newAccount.address.line1")).toBe(true);
    // The unused existing selection is not flagged in new mode.
    expect(found.some((i) => i.path === "existing")).toBe(false);
  });

  it("accepts a fully-filled new-account draft", () => {
    const account = {
      ...emptyAccount(),
      mode: "new" as const,
      newAccount: {
        name: "Atlas Holdings",
        contact: { firstName: "Renee", lastName: "Park", title: "", email: "renee@example.com", phone: "5555550100" },
        address: validAddress(),
      },
    };
    expect(accountSchema.safeParse(account).success).toBe(true);
  });
});

describe("companySchema", () => {
  it("accepts a complete company", () => {
    expect(companySchema.safeParse(validCompany()).success).toBe(true);
  });

  describe("federalTaxId (EIN)", () => {
    it.each(["12-3456789", "123456789"])("accepts %s", (ein) => {
      expect(companySchema.safeParse({ ...validCompany(), federalTaxId: ein }).success).toBe(true);
    });

    it("requires a value", () => {
      expect(messageAt(companySchema, { ...validCompany(), federalTaxId: "" }, "federalTaxId")).toBe(
        "Federal Tax ID is required"
      );
    });

    it.each(["12-345678", "1-23456789", "12-34567890", "ab-cdefghi"])("rejects %s", (ein) => {
      expect(messageAt(companySchema, { ...validCompany(), federalTaxId: ein }, "federalTaxId")).toBe(
        "Federal Tax ID must be 9 digits (12-3456789)"
      );
    });
  });

  describe("legalName", () => {
    it("trims surrounding whitespace before checking length", () => {
      expect(messageAt(companySchema, { ...validCompany(), legalName: "  A  " }, "legalName")).toBe(
        "Legal name must be at least 2 characters"
      );
    });

    it("allows punctuation and rejects names above 120 characters", () => {
      expect(companySchema.safeParse({ ...validCompany(), legalName: "Acme & Sons, L.L.C. (Delaware)" }).success).toBe(true);
      expect(messageAt(companySchema, { ...validCompany(), legalName: "A".repeat(121) }, "legalName")).toBe(
        "Legal name must be at most 120 characters"
      );
    });
  });

  describe("optional website / customer-service email", () => {
    it.each(["", "https://example.com", "http://sub.example.com/path"])("accepts website %j", (website) => {
      expect(companySchema.safeParse({ ...validCompany(), website }).success).toBe(true);
    });

    it.each(["example.com", "ftp://example.com", "https://nodot"])("rejects website %j", (website) => {
      expect(messageAt(companySchema, { ...validCompany(), website }, "website")).toBe("Enter a full URL (https://…)");
    });

    it("accepts an empty csEmail but rejects a malformed one", () => {
      expect(companySchema.safeParse({ ...validCompany(), csEmail: "" }).success).toBe(true);
      expect(companySchema.safeParse({ ...validCompany(), csEmail: "cs@example.com" }).success).toBe(true);
      expect(messageAt(companySchema, { ...validCompany(), csEmail: "not-an-email" }, "csEmail")).toBe("Invalid email");
    });
  });
});

describe("principalOwnerSchema", () => {
  it("accepts a complete principal", () => {
    expect(principalOwnerSchema.safeParse(validPrincipal()).success).toBe(true);
  });

  it.each([
    ["fullName", "", "Full name must be at least 2 characters"],
    ["dob", "", "Date of birth is required"],
    ["contactEmail", "", "Invalid email"],
  ] as const)("requires %s", (field, value, message) => {
    expect(messageAt(principalOwnerSchema, { ...validPrincipal(), [field]: value }, field)).toBe(message);
  });

  describe("ownershipPct bounds", () => {
      it.each(["1", "50", "100"])("accepts %s", (pct) => {
        expect(principalOwnerSchema.safeParse({ ...validPrincipal(), ownershipPct: pct }).success).toBe(true);
      });

    it("requires a value", () => {
      expect(messageAt(principalOwnerSchema, { ...validPrincipal(), ownershipPct: "" }, "ownershipPct")).toBe(
        "Ownership % is required"
      );
    });

    it.each(["0", "-10", "abc"])("rejects %s as not greater than 0", (pct) => {
      expect(messageAt(principalOwnerSchema, { ...validPrincipal(), ownershipPct: pct }, "ownershipPct")).toBe(
        "Ownership must be greater than 0%"
      );
    });

      it.each(["0.01", "50.5", "100.01"])("rejects %s as not a whole number", (pct) => {
        expect(messageAt(principalOwnerSchema, { ...validPrincipal(), ownershipPct: pct }, "ownershipPct")).toBe(
          "Ownership % must be a whole number"
        );
      });

      it.each(["250"])("rejects %s as above 100", (pct) => {
        expect(messageAt(principalOwnerSchema, { ...validPrincipal(), ownershipPct: pct }, "ownershipPct")).toBe(
          "Ownership cannot exceed 100%"
        );
    });
  });

  describe("SSN conditional", () => {
    it("requires a last-four SSN value when none was previously provided", () => {
      expect(
        messageAt(principalOwnerSchema, { ...validPrincipal(), ssnLast4: "", ssnProvided: false }, "ssn")
      ).toBe("SSN is required");
    });

    it("accepts a stored SSN last-four value", () => {
      expect(
        principalOwnerSchema.safeParse({ ...validPrincipal(), ssn: "", ssnLast4: "0000", ssnProvided: true }).success
      ).toBe(true);
    });
  });
});

describe("parentCompanyOwnerSchema", () => {
  it("accepts a complete parent company", () => {
    expect(parentCompanyOwnerSchema.safeParse(validParentCompany()).success).toBe(true);
  });

  it.each([
    ["name", "", "Company name must be at least 2 characters"],
    ["ein", "12-34", "Federal Tax ID must be 9 digits (12-3456789)"],
    ["ownershipPct", "0", "Ownership must be greater than 0%"],
    ["contactEmail", "nope", "Invalid email"],
  ] as const)("rejects %s = %j", (field, value, message) => {
    expect(messageAt(parentCompanyOwnerSchema, { ...validParentCompany(), [field]: value }, field)).toBe(message);
  });
});

describe("merchantSchema", () => {
  it("accepts a freshly-created merchant with default advanced settings", () => {
    expect(merchantSchema.safeParse(createMerchant("Coastline Wellness", "coastline")).success).toBe(true);
  });

  it.each([
    ["dba", "DBA is required"],
    ["alias", "Alias is required"],
  ] as const)("requires %s", (field, message) => {
    const merchant = { ...createMerchant("Coastline Wellness", "coastline"), [field]: "" };
    expect(messageAt(merchantSchema, merchant, field)).toBe(message);
  });

  it("skips address validation while the company mailing address is reused", () => {
    const merchant = createMerchant("Coastline Wellness", "coastline");
    expect(merchant.address.line1).toBe("");
    expect(merchantSchema.safeParse(merchant).success).toBe(true);
  });

  it("validates the merchant address once useCompanyMailingAddress is off", () => {
    const merchant = { ...createMerchant("Coastline Wellness", "coastline"), useCompanyMailingAddress: false };
    const found = issues(merchantSchema, merchant);
    expect(found.find((i) => i.path === "address.line1")?.message).toBe("Address is required");
    expect(found.some((i) => i.path === "address.zip")).toBe(true);

    merchant.address = validAddress();
    expect(merchantSchema.safeParse(merchant).success).toBe(true);
  });

  describe("advanced: custom paylink", () => {
    function withPaylink(slug: string) {
      const merchant = createMerchant("Coastline Wellness", "coastline");
      merchant.advanced.behavior.customPaylinkEnabled = true;
      merchant.advanced.behavior.customPaylink = slug;
      return merchant;
    }

    it("requires the slug only while the toggle is on", () => {
      expect(messageAt(merchantSchema, withPaylink(""), "advanced.behavior.customPaylink")).toBe(
        "Paylink endpoint is required when Custom Paylink is enabled"
      );
      const off = createMerchant("Coastline Wellness", "coastline");
      expect(merchantSchema.safeParse(off).success).toBe(true);
    });

    it.each(["Bad Slug!", "UPPER", "slash/y", "space slug"])("rejects slug %j", (slug) => {
      expect(messageAt(merchantSchema, withPaylink(slug), "advanced.behavior.customPaylink")).toBe(
        "Endpoint may only contain lowercase letters, numbers and dashes"
      );
    });

    it.each(["coastline-wellness", "pay2", "a-1-b"])("accepts slug %j", (slug) => {
      expect(merchantSchema.safeParse(withPaylink(slug)).success).toBe(true);
    });
  });

  describe("advanced: ACHVerifi conditionals", () => {
    function withVerifi(overrides: Partial<ReturnType<typeof createMerchant>["advanced"]["achVerifi"]>) {
      const merchant = createMerchant("Coastline Wellness", "coastline");
      merchant.advanced.achVerifi = { ...merchant.advanced.achVerifi, ...overrides };
      return merchant;
    }

    it("requires no credentials when disabled or on the default account", () => {
      expect(merchantSchema.safeParse(withVerifi({ enabled: false, accountMode: "custom" })).success).toBe(true);
      expect(merchantSchema.safeParse(withVerifi({ enabled: true, accountMode: "default" })).success).toBe(true);
    });

    it("requires username, account ID, and password for an enabled custom account", () => {
      const found = issues(merchantSchema, withVerifi({ enabled: true, accountMode: "custom" }));
      expect(found.find((i) => i.path === "advanced.achVerifi.username")?.message).toBe("ACHVerifi username is required");
      expect(found.find((i) => i.path === "advanced.achVerifi.accountId")?.message).toBe("ACHVerifi account ID is required");
      expect(found.find((i) => i.path === "advanced.achVerifi.password")?.message).toBe("ACHVerifi password is required");
    });

    it("treats passwordSet as satisfying the password requirement", () => {
      const merchant = withVerifi({
        enabled: true,
        accountMode: "custom",
        username: "verifi-user",
        accountId: "ACC-000000",
        password: "",
        passwordSet: true,
      });
      expect(merchantSchema.safeParse(merchant).success).toBe(true);
    });
  });

  describe("advanced: apiCustomFields", () => {
    it("accepts up to 16 string entries", () => {
      const merchant = createMerchant("Coastline Wellness", "coastline");
      merchant.advanced.apiCustomFields = Array.from({ length: 16 }, (_, i) => `Field ${i + 5}`);
      expect(merchantSchema.safeParse(merchant).success).toBe(true);
    });

    it("rejects a 17th entry", () => {
      const merchant = createMerchant("Coastline Wellness", "coastline");
      merchant.advanced.apiCustomFields = Array.from({ length: 17 }, (_, i) => `Field ${i + 5}`);
      expect(messageAt(merchantSchema, merchant, "advanced.apiCustomFields")).toBe(
        "At most 16 API custom fields (slots 5–20)"
      );
    });

    it("rejects non-string entries", () => {
      const merchant: Record<string, unknown> = { ...createMerchant("Coastline Wellness", "coastline") };
      merchant.advanced = {
        ...(merchant.advanced as Record<string, unknown>),
        apiCustomFields: [42],
      };
      expect(issues(merchantSchema, merchant).some((i) => i.path === "advanced.apiCustomFields.0")).toBe(true);
    });
  });
});

describe("profileSchema", () => {
  it("requires a merchant assignment and a label", () => {
    const found = issues(profileSchema, { id: "p1", merchantId: "", label: " ", active: true });
    expect(found.find((i) => i.path === "merchantId")?.message).toBe("Merchant is required");
    expect(found.find((i) => i.path === "label")?.message).toBe("Label is required");
  });
});

describe("userSchema / usersSchema", () => {
  it("accepts a valid user", () => {
    expect(userSchema.safeParse(validUser()).success).toBe(true);
  });

  it.each([
    ["email", "not-an-email", "Invalid email"],
    ["templateId", "", "Profile template is required"],
    ["firstName", "@@@", "Invalid First name"],
    ["lastName", "", "Last name is required"],
  ] as const)("rejects %s = %j", (field, value, message) => {
    expect(messageAt(userSchema, { ...validUser(), [field]: value }, field)).toBe(message);
  });

  it("usersSchema validates each element with its index in the path", () => {
    const users = [validUser(), { ...validUser(), email: "bad" }];
    expect(messageAt(usersSchema, users, "1.email")).toBe("Invalid email");
    expect(usersSchema.safeParse([validUser()]).success).toBe(true);
    expect(usersSchema.safeParse([]).success).toBe(true);
  });
});
