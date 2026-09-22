// src/services/onboarding/onboardingApi.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { onboardingStore } from "../../pages/onboarding/model/storage";
import {
  validateSession,
  type SessionValidation,
} from "../../pages/onboarding/model/validateSession";
import {
  createDefaultProfile,
  createEmptySession,
  createMerchant,
  createProfile,
  createUser,
} from "../../pages/onboarding/model/defaults";
import type { OnboardingSession } from "../../pages/onboarding/model/types";
import { createWrapper } from "../../test/renderWithClient";
import { MOCK_ACCOUNTS } from "./mockAccounts";
import { activateSession, useAccountOptions } from "./onboardingApi";

vi.mock("../../pages/onboarding/model/storage", () => ({
  onboardingStore: { save: vi.fn() },
}));

vi.mock("../../pages/onboarding/model/validateSession", () => ({
  validateSession: vi.fn(),
}));

const completeValidation: SessionValidation = {
  issues: [],
  byStep: {},
  fieldErrors: {},
  stepStatus: {} as SessionValidation["stepStatus"],
  isComplete: true,
};

function buildSession(): OnboardingSession {
  const session = createEmptySession("admin@example.com");
  const merchant = createMerchant("Demo Wellness", "demo");
  merchant.id = "mer_abcdef12-3456-7890";
  const profile = createDefaultProfile(merchant);
  const user = createUser({
    firstName: "Pat",
    lastName: "Lee",
    email: "pat.lee@example.com",
    templateId: "admin",
    active: true,
  });

  session.company.legalName = "Demo Wellness LLC";
  session.merchants = [merchant];
  session.profiles = [profile];
  session.users = [user];
  return session;
}

describe("activateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T10:30:00.000Z"));
    vi.mocked(validateSession).mockReturnValue(completeValidation);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws and never saves when validation is incomplete", async () => {
    vi.mocked(validateSession).mockReturnValue({
      ...completeValidation,
      isComplete: false,
    });

    await expect(activateSession(buildSession())).rejects.toThrow(
      "Cannot activate: the session still has validation issues."
    );
    expect(onboardingStore.save).not.toHaveBeenCalled();
  });

  it("derives the PENDING merchantId from the first merchant id", async () => {
    const result = await activateSession(buildSession());

    // "mer_" stripped, first 8 chars uppercased
    expect(result.merchantId).toBe("PENDING-ABCDEF12");
  });

  it("uses the profile matching the merchant, else falls back to the first profile", async () => {
    const session = buildSession();
    const otherProfile = createProfile("mer_other-merchant-id");
    const matching = session.profiles[0];
    session.profiles = [otherProfile, matching];

    const matched = await activateSession(session);
    expect(matched.profileGuid).toBe(matching.id);

    session.profiles = [otherProfile];
    const fallback = await activateSession(session);
    expect(fallback.profileGuid).toBe(otherProfile.id);
  });

  it("takes the apiKey from the first user with apiAccess and a key, else null", async () => {
    const session = buildSession();

    const noKeyResult = await activateSession(session);
    expect(noKeyResult.apiKey).toBeNull();

    const apiUser = createUser({
      firstName: "Dev",
      lastName: "User",
      email: "dev.user@example.com",
      templateId: "api",
      active: true,
    });
    apiUser.apiAccess = true;
    apiUser.apiKey = "sk_pending_testkey0123456";
    session.users = [...session.users, apiUser];

    const keyed = await activateSession(session);
    expect(keyed.apiKey).toBe("sk_pending_testkey0123456");
    // primary user info still comes from users[0]
    expect(keyed.primaryUserName).toBe("Pat Lee");
    expect(keyed.primaryUserEmail).toBe("pat.lee@example.com");
  });

  it("uses merchant dba for companyName, falling back to the legal name", async () => {
    const session = buildSession();

    const withDba = await activateSession(session);
    expect(withDba.companyName).toBe("Demo Wellness");

    session.merchants[0].dba = "";
    const withoutDba = await activateSession(session);
    expect(withoutDba.companyName).toBe("Demo Wellness LLC");
  });

  it('saves the session with status "activated" and updatedAt === activatedAt', async () => {
    const session = buildSession();

    const result = await activateSession(session);

    expect(result.activatedAt).toBe("2026-07-09T10:30:00.000Z");
    expect(onboardingStore.save).toHaveBeenCalledTimes(1);
    expect(onboardingStore.save).toHaveBeenCalledWith({
      ...session,
      status: "activated",
      updatedAt: result.activatedAt,
      activationResult: result,
    });
  });
});

describe("useAccountOptions", () => {
  it("resolves the mock account list", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAccountOptions(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_ACCOUNTS);
  });
});
