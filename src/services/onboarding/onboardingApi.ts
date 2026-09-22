import { useQuery } from "@tanstack/react-query";
import { onboardingStore } from "../../pages/onboarding/model/storage";
import type {
  AccountSelection,
  ActivationResult,
  OnboardingSession,
} from "../../pages/onboarding/model/types";
import { validateSession } from "../../pages/onboarding/model/validateSession";
import { MOCK_ACCOUNTS } from "./mockAccounts";

// Account options for the Account step type-ahead. Mock-backed today —
// replace the queryFn with a portalClient call when the endpoint exists.
export function useAccountOptions() {
  return useQuery<AccountSelection[]>({
    queryKey: ["onboarding-accounts"],
    queryFn: () => Promise.resolve(MOCK_ACCOUNTS),
    staleTime: Infinity,
  });
}

/**
 * v1 activation is local-only: there is no batch onboarding endpoint yet, and
 * composing corp/merchant/processor/user creates client-side would be a
 * non-transactional, non-idempotent saga over fund-handling configuration.
 * The merchant ID is a clearly-placeholder "PENDING-…" value and API keys are
 * "sk_pending_…" — real credentials are issued when server-side provisioning
 * lands. Replace this function with the batch endpoint call when available.
 */
export async function activateSession(session: OnboardingSession): Promise<ActivationResult> {
  const validation = validateSession(session);
  if (!validation.isComplete) {
    throw new Error("Cannot activate: the session still has validation issues.");
  }

  const merchant = session.merchants[0];
  const profile = session.profiles.find((p) => p.merchantId === merchant.id) ?? session.profiles[0];
  const primaryUser = session.users[0];
  const apiUser = session.users.find((u) => u.apiAccess && u.apiKey);

  const result: ActivationResult = {
    merchantId: `PENDING-${merchant.id.replace(/^mer_/, "").slice(0, 8).toUpperCase()}`,
    profileGuid: profile.id,
    primaryUserName: `${primaryUser.firstName} ${primaryUser.lastName}`.trim(),
    primaryUserEmail: primaryUser.email,
    apiKey: apiUser?.apiKey ?? null,
    companyName: merchant.dba || session.company.legalName,
    activatedAt: new Date().toISOString(),
  };

  const activated: OnboardingSession = {
    ...session,
    status: "activated",
    updatedAt: result.activatedAt,
    activationResult: result,
  };
  await onboardingStore.save(activated);
  return result;
}
