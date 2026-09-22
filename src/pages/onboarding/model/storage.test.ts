import { beforeEach, describe, it, expect } from "vitest";
import { createEmptySession, createMerchant, createPrincipal, createProcessorEntry } from "./defaults";
import { localStorageOnboardingStore as store, serializeSession, STORAGE_KEY_PREFIX } from "./storage";
import type { OnboardingSession, PrincipalOwner } from "./types";

const SSN = "123-45-6789";
const PASSWORD = "hunter2-gateway-secret";
const VERIFI_PASSWORD = "verifi-custom-secret";

function sessionWithSecrets(): OnboardingSession {
  const session = createEmptySession("Test User");
  const owner: PrincipalOwner = {
    ...createPrincipal(),
    fullName: "Renee Park",
    firstName: "Renee",
    lastName: "Park",
    ssn: SSN,
    ssnLast4: "6789",
    ssnProvided: true,
  };
  session.owners = [owner];
  const merchant = createMerchant("Coastline", "coastline");
  merchant.processing.processors = [
    { ...createProcessorEntry(), username: "api_user", password: PASSWORD, passwordSet: true },
  ];
  merchant.advanced.achVerifi = {
    enabled: true,
    accountMode: "custom",
    username: "verifi-user",
    accountId: "ACC-000000",
    password: VERIFI_PASSWORD,
    passwordSet: true,
  };
  session.merchants = [merchant];
  return session;
}

beforeEach(() => {
  localStorage.clear();
});

describe("serializeSession (PII stripping)", () => {
  it("removes SSN and processor passwords but keeps their markers", () => {
    const serialized = serializeSession(sessionWithSecrets());
    const json = JSON.stringify(serialized);

    expect(json).not.toContain(SSN);
    expect(json).not.toContain(PASSWORD);

    const owner = serialized.owners[0] as PrincipalOwner;
    expect(owner.ssn).toBe("");
    expect(owner.ssnLast4).toBe("6789");
    expect(owner.ssnProvided).toBe(true);
    expect(serialized.merchants[0].processing.processors[0].passwordSet).toBe(true);
  });

  it("removes ACHVerifi custom-account passwords but keeps the marker and account fields", () => {
    const serialized = serializeSession(sessionWithSecrets());
    const json = JSON.stringify(serialized);

    expect(json).not.toContain(VERIFI_PASSWORD);

    const verifi = serialized.merchants[0].advanced.achVerifi;
    expect(verifi.password).toBe("");
    expect(verifi.passwordSet).toBe(true);
    expect(verifi.username).toBe("verifi-user");
    expect(verifi.accountId).toBe("ACC-000000");
  });

  it("does not mutate the in-memory session", () => {
    const session = sessionWithSecrets();
    serializeSession(session);
    expect((session.owners[0] as PrincipalOwner).ssn).toBe(SSN);
    expect(session.merchants[0].processing.processors[0].password).toBe(PASSWORD);
    expect(session.merchants[0].advanced.achVerifi.password).toBe(VERIFI_PASSWORD);
  });
});

describe("localStorageOnboardingStore", () => {
  it("round-trips a session (minus secrets) under a versioned key", async () => {
    const session = sessionWithSecrets();
    await store.save(session);

    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + session.id);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain(SSN);
    expect(raw).not.toContain(PASSWORD);

    const loaded = await store.load(session.id);
    expect(loaded?.id).toBe(session.id);
    expect(loaded?.version).toBe(1);
    expect((loaded?.owners[0] as PrincipalOwner).ssn).toBe("");
    expect((loaded?.owners[0] as PrincipalOwner).ssnLast4).toBe("6789");
  });

  it("lists sessions sorted by updatedAt descending, ignoring foreign keys", async () => {
    const older = createEmptySession("A");
    older.updatedAt = "2026-07-01T00:00:00.000Z";
    const newer = createEmptySession("B");
    newer.updatedAt = "2026-07-05T00:00:00.000Z";
    await store.save(older);
    await store.save(newer);
    localStorage.setItem("access_token", "not-a-session");
    localStorage.setItem(STORAGE_KEY_PREFIX + "corrupt", "{not json");

    const sessions = await store.list();
    expect(sessions.map((s) => s.id)).toEqual([newer.id, older.id]);
  });

  it("returns null for unknown ids and unknown versions", async () => {
    expect(await store.load("missing")).toBeNull();
    localStorage.setItem(STORAGE_KEY_PREFIX + "v99", JSON.stringify({ version: 99, id: "v99" }));
    expect(await store.load("v99")).toBeNull();
  });

  it("removes a session", async () => {
    const session = createEmptySession("A");
    await store.save(session);
    await store.remove(session.id);
    expect(await store.load(session.id)).toBeNull();
    expect(await store.list()).toEqual([]);
  });

  it("backfills advanced defaults on drafts saved before Advanced settings existed", async () => {
    const session = createEmptySession("A");
    const merchant = createMerchant("Coastline", "coastline");
    session.merchants = [merchant];
    // Simulate a pre-Advanced draft: persisted JSON without merchant.advanced.
    const legacy = JSON.parse(JSON.stringify(serializeSession(session))) as {
      merchants: Record<string, unknown>[];
    };
    delete legacy.merchants[0].advanced;
    localStorage.setItem(STORAGE_KEY_PREFIX + session.id, JSON.stringify(legacy));

    const loaded = await store.load(session.id);
    const advanced = loaded?.merchants[0].advanced;
    expect(advanced).toBeDefined();
    expect(advanced?.behavior.requireCvv).toBe(true);
    expect(advanced?.requiredFields).toEqual(["First Name", "Last Name", "Email", "Phone"]);
    expect(advanced?.ccCustomFields).toHaveLength(4);
    expect(advanced?.achVerifi.enabled).toBe(false);
    expect(advanced?.viewControls.hosted.displayLogo).toBe(true);
  });

  it("backfills principal full name and contact email on older drafts", async () => {
    const session = sessionWithSecrets();
    const legacy = JSON.parse(JSON.stringify(serializeSession(session))) as {
      owners: Record<string, unknown>[];
    };
    delete legacy.owners[0].fullName;
    delete legacy.owners[0].contactEmail;
    legacy.owners[0].email = "legacy@example.com";
    localStorage.setItem(STORAGE_KEY_PREFIX + session.id, JSON.stringify(legacy));

    const owner = (await store.load(session.id))?.owners[0] as PrincipalOwner;
    expect(owner.fullName).toBe("Renee Park");
    expect(owner.contactEmail).toBe("legacy@example.com");
  });

  it("preserves stored advanced values over defaults when partially present", async () => {
    const session = createEmptySession("A");
    const merchant = createMerchant("Coastline", "coastline");
    merchant.advanced.behavior.enableSubscriptions = true;
    merchant.advanced.requiredFields = ["Email"];
    session.merchants = [merchant];
    await store.save(session);

    const loaded = await store.load(session.id);
    const advanced = loaded?.merchants[0].advanced;
    expect(advanced?.behavior.enableSubscriptions).toBe(true);
    expect(advanced?.requiredFields).toEqual(["Email"]);
    // Untouched sections keep defaults.
    expect(advanced?.thirdParty.saveCustomerToVault).toBe(true);
  });
});

