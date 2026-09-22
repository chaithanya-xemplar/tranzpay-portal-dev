import { describe, it, expect } from "vitest";
import {
  createDefaultProfile,
  createEmptySession,
  createMerchant,
  createParentCompany,
  createPrincipal,
  createProcessorEntry,
  createUser,
} from "./defaults";
import type { OnboardingSession, PrincipalOwner } from "./types";
import { validateSession } from "./validateSession";

function filledPrincipal(pct: string): PrincipalOwner {
  return {
    ...createPrincipal(),
    fullName: "Renee Park",
    firstName: "Renee",
    lastName: "Park",
    ownershipPct: pct,
    dob: "1985-06-15",
    ssn: "123-45-6789",
    ssnLast4: "6789",
    ssnProvided: true,
    homeAddress: { line1: "1 Demo St", line2: "", city: "Charleston", state: "SC", zip: "29401" },
    contactEmail: "renee@example.com",
    email: "renee@example.com",
  };
}

/** A session that passes every rule — the baseline for targeted breakage. */
function completeSession(): OnboardingSession {
  const session = createEmptySession("Test User");
  session.account = {
    mode: "existing",
    existing: {
      id: "ACC-1",
      name: "Atlas Holdings",
      contact: { firstName: "A", lastName: "B", title: "", email: "a@b.com", phone: "" },
      address: { line1: "1 Main", line2: "", city: "Austin", state: "TX", zip: "78701" },
    },
    newAccount: session.account.newAccount,
  };
  session.company = {
    ...session.company,
    legalName: "Acme Holdings, Inc.",
    federalTaxId: "12-3456789",
    mailingAddress: { line1: "1 Main", line2: "", city: "Austin", state: "TX", zip: "78701" },
  };
  session.owners = [filledPrincipal("100")];

  const merchant = createMerchant("Coastline Wellness", "coastline");
  merchant.processing.mid = "1234567890";
  const processor = {
    ...createProcessorEntry(),
    processorCode: "PXP" as const,
    rails: { cc: true, ach: true },
    enabled: true,
  };
  merchant.processing.processors = [processor];
  merchant.processing.priority = { cc: [processor.id], ach: [processor.id] };
  session.merchants = [merchant];
  session.profiles = [createDefaultProfile(merchant)];
  session.users = [
    createUser({
      firstName: "Alice",
      lastName: "Hawkins",
      email: "alice@example.com",
      templateId: "treasury-manager",
      active: true,
    }),
  ];
  return session;
}

