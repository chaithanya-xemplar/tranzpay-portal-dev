import { serializeSession } from "../model/storage";
import type { OnboardingSession, PrincipalOwner } from "../model/types";

function toPascalCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toPascalCaseKeys);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
      toPascalCaseKeys(nestedValue),
    ])
  );
}

function omitKeys<T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function principalOwnerForRequest(owner: PrincipalOwner): PrincipalOwner {
  const nameParts = splitFullName(owner.fullName);

  return {
    ...owner,
    firstName: owner.firstName.trim() || nameParts.firstName,
    lastName: owner.lastName.trim() || nameParts.lastName,
    email: owner.email.trim() || owner.contactEmail,
    phone: owner.phone.trim() || owner.contactPhone,
  };
}

export function buildOnboardingRequestBody(session: OnboardingSession) {
  const safeSession = serializeSession(session);
  const account = safeSession.account.existing
    ? {
        id: safeSession.account.existing.id,
        name: safeSession.account.existing.name,
        contact: safeSession.account.existing.contact,
        address: safeSession.account.existing.address,
      }
    : {
        id: "",
        name: safeSession.account.newAccount.name,
        contact: safeSession.account.newAccount.contact,
        address: safeSession.account.newAccount.address,
      };

  const requestJson = toPascalCaseKeys({
    sessionId: safeSession.id,
    startedBy: safeSession.startedBy,
    currentStepId: safeSession.currentStepId,
    visitedSteps: safeSession.visitedSteps,
    account: {
      mode: safeSession.account.mode === "new" ? "create" : "existing",
      account,
    },
    company: safeSession.company,
    owners: {
      parents: safeSession.owners
        .filter((owner) => owner.kind === "parentCompany")
        .map((owner) => omitKeys(owner, ["fullName"])),
      principals: safeSession.owners
        .filter((owner) => owner.kind === "principal")
        .map(principalOwnerForRequest),
    },
    // Advanced settings are provisioned outside this activation API.
    merchants: safeSession.merchants.map((merchant) => omitKeys(merchant, ["advanced"])),
    profiles: safeSession.profiles,
    users: safeSession.users,
  });

  return {
    IsSave: false,
    RequestJson: JSON.stringify(requestJson),
  };
}

export function buildOnboardingDisplayJson(session: OnboardingSession) {
  const requestBody = buildOnboardingRequestBody(session);

  return JSON.stringify({
    ...requestBody,
    RequestJson: JSON.parse(requestBody.RequestJson) as unknown,
  }, null, 2);
}
