import type { ZodType } from "zod";
import type { StepStatus } from "../../../design-system/wizard/WizardShell";
import { processorRails, STEP_ORDER } from "./constants";
import {
  accountSchema,
  companySchema,
  merchantSchema,
  parentCompanyOwnerSchema,
  principalOwnerSchema,
  profileSchema,
  userSchema,
} from "./schemas";
import type { OnboardingMerchant, OnboardingSession, StepId } from "./types";

export interface ValidationIssue {
  stepId: StepId;
  /** Dot path into the session, e.g. "merchants.0.processing.mid". */
  path: string;
  message: string;
}

export interface SessionValidation {
  issues: ValidationIssue[];
  byStep: Partial<Record<StepId, ValidationIssue[]>>;
  /** First issue message per path — feeds Field `error` props. */
  fieldErrors: Record<string, string>;
  /** Feeds WizardShell directly; wizard overlays "active" for the current step. */
  stepStatus: Record<StepId, StepStatus>;
  isComplete: boolean;
}

const OWNERSHIP_TOLERANCE = 0.01;

function collectSchemaIssues(
  schema: ZodType,
  value: unknown,
  stepId: StepId,
  pathPrefix: string,
  out: ValidationIssue[],
  remapStep?: (path: string) => StepId
): void {
  const result = schema.safeParse(value);
  if (result.success) return;
  for (const issue of result.error.issues) {
    const path = [pathPrefix, ...issue.path].filter((p) => p !== "").join(".");
    out.push({
      stepId: remapStep ? remapStep(path) : stepId,
      path,
      message: issue.message,
    });
  }
}

function merchantLabel(merchant: OnboardingMerchant, index: number): string {
  return merchant.dba.trim() || `Merchant ${index + 1}`;
}