describe("backfillAdvanced edge cases (via store.load)", () => {
  /** Persists a session whose stored merchant.advanced is replaced with `advanced`, then loads it. */
  async function loadWithStoredAdvanced(advanced: unknown) {
    const session = createEmptySession("A");
    session.merchants = [createMerchant("Coastline", "coastline")];
    const raw = JSON.parse(JSON.stringify(serializeSession(session))) as {
      merchants: Record<string, unknown>[];
    };
    raw.merchants[0].advanced = advanced;
    localStorage.setItem(STORAGE_KEY_PREFIX + session.id, JSON.stringify(raw));
    const loaded = await store.load(session.id);
    return loaded?.merchants[0].advanced;
  }

  it("merges a partial viewControls surface over defaults and keeps other surfaces intact", async () => {
    const advanced = await loadWithStoredAdvanced({
      viewControls: { paylink: { displayEmail: true, displayDescription: false } },
    });
    // Stored overrides win…
    expect(advanced?.viewControls.paylink.displayEmail).toBe(true);
    expect(advanced?.viewControls.paylink.displayDescription).toBe(false);
    // …unmentioned fields on the same surface keep defaults…
    expect(advanced?.viewControls.paylink.displayPciMessage).toBe(true);
    // …and missing surfaces are fully backfilled.
    expect(advanced?.viewControls.hosted.displayLogo).toBe(true);
    expect(advanced?.viewControls.vt.displayZip).toBe(true);
    expect(advanced?.viewControls.vault3p.displayAddress).toBe(false);
  });

  it("replaces wrong-length custom-field arrays with the 4 default slots", async () => {
    const advanced = await loadWithStoredAdvanced({
      ccCustomFields: [{ en: "Only One", es: "", required: true }],
      achCustomFields: Array.from({ length: 5 }, () => ({ en: "Extra", es: "", required: false })),
    });
    expect(advanced?.ccCustomFields).toHaveLength(4);
    expect(advanced?.ccCustomFields.every((f) => f.en === "" && !f.required)).toBe(true);
    expect(advanced?.achCustomFields).toHaveLength(4);
    expect(advanced?.achCustomFields.every((f) => f.en === "")).toBe(true);
  });

  it("keeps custom-field arrays that already have exactly 4 slots", async () => {
    const slots = [
      { en: "Policy", es: "Póliza", required: true },
      { en: "", es: "", required: false },
      { en: "", es: "", required: false },
      { en: "", es: "", required: false },
    ];
    const advanced = await loadWithStoredAdvanced({ ccCustomFields: slots });
    expect(advanced?.ccCustomFields).toEqual(slots);
  });

  it("replaces a non-array apiCustomFields with the empty default, but keeps a stored array", async () => {
    expect((await loadWithStoredAdvanced({ apiCustomFields: "not-an-array" }))?.apiCustomFields).toEqual([]);
    expect((await loadWithStoredAdvanced({ apiCustomFields: { 0: "Field 5" } }))?.apiCustomFields).toEqual([]);
    expect((await loadWithStoredAdvanced({ apiCustomFields: ["Field 5", "Field 6"] }))?.apiCustomFields).toEqual([
      "Field 5",
      "Field 6",
    ]);
  });

  it("falls back to full defaults when the stored advanced value is not an object", async () => {
    for (const stored of ["junk", 42, null] as const) {
      const advanced = await loadWithStoredAdvanced(stored);
      expect(advanced?.requiredFields).toEqual(["First Name", "Last Name", "Email", "Phone"]);
      expect(advanced?.ccCustomFields).toHaveLength(4);
      expect(advanced?.behavior.requireCvv).toBe(true);
    }
  });

  it("never resurrects an ACHVerifi password from a stored draft", async () => {
    const advanced = await loadWithStoredAdvanced({
      achVerifi: {
        enabled: true,
        accountMode: "custom",
        username: "verifi-user",
        accountId: "ACC-000000",
        password: "should-never-load",
        passwordSet: true,
      },
    });
    expect(advanced?.achVerifi.password).toBe("");
    expect(advanced?.achVerifi.passwordSet).toBe(true);
    expect(advanced?.achVerifi.username).toBe("verifi-user");
  });
});
