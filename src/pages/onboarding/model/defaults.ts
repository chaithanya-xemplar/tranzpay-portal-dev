import { DEFAULT_REFUND_POLICY_HTML } from "./constants";
import type {
  AddressValues,
  CustomFieldDef,
  MerchantAdvancedSettings,
  OnboardingMerchant,
  OnboardingSession,
  OnboardingUser,
  ParentCompanyOwner,
  PersonValues,
  PrincipalOwner,
  ProcessingConfig,
  ProcessingProfile,
  ProcessorEntry,
  RailConfig,
  ViewControlField,
  ViewControls,
} from "./types";

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Placeholder API key — real credentials are issued on provisioning. */
export function generateApiKey(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let key = "";
  for (const b of bytes) key += alphabet[b % alphabet.length];
  return `sk_pending_${key}`;
}

export function createAddress(): AddressValues {
  return { line1: "", line2: "", city: "", state: "", zip: "" };
}

export function createPerson(): PersonValues {
  return { firstName: "", lastName: "", title: "", email: "", phone: "" };
}

function createRailConfig(batchClose: RailConfig["batchClose"]): RailConfig {
  return {
    enabled: true,
    batchClose,
    pricing: { model: "traditional", format: "percent", value: "" },
  };
}

export function createProcessing(): ProcessingConfig {
  return {
    mid: "",
    cc: createRailConfig({ hour: "11", minute: "00", meridiem: "PM" }),
    ach: createRailConfig({ hour: "04", minute: "00", meridiem: "PM" }),
    processors: [],
    priority: { cc: [], ach: [] },
  };
}

export function createProcessorEntry(): ProcessorEntry {
  return {
    id: generateId("proc"),
    processorCode: "",
    baseUrl: "",
    mid: "",
    username: "",
    password: "",
    passwordSet: false,
    rails: { cc: false, ach: false },
    enabled: false,
  };
}

function createCustomFieldSlots(): CustomFieldDef[] {
  return Array.from({ length: 4 }, () => ({ en: "", es: "", required: false }));
}

function createViewControls(): ViewControls {
  const surface = (overrides: Partial<Record<ViewControlField, boolean>>) => ({
    disableCcGraphic: false,
    displayAddress: false,
    displayCity: false,
    displayState: false,
    displayZip: false,
    displayDescription: false,
    displayEmail: false,
    displayPhone: false,
    displayPolicyNumber: false,
    displayPersonalBusinessToggle: false,
    displayLogo: false,
    displayPciMessage: false,
    ...overrides,
  });
  // Per-surface defaults from the approved prototype.
  return {
    paylink: surface({ displayDescription: true, displayPciMessage: true }),
    hosted: surface({ disableCcGraphic: true, displayZip: true, displayLogo: true }),
    vt: surface({ displayZip: true, displayLogo: true }),
    vault3p: surface({}),
  };
}

export function createAdvancedSettings(): MerchantAdvancedSettings {
  return {
    accountLimits: {
      ccApprovedMonthlyVolume: "",
      ccHighTicket: "",
      ccThresholdPercent: "",
      achApprovedMonthlyVolume: "",
      achHighTicket: "",
      achThresholdPercent: "",
    },
    requiredFields: ["First Name", "Last Name", "Email", "Phone"],
    viewControls: createViewControls(),
    behavior: {
      customPaylinkEnabled: false,
      customPaylink: "",
      requireCvv: true,
      requireTypedSignature: true,
      sharedVault: false,
      sharedVaultProfileGuids: "",
      enableSubscriptions: false,
      enableProducts: false,
      generateReferenceNumber: false,
    },
    paymentPageLabels: {
      paymentAmount: "Amount",
      accountType: "Type",
      firstName: "First",
      lastName: "Last",
      businessName: "Account Holder",
      address: "",
      city: "",
      state: "State",
      zip: "Zip",
      siteFee: "Site Fee*",
      policyNumber: "Policy",
      policyNumberRequired: false,
    },
    thirdParty: {
      saveCustomerToVault: true,
      unlockThirdPartyFields: false,
    },
    ccCustomFields: createCustomFieldSlots(),
    achCustomFields: createCustomFieldSlots(),
    apiCustomFields: [],
    refundPolicy: DEFAULT_REFUND_POLICY_HTML,
    achVerifi: {
      enabled: false,
      accountMode: "default",
      username: "",
      accountId: "",
      password: "",
      passwordSet: false,
    },
  };
}

export function createMerchant(dba: string, alias: string): OnboardingMerchant {
  return {
    id: generateId("mer"),
    dba,
    alias,
    useCompanyMailingAddress: true,
    address: createAddress(),
    phone: "",
    email: "",
    contactFirstName: "",
    contactLastName: "",
    processing: createProcessing(),
    advanced: createAdvancedSettings(),
  };
}

export function createDefaultProfile(merchant: OnboardingMerchant): ProcessingProfile {
  return {
    id: crypto.randomUUID(),
    merchantId: merchant.id,
    label: merchant.dba ? `${merchant.dba} Default` : "Default",
    active: true,
  };
}

export function createProfile(merchantId: string): ProcessingProfile {
  return { id: crypto.randomUUID(), merchantId, label: "", active: true };
}

export function createPrincipal(): PrincipalOwner {
  return {
    id: generateId("own"),
    kind: "principal",
    fullName: "",
    firstName: "",
    lastName: "",
    title: "",
    ownershipPct: "",
    dob: "",
    ssn: "",
    ssnLast4: "",
    ssnProvided: false,
    driversLicense: "",
    homeAddress: createAddress(),
    contactEmail: "",
    contactPhone: "",
    email: "",
    phone: "",
  };
}

export function createParentCompany(): ParentCompanyOwner {
  return {
    id: generateId("own"),
    kind: "parentCompany",
    name: "",
    ein: "",
    ownershipPct: "",
    address: createAddress(),
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    fullName:""
  };
}

export function createUser(
  fields: Pick<OnboardingUser, "firstName" | "lastName" | "email" | "templateId" | "active">
): OnboardingUser {
  return { id: generateId("usr"), ...fields, apiAccess: false, apiKey: "" };
}

export function createEmptySession(startedBy: string): OnboardingSession {
  const now = new Date().toISOString();
  return {
    id: generateId("onb"),
    version: 1,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    startedBy,
    currentStepId: "account",
    visitedSteps: [],
    account: {
      mode: "existing",
      existing: null,
      newAccount: { name: "", contact: createPerson(), address: createAddress() },
    },
    company: {
      legalName: "",
      alias: "",
      federalTaxId: "",
      businessStartDate: "",
      website: "",
      mccCode: "",
      timezone: "America/Los_Angeles",
      mailingAddress: createAddress(),
      csPhone: "",
      csEmail: "",
      logo: null,
    },
    owners: [],
    merchants: [],
    profiles: [],
    users: [],
  };
}

/** Short human-readable session code for tables ("OS-3F2A9C"). */
export function sessionShortCode(sessionId: string): string {
  const raw = sessionId.replace(/^onb_/, "").replace(/-/g, "");
  return `OS-${raw.slice(0, 6).toUpperCase()}`;
}
