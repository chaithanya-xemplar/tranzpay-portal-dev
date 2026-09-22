import { describe, it, expect } from "vitest";
import { DEFAULT_REFUND_POLICY_HTML, VIEW_CONTROL_FIELDS, VIEW_SURFACES } from "./constants";
import {
  createAdvancedSettings,
  createDefaultProfile,
  createEmptySession,
  createMerchant,
  createParentCompany,
  createPrincipal,
  createProcessorEntry,
  createProfile,
  createUser,
  generateApiKey,
  generateId,
  sessionShortCode,
} from "./defaults";

describe("generateId", () => {
  it("prefixes a UUID with the given prefix and an underscore", () => {
    expect(generateId("mer")).toMatch(/^mer_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("generates unique ids across calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId("onb")));
    expect(ids.size).toBe(50);
  });
});

describe("generateApiKey", () => {
  it("uses the sk_pending_ placeholder prefix with a 16-char alphanumeric suffix", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^sk_pending_[a-zA-Z0-9]{16}$/);
  });

  it("generates unique keys across calls", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey()));
    expect(keys.size).toBe(50);
  });
});

describe("sessionShortCode", () => {
  it("derives OS-XXXXXX from the id, dropping the onb_ prefix and dashes", () => {
    expect(sessionShortCode("onb_3f2a9c11-aaaa-bbbb-cccc-000000000000")).toBe("OS-3F2A9C");
  });

  it("is stable for the same id", () => {
    const id = generateId("onb");
    expect(sessionShortCode(id)).toBe(sessionShortCode(id));
  });

  it("uppercases and truncates ids without the onb_ prefix", () => {
    expect(sessionShortCode("ab-cd-ef-01")).toBe("OS-ABCDEF");
  });
});

describe("createEmptySession", () => {
  it("starts as a draft on the account step with nothing visited", () => {
    const session = createEmptySession("Test User");
    expect(session.version).toBe(1);
    expect(session.status).toBe("draft");
    expect(session.startedBy).toBe("Test User");
    expect(session.currentStepId).toBe("account");
    expect(session.visitedSteps).toEqual([]);
    expect(session.id).toMatch(/^onb_/);
  });

  it("starts with no owners, merchants, profiles, or users", () => {
    const session = createEmptySession("Test User");
    expect(session.owners).toEqual([]);
    expect(session.merchants).toEqual([]);
    expect(session.profiles).toEqual([]);
    expect(session.users).toEqual([]);
  });

  it("defaults account mode to existing with an empty new-account draft", () => {
    const { account } = createEmptySession("Test User");
    expect(account.mode).toBe("existing");
    expect(account.existing).toBeNull();
    expect(account.newAccount.name).toBe("");
    expect(account.newAccount.address).toEqual({ line1: "", line2: "", city: "", state: "", zip: "" });
  });

  it("stamps createdAt/updatedAt with the same ISO timestamp and a default timezone", () => {
    const session = createEmptySession("Test User");
    expect(session.createdAt).toBe(session.updatedAt);
    expect(new Date(session.createdAt).toISOString()).toBe(session.createdAt);
    expect(session.company.timezone).toBe("America/Los_Angeles");
  });
});

describe("createMerchant", () => {
  it("sets dba/alias and defaults to the company mailing address", () => {
    const merchant = createMerchant("Coastline Wellness", "coastline");
    expect(merchant.id).toMatch(/^mer_/);
    expect(merchant.dba).toBe("Coastline Wellness");
    expect(merchant.alias).toBe("coastline");
    expect(merchant.useCompanyMailingAddress).toBe(true);
  });

  it("wires processing defaults: both rails enabled, no processors, empty priorities", () => {
    const { processing } = createMerchant("Coastline Wellness", "coastline");
    expect(processing.mid).toBe("");
    expect(processing.cc.enabled).toBe(true);
    expect(processing.ach.enabled).toBe(true);
    expect(processing.cc.batchClose).toEqual({ hour: "11", minute: "00", meridiem: "PM" });
    expect(processing.ach.batchClose).toEqual({ hour: "04", minute: "00", meridiem: "PM" });
    expect(processing.processors).toEqual([]);
    expect(processing.priority).toEqual({ cc: [], ach: [] });
  });

  it("attaches fully-shaped default advanced settings", () => {
    const merchant = createMerchant("Coastline Wellness", "coastline");
    expect(merchant.advanced).toEqual(createAdvancedSettings());
  });
});

