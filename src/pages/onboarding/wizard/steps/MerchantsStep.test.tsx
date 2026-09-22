import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDefaultProfile, createEmptySession, createMerchant } from "../../model/defaults";
import type { OnboardingMerchant, OnboardingSession } from "../../model/types";
import type { StepProps } from "../stepProps";
import MerchantsStep from "./MerchantsStep";

type Patch = StepProps["patch"];

function makeSession(merchants: OnboardingMerchant[] = []): OnboardingSession {
  const session = createEmptySession("Test User");
  session.merchants = merchants;
  session.profiles = merchants.map((m) => createDefaultProfile(m));
  return session;
}

function renderStep(session: OnboardingSession, fieldErrors: Record<string, string> = {}) {
  const patch = vi.fn<Patch>();
  render(<MerchantsStep session={session} patch={patch} fieldErrors={fieldErrors} />);
  return { patch };
}

/** Apply the last updater the component handed to `patch`. */
function applyLastPatch(patch: ReturnType<typeof vi.fn<Patch>>, base: OnboardingSession) {
  const call = patch.mock.calls.at(-1);
  if (!call) throw new Error("patch was not called");
  return call[0](base);
}

describe("MerchantsStep — add merchant", () => {
  it("adds a merchant plus its default profile via an immutable patch", async () => {
    const user = userEvent.setup();
    const session = makeSession();
    const { patch } = renderStep(session);

    const addButton = screen.getByRole("button", { name: /add merchant/i });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Coastline Wellness"), "Harbor Cafe");
    await user.type(screen.getByPlaceholderText("coastline-wellness"), "harbor-cafe");
    expect(addButton).toBeEnabled();
    await user.click(addButton);

    expect(patch).toHaveBeenCalledTimes(1);
    const next = applyLastPatch(patch, session);
    expect(next.merchants).toHaveLength(1);
    expect(next.merchants[0]).toMatchObject({ dba: "Harbor Cafe", alias: "harbor-cafe" });
    expect(next.profiles).toHaveLength(1);
    expect(next.profiles[0].merchantId).toBe(next.merchants[0].id);
    expect(next.profiles[0].label).toBe("Harbor Cafe Default");

    // Immutable: new session/array identities, source untouched.
    expect(next).not.toBe(session);
    expect(next.merchants).not.toBe(session.merchants);
    expect(next.profiles).not.toBe(session.profiles);
    expect(session.merchants).toHaveLength(0);
    expect(session.profiles).toHaveLength(0);
  });
});

describe("MerchantsStep — remove merchant", () => {
  it("removes the merchant and its profiles without mutating the source", async () => {
    const user = userEvent.setup();
    const m1 = createMerchant("Alpha Books", "alpha-books");
    const m2 = createMerchant("Beta Cafe", "beta-cafe");
    const session = makeSession([m1, m2]);
    const { patch } = renderStep(session);

    await user.click(screen.getAllByTitle("Remove merchant and its profiles")[0]);

    const next = applyLastPatch(patch, session);
    expect(next.merchants.map((m) => m.id)).toEqual([m2.id]);
    expect(next.merchants[0]).toBe(m2); // untouched entries keep identity
    expect(next.profiles.map((p) => p.merchantId)).toEqual([m2.id]);
    expect(session.merchants).toHaveLength(2);
    expect(next.merchants).not.toBe(session.merchants);
  });
});

describe("MerchantsStep — field updates", () => {
  it("patches only the selected merchant, keeping sibling identities", async () => {
    const user = userEvent.setup();
    const m1 = createMerchant("Alpha Books", "alpha-books");
    const m2 = createMerchant("Beta Cafe", "beta-cafe");
    const session = makeSession([m1, m2]);
    const { patch } = renderStep(session);

    // First merchant is selected by default; its editor shows current values.
    await user.type(screen.getByDisplayValue("Alpha Books"), "!");

    const next = applyLastPatch(patch, session);
    expect(next.merchants[0].dba).toBe("Alpha Books!");
    expect(next.merchants[0]).not.toBe(m1);
    expect(next.merchants[1]).toBe(m2);
    expect(next.merchants).not.toBe(session.merchants);
    expect(m1.dba).toBe("Alpha Books"); // source untouched
  });
});

describe("MerchantsStep — error gating", () => {
  const fieldErrors = { "merchants.0.dba": "DBA is required" };

  it("hides field errors until the step has been visited", () => {
    const m1 = createMerchant("", "alpha-books");
    const session = makeSession([m1]);
    renderStep(session, fieldErrors);
    expect(screen.queryByText("DBA is required")).not.toBeInTheDocument();
    expect(screen.queryByText("At least one merchant is required.")).not.toBeInTheDocument();
  });

  it("shows field errors once the step is in visitedSteps", () => {
    const m1 = createMerchant("", "alpha-books");
    const session = makeSession([m1]);
    session.visitedSteps = ["merchants"];
    renderStep(session, fieldErrors);
    expect(screen.getByText("DBA is required")).toBeInTheDocument();
  });

  it("shows the empty-merchants alert only after the step was visited", () => {
    const session = makeSession();
    session.visitedSteps = ["merchants"];
    renderStep(session);
    expect(screen.getByText("At least one merchant is required.")).toBeInTheDocument();
  });
});

describe("MerchantsStep — advanced settings", () => {
  it("renders the AdvancedSettingsPanel inside a closed-by-default Collapse", () => {
    const session = makeSession([createMerchant("Alpha Books", "alpha-books")]);
    renderStep(session);

    expect(
      screen.getByRole("button", { name: /advanced merchant settings/i })
    ).toBeInTheDocument();
    // Panel content is present in the DOM (Collapse hides it with CSS only).
    expect(screen.getByText("Account Limits")).toBeInTheDocument();
    expect(screen.getByText("Refund Policy")).toBeInTheDocument();
    expect(screen.getByText("View Controls")).toBeInTheDocument();
  });
});
