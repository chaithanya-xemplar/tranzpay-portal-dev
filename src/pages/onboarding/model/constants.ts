import type { WizardStep } from "../../../design-system/wizard/WizardShell";
import type { ProcessorCode, StepId, ViewControlField, ViewSurface } from "./types";

// ── Wizard steps ──────────────────────────────────────
// Numbering follows WizardShell: 1 Account, 2 Company, 3 Owners,
// 4 Merchants (4a Processing, 4b Profiles), 5 Users, 6 Review.
export const STEP_DEFS: WizardStep[] = [
  { id: "account", title: "Account", description: "Company group", icon: "layers" },
  { id: "company", title: "Company", description: "Business entity", icon: "building" },
  { id: "owners", title: "Owners", description: "Principals & parent companies", icon: "user" },
  {
    id: "merchants",
    title: "Merchants",
    description: "Bank merchant accounts",
    icon: "bank",
    children: [
      { id: "processing", title: "Processing", description: "CC & ACH, processors, pricing" },
      { id: "profiles", title: "Processing Profiles", description: "Transaction buckets" },
    ],
  },
  { id: "users", title: "Users", description: "Templates & API access" },
  { id: "review", title: "Review & Activate", description: "Confirm & launch" },
];

/** Flattened navigation order (matches WizardShell's internal flattening). */
export const STEP_ORDER: StepId[] = [
  "account",
  "company",
  "owners",
  "merchants",
  "processing",
  "profiles",
  "users",
  "review",
];

export const STEP_NUMBERS: Record<StepId, string> = {
  account: "1",
  company: "2",
  owners: "3",
  merchants: "4",
  processing: "4a",
  profiles: "4b",
  users: "5",
  review: "6",
};

export const STEP_TITLES: Record<StepId, string> = {
  account: "Account",
  company: "Company",
  owners: "Owners",
  merchants: "Merchants",
  processing: "Processing",
  profiles: "Processing Profiles",
  users: "Users",
  review: "Review & Activate",
};

// ── Processor catalog ─────────────────────────────────
export interface ProcessorCatalogEntry {
  code: ProcessorCode;
  label: string;
  rails: { cc: boolean; ach: boolean };
}

export const PROCESSOR_CATALOG: ProcessorCatalogEntry[] = [
  { code: "NMI", label: "NMI", rails: { cc: true, ach: false } },
  { code: "TSYS", label: "TSYS", rails: { cc: true, ach: false } },
  { code: "PXP", label: "PXP", rails: { cc: true, ach: true } },
  { code: "PHQ_PXP", label: "PHQ-PXP", rails: { cc: true, ach: true } },
  { code: "TPY", label: "Tranzpay (TPY)", rails: { cc: false, ach: true } },
  { code: "FISERV", label: "Fiserv", rails: { cc: true, ach: false } },
  { code: "FIRSTDATA", label: "FirstData", rails: { cc: true, ach: false } },
];

export function processorLabel(code: ProcessorCode | ""): string {
  return PROCESSOR_CATALOG.find((p) => p.code === code)?.label ?? "—";
}

export function processorRails(code: ProcessorCode | ""): { cc: boolean; ach: boolean } {
  return PROCESSOR_CATALOG.find((p) => p.code === code)?.rails ?? { cc: false, ach: false };
}

// ── User templates (grouped for <optgroup>) ───────────
export interface UserTemplateGroup {
  group: string;
  templates: { id: string; label: string }[];
}

export const USER_TEMPLATES: UserTemplateGroup[] = [
  {
    group: "Treasury",
    templates: [
      { id: "treasury-manager", label: "Treasury Manager" },
      { id: "payments-specialist", label: "Payments Specialist" },
    ],
  },
  {
    group: "Data",
    templates: [
      { id: "editor", label: "Editor" },
      { id: "viewer", label: "Viewer" },
    ],
  },
  {
    group: "Business Intelligence",
    templates: [
      { id: "bi-analyst", label: "BI Analyst" },
      { id: "report-consumer", label: "Report Consumer" },
    ],
  },
];

export function userTemplateLabel(templateId: string): string {
  for (const g of USER_TEMPLATES) {
    const hit = g.templates.find((t) => t.id === templateId);
    if (hit) return hit.label;
  }
  return "—";
}

// ── MCC codes ─────────────────────────────────────────
export const MCC_CODES: { value: string; label: string }[] = [
  { value: "4900", label: "4900 — Utilities" },
  { value: "5411", label: "5411 — Grocery Stores" },
  { value: "5812", label: "5812 — Restaurants" },
  { value: "5960", label: "5960 — Direct Marketing: Insurance" },
  { value: "5999", label: "5999 — Specialty Retail" },
  { value: "6012", label: "6012 — Financial Institutions" },
  { value: "6300", label: "6300 — Insurance Sales & Underwriting" },
  { value: "7392", label: "7392 — Management Consulting" },
  { value: "7997", label: "7997 — Clubs & Membership Organizations" },
  { value: "8011", label: "8011 — Doctors & Physicians" },
  { value: "8220", label: "8220 — Colleges & Universities" },
  { value: "8398", label: "8398 — Charitable Organizations" },
  { value: "8931", label: "8931 — Accounting & Bookkeeping" },
];

// ── Company timezones ─────────────────────────────────
// The prototype uses IANA-style zones; portal-wide TIME_ZONES in
// src/constants/constants.ts is a coarse label list — keep the richer set
// here until the backend contract settles.
export const ONBOARDING_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Anchorage", label: "Alaska (America/Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
];

export const BATCH_HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
export const BATCH_MINUTES = ["00", "15", "30", "45"];

// ── Advanced merchant settings ────────────────────────
export const SUGGESTED_REQUIRED_FIELDS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Address Line 1",
  "City",
  "State",
  "ZIP",
  "Country",
];

/** Payment surfaces (columns of the View Controls matrix). */
export const VIEW_SURFACES: { key: ViewSurface; label: string; helper: string }[] = [
  { key: "paylink", label: "Paylink", helper: "Logged-out" },
  { key: "hosted", label: "Hosted", helper: "Checkout" },
  { key: "vt", label: "VT", helper: "Logged-in" },
  { key: "vault3p", label: "3P Vault", helper: "Third-party" },
];

/** Rows of the View Controls matrix. */
export const VIEW_CONTROL_FIELDS: { key: ViewControlField; label: string }[] = [
  { key: "disableCcGraphic", label: "Disable CC graphic display" },
  { key: "displayAddress", label: "Display address" },
  { key: "displayCity", label: "Display city" },
  { key: "displayState", label: "Display state" },
  { key: "displayZip", label: "Display ZIP" },
  { key: "displayDescription", label: "Display description" },
  { key: "displayEmail", label: "Display email" },
  { key: "displayPhone", label: "Display phone" },
  { key: "displayPolicyNumber", label: "Display policy number" },
  { key: "displayPersonalBusinessToggle", label: "Display personal / business toggle" },
  { key: "displayLogo", label: "Display logo" },
  { key: "displayPciMessage", label: "Display PCI compliance message" },
];

/** API custom fields occupy slots 5–20 (CC/ACH tables own 1–4). */
export const API_CUSTOM_FIELD_MAX = 16;
export const API_CUSTOM_FIELD_FIRST_SLOT = 5;

export const DEFAULT_REFUND_POLICY_HTML =
  "<p>All refunds must be requested within <strong>30 days</strong> of the transaction date. " +
  "Refunds are processed to the original payment method within 5–7 business days.</p>";
