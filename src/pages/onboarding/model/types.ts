// Domain model for the Customer Onboarding wizard.
// The session is a single serializable object; validation runs over the whole
// session via validateSession (see validateSession.ts). Fields marked
// "in-memory only" are stripped by the storage serializer and never persisted.

export type StepId =
  | "account"
  | "company"
  | "owners"
  | "merchants"
  | "processing"
  | "profiles"
  | "users"
  | "review";

export interface AddressValues {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface PersonValues {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
}

// ── Account (company group) ───────────────────────────
export interface AccountSelection {
  id: string;
  name: string;
  contact: PersonValues;
  address: AddressValues;
}

export interface AccountSlice {
  mode: "existing" | "new";
  /** Snapshot of the selected existing account (read-only in UI). */
  existing: AccountSelection | null;
  /** Draft for a newly created account; only validated when mode === "new". */
  newAccount: {
    name: string;
    contact: PersonValues;
    address: AddressValues;
  };
}

// ── Company ───────────────────────────────────────────
export interface CompanySlice {
  legalName: string;
  alias: string;
  federalTaxId: string;
  businessStartDate: string;
  website: string;
  mccCode: string;
  timezone: string;
  mailingAddress: AddressValues;
  csPhone: string;
  csEmail: string;
  /** Base64 data URL from LogoUpload, or null. */
  logo: string | null;
}

// ── Owners ────────────────────────────────────────────
export interface PrincipalOwner {
  id: string;
  kind: "principal";
  fullName: string;
  firstName: string;
  lastName: string;
  title: string;
  /** Numeric percentage as entered (string to match controlled inputs). */
  ownershipPct: string;
  dob: string;
  /** In-memory only — stripped before persistence. */
  ssn: string;
  ssnLast4: string;
  ssnProvided: boolean;
  driversLicense: string;
  homeAddress: AddressValues;
  contactEmail: string;
  contactPhone: string;
  email: string;
  phone: string;
}

export interface ParentCompanyOwner {
  fullName: string;
  id: string;
  kind: "parentCompany";
  name: string;
  ein: string;
  ownershipPct: string;
  address: AddressValues;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export type Owner = PrincipalOwner | ParentCompanyOwner;

// ── Merchants & processing ────────────────────────────
export type ProcessorCode =
  | "NMI"
  | "TSYS"
  | "PXP"
  | "PHQ_PXP"
  | "TPY"
  | "FISERV"
  | "FIRSTDATA";

export interface ProcessorEntry {
  id: string;
  /** Empty string until the user picks a processor. */
  processorCode: ProcessorCode | "";
  baseUrl: string;
  mid: string;
  username: string;
  /** In-memory only — stripped before persistence. */
  password: string;
  passwordSet: boolean;
  rails: { cc: boolean; ach: boolean };
  enabled: boolean;
}

export interface RailConfig {
  enabled: boolean;
  batchClose: { hour: string; minute: string; meridiem: "AM" | "PM" };
  pricing: {
    model: "traditional" | "convenience";
    format: "percent" | "flat";
    value: string;
  };
}

export interface ProcessingConfig {
  mid: string;
  cc: RailConfig;
  ach: RailConfig;
  processors: ProcessorEntry[];
  /** ProcessorEntry ids in priority order; topmost enabled = primary. */
  priority: { cc: string[]; ach: string[] };
}

// ── Advanced merchant settings ────────────────────────
export interface CustomFieldDef {
  en: string;
  es: string;
  required: boolean;
}

export type ViewSurface = "paylink" | "hosted" | "vt" | "vault3p";

export type ViewControlField =
  | "disableCcGraphic"
  | "displayAddress"
  | "displayCity"
  | "displayState"
  | "displayZip"
  | "displayDescription"
  | "displayEmail"
  | "displayPhone"
  | "displayPolicyNumber"
  | "displayPersonalBusinessToggle"
  | "displayLogo"
  | "displayPciMessage";

export type ViewControls = Record<ViewSurface, Record<ViewControlField, boolean>>;

export interface AccountLimits {
  ccApprovedMonthlyVolume: string;
  ccHighTicket: string;
  ccThresholdPercent: string;
  achApprovedMonthlyVolume: string;
  achHighTicket: string;
  achThresholdPercent: string;
}

export interface MerchantBehavior {
  customPaylinkEnabled: boolean;
  /** Slug appended to tranzpay.com/pay/ — lowercase [a-z0-9-]. */
  customPaylink: string;
  requireCvv: boolean;
  requireTypedSignature: boolean;
  sharedVault: boolean;
  /** Comma-separated Processing Profile GUIDs sharing the vault. */
  sharedVaultProfileGuids: string;
  enableSubscriptions: boolean;
  enableProducts: boolean;
  generateReferenceNumber: boolean;
}

export interface PaymentPageLabels {
  paymentAmount: string;
  accountType: string;
  firstName: string;
  lastName: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  siteFee: string;
  policyNumber: string;
  policyNumberRequired: boolean;
}

export interface AchVerifiSettings {
  enabled: boolean;
  accountMode: "default" | "custom";
  username: string;
  accountId: string;
  /** In-memory only — stripped before persistence. */
  password: string;
  passwordSet: boolean;
}

export interface MerchantAdvancedSettings {
  accountLimits: AccountLimits;
  /** Selected suggested-required-field labels (chips). */
  requiredFields: string[];
  viewControls: ViewControls;
  behavior: MerchantBehavior;
  paymentPageLabels: PaymentPageLabels;
  thirdParty: {
    saveCustomerToVault: boolean;
    unlockThirdPartyFields: boolean;
  };
  /** Always 4 slots per rail. */
  ccCustomFields: CustomFieldDef[];
  achCustomFields: CustomFieldDef[];
  /** API-only slots CustomField5–CustomField20 (max 16 entries). */
  apiCustomFields: string[];
  /** HTML from RichText. */
  refundPolicy: string;
  achVerifi: AchVerifiSettings;
}

export interface OnboardingMerchant {
  id: string;
  dba: string;
  alias: string;
  useCompanyMailingAddress: boolean;
  address: AddressValues;
  phone: string;
  email: string;
  contactFirstName: string;
  contactLastName: string;
  processing: ProcessingConfig;
  advanced: MerchantAdvancedSettings;
}

export interface ProcessingProfile {
  /** Permanent GUID assigned at creation; never regenerated. */
  id: string;
  merchantId: string;
  label: string;
  active: boolean;
}

// ── Users ─────────────────────────────────────────────
export interface OnboardingUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  templateId: string;
  active: boolean;
  apiAccess: boolean;
  /** Placeholder key ("sk_pending_..."); real credentials are issued on provisioning. */
  apiKey: string;
}

// ── Session ───────────────────────────────────────────
export interface ActivationResult {
  merchantId: string;
  profileGuid: string;
  primaryUserName: string;
  primaryUserEmail: string;
  apiKey: string | null;
  companyName: string;
  activatedAt: string;
}

export interface OnboardingSession {
  id: string;
  version: 1;
  status: "draft" | "activated";
  createdAt: string;
  updatedAt: string;
  startedBy: string;
  currentStepId: StepId;
  visitedSteps: StepId[];
  account: AccountSlice;
  company: CompanySlice;
  owners: Owner[];
  merchants: OnboardingMerchant[];
  profiles: ProcessingProfile[];
  users: OnboardingUser[];
  activationResult?: ActivationResult;
}

/** Row shape for the onboarding list page. */
export interface OnboardingSessionSummary {
  id: string;
  status: "draft" | "activated";
  companyName: string;
  startedBy: string;
  completedSteps: number;
  totalSteps: number;
  updatedAt: string;
}