describe("validateSession", () => {
  it("flags every step on an empty session, but review is idle", () => {
    const v = validateSession(createEmptySession("Test User"));
    expect(v.isComplete).toBe(false);
    for (const step of ["account", "company", "owners", "merchants", "processing", "profiles", "users"] as const) {
      expect(v.byStep[step]?.length, step).toBeGreaterThan(0);
    }
    expect(v.stepStatus.review).toBe("idle");
  });

  it("marks untouched steps idle, not error", () => {
    const v = validateSession(createEmptySession("Test User"));
    // account is visited by default (currentStep), so it may error; company is untouched
    expect(v.stepStatus.company).toBe("idle");
    expect(v.stepStatus.owners).toBe("idle");
  });

  it("marks a visited invalid step as error", () => {
    const session = createEmptySession("Test User");
    session.visitedSteps.push("company");
    const v = validateSession(session);
    expect(v.stepStatus.company).toBe("error");
  });

  it("accepts a fully valid session", () => {
    const v = validateSession(completeSession());
    expect(v.issues).toEqual([]);
    expect(v.isComplete).toBe(true);
    expect(v.stepStatus.review).toBe("complete");
    for (const step of Object.values(v.stepStatus)) expect(step).toBe("complete");
  });

  describe("ownership totals (±0.01 tolerance)", () => {
    it.each([
      ["99.99", true],
      ["100", true],
      ["100.02", false],
      ["98.5", false],
    ])("total %s%% → valid: %s", (pct, valid) => {
      const session = completeSession();
      session.owners = [filledPrincipal(pct)];
      const v = validateSession(session);
      const totalIssue = v.issues.find((i) => i.path === "owners.total");
      expect(!totalIssue).toBe(valid);
    });

    it("sums across principals and parent companies", () => {
      const session = completeSession();
      const parent = {
        ...createParentCompany(),
        name: "Atlas Holdings, Inc.",
        ein: "12-3456789",
        ownershipPct: "40",
        address: { line1: "1 Main", line2: "", city: "Austin", state: "TX", zip: "78701" },
        contactEmail: "ops@atlas.com",
      };
      session.owners = [filledPrincipal("60"), parent];
      expect(validateSession(session).isComplete).toBe(true);
    });
  });

  it("requires at least one principal owner", () => {
    const session = completeSession();
    const parent = {
      ...createParentCompany(),
      name: "Atlas Holdings, Inc.",
      ein: "12-3456789",
      ownershipPct: "100",
      address: { line1: "1 Main", line2: "", city: "Austin", state: "TX", zip: "78701" },
      contactEmail: "ops@atlas.com",
    };
    session.owners = [parent];
    const v = validateSession(session);
    expect(v.issues.some((i) => i.message.includes("Principal"))).toBe(true);
  });

  it("accepts a resumed draft where SSN was stripped but ssnProvided is true", () => {
    const session = completeSession();
    const owner = session.owners[0] as PrincipalOwner;
    owner.ssn = "";
    owner.ssnProvided = true;
    expect(validateSession(session).isComplete).toBe(true);
  });

  it("requires SSN when neither entered nor previously provided", () => {
    const session = completeSession();
    const owner = session.owners[0] as PrincipalOwner;
    owner.ssn = "";
    owner.ssnProvided = false;
    const v = validateSession(session);
    expect(v.fieldErrors["owners.0.ssn"]).toBeTruthy();
  });

  describe("processing rules", () => {
    it("requires MID when CC is enabled, and remaps the issue to the processing step", () => {
      const session = completeSession();
      session.merchants[0].processing.mid = "";
      const v = validateSession(session);
      const issue = v.issues.find((i) => i.path === "merchants.0.processing.mid");
      expect(issue?.stepId).toBe("processing");
    });

    it("does not require MID when CC is disabled", () => {
      const session = completeSession();
      session.merchants[0].processing.mid = "";
      session.merchants[0].processing.cc.enabled = false;
      const v = validateSession(session);
      expect(v.fieldErrors["merchants.0.processing.mid"]).toBeUndefined();
    });

    it("requires an enabled capable processor per enabled rail", () => {
      const session = completeSession();
      // NMI is CC-only: ACH rail loses its capable processor
      session.merchants[0].processing.processors[0].processorCode = "NMI";
      const v = validateSession(session);
      expect(v.issues.some((i) => i.path === "merchants.0.processing.processors.ach")).toBe(true);
      expect(v.issues.some((i) => i.path === "merchants.0.processing.processors.cc")).toBe(false);
    });

    it("rejects a merchant with both rails disabled", () => {
      const session = completeSession();
      session.merchants[0].processing.cc.enabled = false;
      session.merchants[0].processing.ach.enabled = false;
      const v = validateSession(session);
      expect(v.byStep.processing?.some((i) => i.message.includes("at least one of CC or ACH"))).toBe(true);
    });

    it("ignores a disabled processor even if capable", () => {
      const session = completeSession();
      session.merchants[0].processing.processors[0].enabled = false;
      const v = validateSession(session);
      expect(v.issues.some((i) => i.path === "merchants.0.processing.processors.cc")).toBe(true);
    });
  });

  describe("profile coverage", () => {
    it("flags a merchant with no profile", () => {
      const session = completeSession();
      session.profiles = [];
      const v = validateSession(session);
      expect(v.byStep.profiles?.length).toBeGreaterThan(0);
    });

    it("flags a profile assigned to a deleted merchant", () => {
      const session = completeSession();
      session.profiles[0].merchantId = "mer_gone";
      const v = validateSession(session);
      expect(v.issues.some((i) => i.message.includes("no longer exists"))).toBe(true);
    });
  });

  it("requires a custom merchant address only when not using the company address", () => {
    const session = completeSession();
    session.merchants[0].useCompanyMailingAddress = false;
    const v = validateSession(session);
    expect(v.fieldErrors["merchants.0.address.line1"]).toBeTruthy();
    // and those issues belong to the merchants step, not processing
    expect(v.issues.find((i) => i.path === "merchants.0.address.line1")?.stepId).toBe("merchants");
  });

  it("requires at least one user with a template", () => {
    const session = completeSession();
    session.users[0].templateId = "";
    const v = validateSession(session);
    expect(v.fieldErrors["users.0.templateId"]).toBeTruthy();
  });

  describe("advanced merchant settings", () => {
    it("adds no issues with default advanced settings (regression guard)", () => {
      // completeSession() builds merchants via createMerchant, so this also
      // asserts that untouched Advanced defaults never block activation.
      expect(validateSession(completeSession()).isComplete).toBe(true);
    });

    it("requires a paylink endpoint when Custom Paylink is enabled, on the merchants step", () => {
      const session = completeSession();
      session.merchants[0].advanced.behavior.customPaylinkEnabled = true;
      const v = validateSession(session);
      const issue = v.issues.find((i) => i.path === "merchants.0.advanced.behavior.customPaylink");
      expect(issue).toBeTruthy();
      expect(issue?.stepId).toBe("merchants");
    });

    it("rejects paylink endpoints with invalid characters", () => {
      const session = completeSession();
      session.merchants[0].advanced.behavior.customPaylinkEnabled = true;
      session.merchants[0].advanced.behavior.customPaylink = "Bad Slug!";
      const v = validateSession(session);
      expect(v.fieldErrors["merchants.0.advanced.behavior.customPaylink"]).toContain("lowercase");
    });

    it("accepts a valid paylink slug", () => {
      const session = completeSession();
      session.merchants[0].advanced.behavior.customPaylinkEnabled = true;
      session.merchants[0].advanced.behavior.customPaylink = "coastline-wellness";
      expect(validateSession(session).isComplete).toBe(true);
    });

    it("requires ACHVerifi credentials only for a custom account", () => {
      const session = completeSession();
      const verifi = session.merchants[0].advanced.achVerifi;
      verifi.enabled = true;
      verifi.accountMode = "default";
      expect(validateSession(session).isComplete).toBe(true);

      verifi.accountMode = "custom";
      const v = validateSession(session);
      expect(v.fieldErrors["merchants.0.advanced.achVerifi.username"]).toBeTruthy();
      expect(v.fieldErrors["merchants.0.advanced.achVerifi.accountId"]).toBeTruthy();
      expect(v.fieldErrors["merchants.0.advanced.achVerifi.password"]).toBeTruthy();
    });

    it("accepts a resumed draft where the ACHVerifi password was stripped but passwordSet is true", () => {
      const session = completeSession();
      session.merchants[0].advanced.achVerifi = {
        enabled: true,
        accountMode: "custom",
        username: "verifi-user",
        accountId: "ACC-000000",
        password: "",
        passwordSet: true,
      };
      expect(validateSession(session).isComplete).toBe(true);
    });

    it("caps API custom fields at 16", () => {
      const session = completeSession();
      session.merchants[0].advanced.apiCustomFields = Array.from({ length: 17 }, (_, i) => `Field${i}`);
      const v = validateSession(session);
      expect(v.fieldErrors["merchants.0.advanced.apiCustomFields"]).toBeTruthy();
    });
  });

  describe("fieldErrors first-wins dedup", () => {
    it("keeps only the first message when one path yields multiple issues", () => {
      const session = completeSession();
      // Empty EIN violates both the min(1) rule and the format refine — two
      // issues on the same path.
      session.company.federalTaxId = "";
      const v = validateSession(session);
      const einIssues = v.issues.filter((i) => i.path === "company.federalTaxId");
      expect(einIssues.length).toBeGreaterThan(1);
      expect(einIssues[0].message).toBe("Federal Tax ID is required");
      expect(v.fieldErrors["company.federalTaxId"]).toBe("Federal Tax ID is required");
    });

    it("dedups repeated ownership-percentage issues to the required message", () => {
      const session = completeSession();
      (session.owners[0] as PrincipalOwner).ownershipPct = "";
      const v = validateSession(session);
      const pctIssues = v.issues.filter((i) => i.path === "owners.0.ownershipPct");
      expect(pctIssues.length).toBeGreaterThan(1);
      expect(v.fieldErrors["owners.0.ownershipPct"]).toBe("Ownership % is required");
    });

    it("keeps byStep entries for every issue even when fieldErrors dedups them", () => {
      const session = completeSession();
      session.company.federalTaxId = "";
      const v = validateSession(session);
      const einIssues = v.issues.filter((i) => i.path === "company.federalTaxId");
      expect(v.byStep.company).toEqual(einIssues);
    });
  });

  describe("review step status", () => {
    it("stays idle while any step has issues, even when every step was visited", () => {
      const session = createEmptySession("Test User");
      session.visitedSteps = ["account", "company", "owners", "merchants", "processing", "profiles", "users", "review"];
      const v = validateSession(session);
      expect(v.stepStatus.review).toBe("idle");
      // Visited broken steps error, but review never does.
      expect(v.stepStatus.company).toBe("error");
      expect(Object.values(v.stepStatus)).not.toContain(undefined);
    });

    it("is complete exactly when the session is complete", () => {
      const v = validateSession(completeSession());
      expect(v.isComplete).toBe(true);
      expect(v.stepStatus.review).toBe("complete");
    });

    it("marks an unvisited step with entered data as error, not idle", () => {
      const session = createEmptySession("Test User");
      // Data present but invalid on company and owners; neither step visited.
      session.company.legalName = "Acme Holdings, Inc.";
      session.owners = [createPrincipal()];
      const v = validateSession(session);
      expect(session.visitedSteps).toEqual([]);
      expect(v.stepStatus.company).toBe("error");
      expect(v.stepStatus.owners).toBe("error");
      // Untouched steps with issues stay idle.
      expect(v.stepStatus.users).toBe("idle");
    });

    it("treats a selected existing account as entered data for the account step", () => {
      const session = createEmptySession("Test User");
      session.account.mode = "existing";
      session.account.existing = null;
      expect(validateSession(session).stepStatus.account).toBe("idle");

      session.account.existing = {
        id: "ACC-1",
        name: "Atlas Holdings",
        contact: { firstName: "", lastName: "", title: "", email: "", phone: "" },
        address: { line1: "", line2: "", city: "", state: "", zip: "" },
      };
      expect(validateSession(session).stepStatus.account).toBe("complete");
    });

    it("marks the processing step as error once processing data exists on an invalid merchant", () => {
      const session = createEmptySession("Test User");
      const merchant = createMerchant("Coastline Wellness", "coastline");
      merchant.processing.mid = "1234567890"; // data entered, but no processors yet
      session.merchants = [merchant];
      const v = validateSession(session);
      expect(v.stepStatus.processing).toBe("error");
    });

    it("marks a valid step complete even when it was never visited", () => {
      const session = completeSession();
      session.visitedSteps = [];
      const v = validateSession(session);
      expect(v.stepStatus.company).toBe("complete");
      expect(v.stepStatus.users).toBe("complete");
    });
  });

  describe("format issues (EIN / website / email)", () => {
    it.each([
      ["", "Federal Tax ID is required"],
      ["12-34567", "Federal Tax ID must be 9 digits (12-3456789)"],
      ["ab-cdefghi", "Federal Tax ID must be 9 digits (12-3456789)"],
    ])("flags company EIN %j on the company step", (ein, message) => {
      const session = completeSession();
      session.company.federalTaxId = ein;
      const v = validateSession(session);
      expect(v.fieldErrors["company.federalTaxId"]).toBe(message);
      expect(v.issues.find((i) => i.path === "company.federalTaxId")?.stepId).toBe("company");
    });

    it("accepts a dashless 9-digit EIN", () => {
      const session = completeSession();
      session.company.federalTaxId = "123456789";
      expect(validateSession(session).isComplete).toBe(true);
    });

    it("flags a partial website URL but allows an empty one", () => {
      const session = completeSession();
      session.company.website = "example.com";
      expect(validateSession(session).fieldErrors["company.website"]).toBe("Enter a full URL (https://…)");

      session.company.website = "";
      expect(validateSession(session).isComplete).toBe(true);

      session.company.website = "https://example.com";
      expect(validateSession(session).isComplete).toBe(true);
    });

    it("flags malformed optional emails on company and merchant slices", () => {
      const session = completeSession();
      session.company.csEmail = "not-an-email";
      session.merchants[0].email = "also-bad";
      const v = validateSession(session);
      expect(v.fieldErrors["company.csEmail"]).toBe("Invalid email");
      expect(v.fieldErrors["merchants.0.email"]).toBe("Invalid email");
      expect(v.issues.find((i) => i.path === "merchants.0.email")?.stepId).toBe("merchants");
    });

    it("flags malformed required emails on owners and users", () => {
      const session = completeSession();
      (session.owners[0] as PrincipalOwner).contactEmail = "renee@";
      session.users[0].email = "alice_at_example.com";
      const v = validateSession(session);
      expect(v.fieldErrors["owners.0.contactEmail"]).toBe("Invalid email");
      expect(v.fieldErrors["users.0.email"]).toBe("Invalid email");
    });
  });
});