describe("createAdvancedSettings", () => {
  it("creates exactly 4 CC and 4 ACH custom-field slots and no API custom fields", () => {
    const advanced = createAdvancedSettings();
    expect(advanced.ccCustomFields).toHaveLength(4);
    expect(advanced.achCustomFields).toHaveLength(4);
    expect(advanced.ccCustomFields.every((f) => f.en === "" && f.es === "" && !f.required)).toBe(true);
    expect(advanced.apiCustomFields).toEqual([]);
  });

  it("creates a view-control entry for every surface and field", () => {
    const { viewControls } = createAdvancedSettings();
    for (const surface of VIEW_SURFACES) {
      for (const field of VIEW_CONTROL_FIELDS) {
        expect(typeof viewControls[surface.key][field.key], `${surface.key}.${field.key}`).toBe("boolean");
      }
    }
  });

  it.each([
    ["paylink", ["displayDescription", "displayPciMessage"]],
    ["hosted", ["disableCcGraphic", "displayZip", "displayLogo"]],
    ["vt", ["displayZip", "displayLogo"]],
    ["vault3p", []],
  ] as const)("enables only the prototype defaults on %s", (surface, enabledFields) => {
    const controls = createAdvancedSettings().viewControls[surface];
    const enabled = VIEW_CONTROL_FIELDS.filter((f) => controls[f.key]).map((f) => f.key);
    expect(enabled).toEqual(enabledFields);
  });

  it("defaults behavior and ACHVerifi to safe values", () => {
    const advanced = createAdvancedSettings();
    expect(advanced.behavior.customPaylinkEnabled).toBe(false);
    expect(advanced.behavior.requireCvv).toBe(true);
    expect(advanced.behavior.requireTypedSignature).toBe(true);
    expect(advanced.behavior.sharedVault).toBe(false);
    expect(advanced.achVerifi).toEqual({
      enabled: false,
      accountMode: "default",
      username: "",
      accountId: "",
      password: "",
      passwordSet: false,
    });
    expect(advanced.requiredFields).toEqual(["First Name", "Last Name", "Email", "Phone"]);
    expect(advanced.refundPolicy).toBe(DEFAULT_REFUND_POLICY_HTML);
  });
});

describe("createProcessorEntry", () => {
  it("starts disabled with no rails, no code, and no stored password", () => {
    const entry = createProcessorEntry();
    expect(entry.id).toMatch(/^proc_/);
    expect(entry.processorCode).toBe("");
    expect(entry.enabled).toBe(false);
    expect(entry.rails).toEqual({ cc: false, ach: false });
    expect(entry.password).toBe("");
    expect(entry.passwordSet).toBe(false);
  });
});

describe("profiles", () => {
  it("createDefaultProfile labels from the merchant dba and stays active", () => {
    const merchant = createMerchant("Coastline Wellness", "coastline");
    const profile = createDefaultProfile(merchant);
    expect(profile.merchantId).toBe(merchant.id);
    expect(profile.label).toBe("Coastline Wellness Default");
    expect(profile.active).toBe(true);
  });

  it("createDefaultProfile falls back to 'Default' when the dba is empty", () => {
    const merchant = createMerchant("", "");
    expect(createDefaultProfile(merchant).label).toBe("Default");
  });

  it("createProfile creates an active, unlabeled profile bound to the merchant", () => {
    const profile = createProfile("mer_x");
    expect(profile).toMatchObject({ merchantId: "mer_x", label: "", active: true });
    expect(profile.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("owner and user factories", () => {
  it("createPrincipal returns an empty principal owner", () => {
    const owner = createPrincipal();
    expect(owner.id).toMatch(/^own_/);
    expect(owner.kind).toBe("principal");
    expect(owner.ssn).toBe("");
    expect(owner.ssnProvided).toBe(false);
  });

  it("createParentCompany returns an empty parent-company owner", () => {
    const owner = createParentCompany();
    expect(owner.id).toMatch(/^own_/);
    expect(owner.kind).toBe("parentCompany");
    expect(owner.ein).toBe("");
  });

  it("createUser copies the given fields and disables API access", () => {
    const user = createUser({
      firstName: "Alice",
      lastName: "Hawkins",
      email: "alice@example.com",
      templateId: "viewer",
      active: true,
    });
    expect(user.id).toMatch(/^usr_/);
    expect(user.email).toBe("alice@example.com");
    expect(user.apiAccess).toBe(false);
    expect(user.apiKey).toBe("");
  });
});
