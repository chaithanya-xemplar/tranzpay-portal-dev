import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createEmptySession, createMerchant } from "../../model/defaults";
import type { OnboardingMerchant, OnboardingSession } from "../../model/types";
import { validateSession } from "../../model/validateSession";
import ReviewStep from "./ReviewStep";

function renderReview(session: OnboardingSession) {
  return render(
    <ReviewStep
      session={session}
      validation={validateSession(session)}
      onGoToStep={vi.fn()}
      isActivating={false}
    />
  );
}

function sessionWithMerchant(mutate?: (m: OnboardingMerchant) => void): OnboardingSession {
  const session = createEmptySession("Test User");
  const merchant = createMerchant("Coastline Wellness", "coastline");
  mutate?.(merchant);
  session.merchants = [merchant];
  return session;
}

/** The ReviewRow whose label matches — lets "—" be asserted without ambiguity. */
function reviewRow(label: string): HTMLElement {
  const row = screen.getByText(label).parentElement;
  if (!row) throw new Error(`No review row for ${label}`);
  return row as HTMLElement;
}

describe("ReviewStep — formatAddress (via rendered output)", () => {
  it("joins the present address parts with commas, skipping empties", () => {
    const session = createEmptySession("Test User");
    session.company.mailingAddress = {
      line1: "123 Main St",
      line2: "",
      city: "Springfield",
      state: "CA",
      zip: "90210",
    };
    renderReview(session);
    expect(screen.getByText("123 Main St, Springfield, CA, 90210")).toBeInTheDocument();
  });

  it("renders the em-dash fallback for a fully empty address", () => {
    renderReview(createEmptySession("Test User"));
    expect(within(reviewRow("Mailing Address")).getByText("—")).toBeInTheDocument();
  });

  it("shows a merchant's own address when not using the company mailing address", () => {
    const session = sessionWithMerchant((m) => {
      m.useCompanyMailingAddress = false;
      m.address = { line1: "500 Ocean Ave", line2: "", city: "Santa Cruz", state: "CA", zip: "95060" };
    });
    renderReview(session);
    expect(
      screen.getByText(/500 Ocean Ave, Santa Cruz, CA, 95060/)
    ).toBeInTheDocument();
  });

  it("shows 'Uses Company mailing address' when the merchant reuses the company mailing address", () => {
    renderReview(sessionWithMerchant());
    expect(screen.getByText(/Uses Company mailing address/)).toBeInTheDocument();
  });
});

describe("ReviewStep — advancedSummary (via rendered output)", () => {
  it("renders no Advanced line when all advanced settings are defaults", () => {
    renderReview(sessionWithMerchant());
    expect(screen.queryByText(/Advanced:/)).not.toBeInTheDocument();
  });

  it("summarizes a custom paylink with its slug", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.behavior.customPaylinkEnabled = true;
      m.advanced.behavior.customPaylink = "acme-pay";
    });
    renderReview(session);
    expect(screen.getByText("Advanced: Paylink: acme-pay")).toBeInTheDocument();
  });

  it("falls back to an em dash when the paylink is enabled but the slug is empty", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.behavior.customPaylinkEnabled = true;
      m.advanced.behavior.customPaylink = "";
    });
    renderReview(session);
    expect(screen.getByText("Advanced: Paylink: —")).toBeInTheDocument();
  });

  it("includes the ACHVerifi account mode when enabled", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.achVerifi.enabled = true;
      m.advanced.achVerifi.accountMode = "custom";
    });
    renderReview(session);
    expect(screen.getByText("Advanced: ACHVerifi (custom)")).toBeInTheDocument();
  });

  it("lists shared vault and joins multiple parts with a middle dot", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.behavior.sharedVault = true;
      m.advanced.behavior.enableSubscriptions = true;
    });
    renderReview(session);
    expect(screen.getByText("Advanced: Shared vault · Subscriptions")).toBeInTheDocument();
  });

  it("counts one custom field with the singular label", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.ccCustomFields[0].en = "Policy Number";
    });
    renderReview(session);
    expect(screen.getByText("Advanced: 1 custom field")).toBeInTheDocument();
  });

  it("counts CC, ACH and API custom fields together with the plural label", () => {
    const session = sessionWithMerchant((m) => {
      m.advanced.ccCustomFields[0].en = "Policy Number";
      m.advanced.achCustomFields[1].en = "Claim ID";
      m.advanced.apiCustomFields = ["RefCode"];
    });
    renderReview(session);
    expect(screen.getByText("Advanced: 3 custom fields")).toBeInTheDocument();
  });
});
