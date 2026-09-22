import { createAdvancedSettings } from "./defaults";
import type { MerchantAdvancedSettings, OnboardingSession, Owner } from "./types";

// Draft persistence for onboarding sessions. localStorage today; the
// OnboardingStore interface is async throughout so a backend HTTP store can
// replace localStorageOnboardingStore without touching callers.

export const STORAGE_KEY_PREFIX = "tzp.onboarding.v1.";

export interface OnboardingStore {
  list(): Promise<OnboardingSession[]>;
  load(id: string): Promise<OnboardingSession | null>;
  save(session: OnboardingSession): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * PII choke point: secrets must never reach persistence.
 * - Owner SSNs are dropped; only `ssnLast4` + `ssnProvided` survive. On resume
 *   the UI shows a masked hint and validation accepts `ssnProvided === true`.
 * - Processor gateway passwords are dropped; only `passwordSet` survives.
 * - ACHVerifi custom-account passwords get the same treatment.
 * DOB and federal tax ID persist as-is — accepted v1 trade-off until the
 * backend session store lands.
 */
export function serializeSession(session: OnboardingSession): OnboardingSession {
  return {
    ...session,
    owners: session.owners.map((owner) =>
      owner.kind === "principal" ? { ...owner, ssn: "" } : owner
    ),
    merchants: session.merchants.map((merchant) => ({
      ...merchant,
      processing: {
        ...merchant.processing,
        processors: merchant.processing.processors.map((p) => ({ ...p, password: "" })),
      },
      advanced: {
        ...merchant.advanced,
        achVerifi: { ...merchant.advanced.achVerifi, password: "" },
      },
    })),
  };
}

/**
 * Drafts saved before the Advanced settings shipped lack `merchant.advanced`
 * (or carry a partial shape). Merge stored values over typed defaults,
 * section by section, so resumed drafts are always fully shaped without a
 * version bump.
 */
function backfillAdvanced(stored: unknown): MerchantAdvancedSettings {
  const defaults = createAdvancedSettings();
  if (typeof stored !== "object" || stored === null) return defaults;
  const partial = stored as Partial<MerchantAdvancedSettings>;
  return {
    accountLimits: { ...defaults.accountLimits, ...partial.accountLimits },
    requiredFields: Array.isArray(partial.requiredFields)
      ? partial.requiredFields
      : defaults.requiredFields,
    viewControls: {
      paylink: { ...defaults.viewControls.paylink, ...partial.viewControls?.paylink },
      hosted: { ...defaults.viewControls.hosted, ...partial.viewControls?.hosted },
      vt: { ...defaults.viewControls.vt, ...partial.viewControls?.vt },
      vault3p: { ...defaults.viewControls.vault3p, ...partial.viewControls?.vault3p },
    },
    behavior: { ...defaults.behavior, ...partial.behavior },
    paymentPageLabels: { ...defaults.paymentPageLabels, ...partial.paymentPageLabels },
    thirdParty: { ...defaults.thirdParty, ...partial.thirdParty },
    ccCustomFields: Array.isArray(partial.ccCustomFields) && partial.ccCustomFields.length === 4
      ? partial.ccCustomFields
      : defaults.ccCustomFields,
    achCustomFields: Array.isArray(partial.achCustomFields) && partial.achCustomFields.length === 4
      ? partial.achCustomFields
      : defaults.achCustomFields,
    apiCustomFields: Array.isArray(partial.apiCustomFields)
      ? partial.apiCustomFields
      : defaults.apiCustomFields,
    refundPolicy: typeof partial.refundPolicy === "string"
      ? partial.refundPolicy
      : defaults.refundPolicy,
    achVerifi: { ...defaults.achVerifi, ...partial.achVerifi, password: "" },
  };
}

function backfillOwner(owner: Owner): Owner {
  if (owner.kind !== "principal") return owner;
  const legacy = owner as Owner & {
    fullName?: string;
    contactEmail?: string;
    contactPhone?: string;
    email?: string;
    phone?: string;
  };
  return {
    ...owner,
    fullName: legacy.fullName ?? [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim(),
    contactEmail: legacy.contactEmail ?? legacy.email ?? "",
    contactPhone: legacy.contactPhone ?? legacy.phone ?? "",
  };
}

function parseSession(raw: string): OnboardingSession | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== 1
    ) {
      return null;
    }
    const session = parsed as OnboardingSession;
    return {
      ...session,
      owners: (session.owners ?? []).map(backfillOwner),
      merchants: (session.merchants ?? []).map((m) => ({
        ...m,
        advanced: backfillAdvanced(m.advanced),
      })),
    };
  } catch {
    return null;
  }
}

export const localStorageOnboardingStore: OnboardingStore = {
  list() {
    const sessions: OnboardingSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;
      const session = parseSession(localStorage.getItem(key) ?? "");
      if (session) sessions.push(session);
    }
    sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return Promise.resolve(sessions);
  },

  load(id) {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    return Promise.resolve(raw ? parseSession(raw) : null);
  },

  save(session) {
    localStorage.setItem(
      STORAGE_KEY_PREFIX + session.id,
      JSON.stringify(serializeSession(session))
    );
    return Promise.resolve();
  },

  remove(id) {
    localStorage.removeItem(STORAGE_KEY_PREFIX + id);
    return Promise.resolve();
  },
};

/** The active store. Swap the implementation here when the backend API lands. */
export const onboardingStore: OnboardingStore = localStorageOnboardingStore;
