import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createAddress, createEmptySession, createPerson, createUser } from "../model/defaults";
import { onboardingStore, STORAGE_KEY_PREFIX } from "../model/storage";
import type { OnboardingSession, OnboardingSessionSummary } from "../model/types";
import { useOnboardingList } from "./useOnboardingList";

function makeSession(updatedAt: string, mutate?: (s: OnboardingSession) => void): OnboardingSession {
  const session = createEmptySession("Test User");
  session.updatedAt = updatedAt;
  mutate?.(session);
  return session;
}

async function renderList() {
  const rendered = renderHook(() => useOnboardingList());
  await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  return rendered;
}

function summaryFor(
  summaries: OnboardingSessionSummary[],
  id: string
): OnboardingSessionSummary {
  const hit = summaries.find((s) => s.id === id);
  if (!hit) throw new Error(`No summary for ${id}`);
  return hit;
}

beforeEach(() => {
  localStorage.clear();
});

describe("useOnboardingList", () => {
  it("starts loading, then resolves stored sessions newest-first", async () => {
    const older = makeSession("2026-07-01T00:00:00.000Z");
    const newer = makeSession("2026-07-08T00:00:00.000Z");
    await onboardingStore.save(older);
    await onboardingStore.save(newer);

    const { result } = renderHook(() => useOnboardingList());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.summaries.map((s) => s.id)).toEqual([newer.id, older.id]);
  });

  it("companyName prefers the company legal name over any account name", async () => {
    const session = makeSession("2026-07-08T00:00:00.000Z", (s) => {
      s.company.legalName = "Acme Holdings, Inc.";
      s.account.newAccount.name = "Should Not Win";
    });
    await onboardingStore.save(session);

    const { result } = await renderList();
    expect(summaryFor(result.current.summaries, session.id).companyName).toBe(
      "Acme Holdings, Inc."
    );
  });

  it("companyName falls back to the selected existing account name", async () => {
    const session = makeSession("2026-07-08T00:00:00.000Z", (s) => {
      s.company.legalName = "   ";
      s.account.mode = "existing";
      s.account.existing = {
        id: "acct-1",
        name: "Existing Group LLC",
        contact: createPerson(),
        address: createAddress(),
      };
    });
    await onboardingStore.save(session);

    const { result } = await renderList();
    expect(summaryFor(result.current.summaries, session.id).companyName).toBe(
      "Existing Group LLC"
    );
  });

  it("companyName falls back to the new-account draft name when mode is 'new'", async () => {
    const session = makeSession("2026-07-08T00:00:00.000Z", (s) => {
      s.account.mode = "new";
      s.account.newAccount.name = "  Fresh Account Co  ";
    });
    await onboardingStore.save(session);

    const { result } = await renderList();
    expect(summaryFor(result.current.summaries, session.id).companyName).toBe(
      "Fresh Account Co"
    );
  });

  it("companyName falls back to 'Untitled' when nothing is named", async () => {
    const session = makeSession("2026-07-08T00:00:00.000Z");
    await onboardingStore.save(session);

    const { result } = await renderList();
    const summary = summaryFor(result.current.summaries, session.id);
    expect(summary.companyName).toBe("Untitled");
    expect(summary.startedBy).toBe("Test User");
  });

  it("counts completed steps out of the non-review steps", async () => {
    const empty = makeSession("2026-07-01T00:00:00.000Z");
    const withUsers = makeSession("2026-07-08T00:00:00.000Z", (s) => {
      s.users = [
        createUser({
          firstName: "Taylor",
          lastName: "Example",
          email: "taylor@example.com",
          templateId: "viewer",
          active: true,
        }),
      ];
    });
    await onboardingStore.save(empty);
    await onboardingStore.save(withUsers);

    const { result } = await renderList();
    const emptySummary = summaryFor(result.current.summaries, empty.id);
    expect(emptySummary.completedSteps).toBe(0);
    expect(emptySummary.totalSteps).toBe(7); // STEP_ORDER minus "review"

    // A valid user makes exactly the "users" step complete.
    expect(summaryFor(result.current.summaries, withUsers.id).completedSteps).toBe(1);
  });

  it("removeSession deletes from storage and refreshes the list", async () => {
    const keep = makeSession("2026-07-08T00:00:00.000Z");
    const drop = makeSession("2026-07-07T00:00:00.000Z");
    await onboardingStore.save(keep);
    await onboardingStore.save(drop);

    const { result } = await renderList();
    expect(result.current.summaries).toHaveLength(2);

    await act(async () => {
      await result.current.removeSession(drop.id);
    });
    expect(result.current.summaries.map((s) => s.id)).toEqual([keep.id]);
    expect(localStorage.getItem(STORAGE_KEY_PREFIX + drop.id)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_PREFIX + keep.id)).not.toBeNull();
  });
});
