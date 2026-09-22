import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createEmptySession } from "../../model/defaults";
import type { OnboardingSession } from "../../model/types";
import type { StepProps } from "../stepProps";
import AccountStep from "./AccountStep";

vi.mock("../../../../services/onboarding/onboardingApi", () => ({
  useAccountOptions: () => ({
    data: [
      {
        id: "acct_1",
        name: "Existing Account",
        contact: { firstName: "Ava", lastName: "Stone", title: "", email: "ava@example.com", phone: "5551231234" },
        address: { line1: "1 Main St", line2: "", city: "Irvine", state: "CA", zip: "92614" },
      },
    ],
  }),
}));

type Patch = StepProps["patch"];

function renderStep(session: OnboardingSession) {
  const patch = vi.fn<Patch>();
  render(<AccountStep session={session} patch={patch} fieldErrors={{}} />);
  return { patch };
}

function applyLastPatch(patch: ReturnType<typeof vi.fn<Patch>>, base: OnboardingSession) {
  const call = patch.mock.calls.at(-1);
  if (!call) throw new Error("patch was not called");
  return call[0](base);
}

describe("AccountStep - segment changes", () => {
  it("resets existing and new-account values when switching account mode", async () => {
    const user = userEvent.setup();
    const session = createEmptySession("Test User");
    session.account = {
      mode: "existing",
      existing: {
        id: "acct_1",
        name: "Existing Account",
        contact: { firstName: "Ava", lastName: "Stone", title: "", email: "ava@example.com", phone: "5551231234" },
        address: { line1: "1 Main St", line2: "", city: "Irvine", state: "CA", zip: "92614" },
      },
      newAccount: {
        name: "Draft Group",
        contact: { firstName: "Nia", lastName: "Chen", title: "Owner", email: "nia@example.com", phone: "5551112222" },
        address: { line1: "99 Draft Ave", line2: "Suite 5", city: "Austin", state: "TX", zip: "73301" },
      },
    };
    const { patch } = renderStep(session);

    await user.click(screen.getByRole("radio", { name: /create new/i }));

    const next = applyLastPatch(patch, session);
    expect(next.account).toEqual({
      mode: "new",
      existing: null,
      newAccount: {
        name: "",
        contact: { firstName: "", lastName: "", title: "", email: "", phone: "" },
        address: { line1: "", line2: "", city: "", state: "", zip: "" },
      },
    });
  });
});