export function validateSession(session: OnboardingSession): SessionValidation {
  const issues: ValidationIssue[] = [];

  // ── Field-level (slice schemas) ─────────────────────
  collectSchemaIssues(accountSchema, session.account, "account", "account", issues);
  collectSchemaIssues(companySchema, session.company, "company", "company", issues);

  session.owners.forEach((owner, i) => {
    const schema = owner.kind === "principal" ? principalOwnerSchema : parentCompanyOwnerSchema;
    collectSchemaIssues(schema, owner, "owners", `owners.${i}`, issues);
  });

  session.merchants.forEach((merchant, i) => {
    collectSchemaIssues(merchantSchema, merchant, "merchants", `merchants.${i}`, issues);
  });

  session.profiles.forEach((profile, i) => {
    collectSchemaIssues(profileSchema, profile, "profiles", `profiles.${i}`, issues);
  });

  session.users.forEach((user, i) => {
    collectSchemaIssues(userSchema, user, "users", `users.${i}`, issues);
  });

  // ── Cross-entity rules ──────────────────────────────

  // Owners
  if (!session.owners.some((o) => o.kind === "principal")) {
    issues.push({
      stepId: "owners",
      path: "owners",
      message: "At least one Principal owner is required.",
    });
  }
  if (session.owners.length > 0) {
    const total = session.owners.reduce((sum, o) => {
      const pct = Number(o.ownershipPct);
      return sum + (Number.isFinite(pct) ? pct : 0);
    }, 0);
    // Round to cents of a percent so float noise (100 − 99.99 = 0.010000…005)
    // doesn't leak past the tolerance.
    const delta = Math.round(Math.abs(total - 100) * 100) / 100;
    if (delta > OWNERSHIP_TOLERANCE) {
      issues.push({
        stepId: "owners",
        path: "owners.total",
        message: `Total ownership must equal 100% (currently ${total.toFixed(2).replace(/\.00$/, "")}%).`,
      });
    }
  }

  // Merchants
  if (session.merchants.length === 0) {
    issues.push({
      stepId: "merchants",
      path: "merchants",
      message: "At least one merchant is required.",
    });
    issues.push({
      stepId: "processing",
      path: "processing",
      message: "Add a merchant before configuring processing.",
    });
  }

  // Processing (per merchant)
  session.merchants.forEach((merchant, i) => {
    const label = merchantLabel(merchant, i);
    const { processing } = merchant;

    if (!processing.cc.enabled && !processing.ach.enabled) {
      issues.push({
        stepId: "processing",
        path: `merchants.${i}.processing`,
        message: `${label}: Enable at least one of CC or ACH.`,
      });
      return;
    }

    if (processing.cc.enabled && !processing.mid.trim()) {
      issues.push({
        stepId: "processing",
        path: `merchants.${i}.processing.mid`,
        message: `${label}: MID is required while CC processing is enabled.`,
      });
    }

    for (const rail of ["cc", "ach"] as const) {
      if (!processing[rail].enabled) continue;
      const hasCapableProcessor = processing.processors.some(
        (p) => p.enabled && p.rails[rail] && processorRails(p.processorCode)[rail]
      );
      if (!hasCapableProcessor) {
        issues.push({
          stepId: "processing",
          path: `merchants.${i}.processing.processors.${rail}`,
          message: `${label}: At least one enabled ${rail.toUpperCase()} processor is required.`,
        });
      }
    }
  });

  // Profiles
  if (session.profiles.length === 0) {
    issues.push({
      stepId: "profiles",
      path: "profiles",
      message: "At least one Processing Profile is required.",
    });
  }
  session.merchants.forEach((merchant, i) => {
    if (!session.profiles.some((p) => p.merchantId === merchant.id)) {
      issues.push({
        stepId: "profiles",
        path: `profiles.merchant.${merchant.id}`,
        message: `${merchantLabel(merchant, i)}: At least one Processing Profile is required.`,
      });
    }
  });
  session.profiles.forEach((profile, i) => {
    if (profile.merchantId && !session.merchants.some((m) => m.id === profile.merchantId)) {
      issues.push({
        stepId: "profiles",
        path: `profiles.${i}.merchantId`,
        message: `Profile ${i + 1}: Assigned merchant no longer exists.`,
      });
    }
  });

  // Users
  if (session.users.length === 0) {
    issues.push({
      stepId: "users",
      path: "users",
      message: "At least one user is required.",
    });
  }

  // Remap merchant processing.* field issues onto the processing step.
  for (const issue of issues) {
    if (issue.stepId === "merchants" && /^merchants\.\d+\.processing(\.|$)/.test(issue.path)) {
      issue.stepId = "processing";
    }
  }

  // ── Aggregate ───────────────────────────────────────
  const byStep: Partial<Record<StepId, ValidationIssue[]>> = {};
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    (byStep[issue.stepId] ??= []).push(issue);
    if (!(issue.path in fieldErrors)) fieldErrors[issue.path] = issue.message;
  }

  const isComplete = issues.length === 0;

  const stepStatus = {} as Record<StepId, StepStatus>;
  for (const stepId of STEP_ORDER) {
    if (stepId === "review") {
      stepStatus.review = isComplete ? "complete" : "idle";
      continue;
    }
    const stepIssues = byStep[stepId] ?? [];
    if (stepIssues.length === 0) {
      stepStatus[stepId] = "complete";
    } else if (session.visitedSteps.includes(stepId) || hasStepData(session, stepId)) {
      stepStatus[stepId] = "error";
    } else {
      stepStatus[stepId] = "idle";
    }
  }

  return { issues, byStep, fieldErrors, stepStatus, isComplete };
}

/** Whether the user has entered anything meaningful into a step. */
function hasStepData(session: OnboardingSession, stepId: StepId): boolean {
  switch (stepId) {
    case "account": {
      const { mode, existing, newAccount } = session.account;
      if (mode === "existing") return existing !== null;
      return Boolean(
        newAccount.name.trim() ||
          newAccount.contact.firstName.trim() ||
          newAccount.contact.lastName.trim() ||
          newAccount.contact.email.trim()
      );
    }
    case "company": {
      const c = session.company;
      return Boolean(
        c.legalName.trim() || c.alias.trim() || c.federalTaxId.trim() || c.mailingAddress.line1.trim()
      );
    }
    case "owners":
      return session.owners.length > 0;
    case "merchants":
      return session.merchants.length > 0;
    case "processing":
      return session.merchants.some(
        (m) => m.processing.mid.trim() !== "" || m.processing.processors.length > 0
      );
    case "profiles":
      return session.profiles.length > 0;
    case "users":
      return session.users.length > 0;
    case "review":
      return false;
  }
}
