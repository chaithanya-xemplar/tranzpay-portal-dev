import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastContext } from "../../../../design-system/toast/ToastContext";
import { createEmptySession, createMerchant, createProcessorEntry } from "../../model/defaults";
import type { OnboardingSession, ProcessorEntry } from "../../model/types";
import type { StepProps } from "../stepProps";
import ProcessingStep from "./ProcessingStep";

type Patch = StepProps["patch"];

function makeProcessor(overrides: Partial<ProcessorEntry>): ProcessorEntry {
  return { ...createProcessorEntry(), ...overrides };
}

interface Fixture {
  session: OnboardingSession;
  p1: ProcessorEntry; // PXP: cc + ach, enabled
  p2: ProcessorEntry; // NMI: cc only, enabled
  p3: ProcessorEntry; // TSYS picked but no rails on, disabled
}

function makeFixture(mutate?: (f: Fixture) => void): Fixture {
  const session = createEmptySession("Test User");
  const merchant = createMerchant("Harbor Cafe", "harbor-cafe");
  const p1 = makeProcessor({ processorCode: "PXP", rails: { cc: true, ach: true }, enabled: true });
  const p2 = makeProcessor({ processorCode: "NMI", rails: { cc: true, ach: false }, enabled: true });
  const p3 = makeProcessor({ processorCode: "TSYS", rails: { cc: false, ach: false }, enabled: false });
  merchant.processing.processors = [p1, p2, p3];
  merchant.processing.priority = { cc: [p1.id, p2.id], ach: [p1.id] };
  session.merchants = [merchant];
  const fixture: Fixture = { session, p1, p2, p3 };
  mutate?.(fixture);
  return fixture;
}

function renderStep(session: OnboardingSession) {
  const patch = vi.fn<Patch>();
  const toast = vi.fn();
  render(
    <ToastContext.Provider value={{ toast, dismiss: vi.fn() }}>
      <ProcessingStep session={session} patch={patch} fieldErrors={{}} />
    </ToastContext.Provider>
  );
  return { patch, toast };
}

function applyLastPatch(patch: ReturnType<typeof vi.fn<Patch>>, base: OnboardingSession) {
  const call = patch.mock.calls.at(-1);
  if (!call) throw new Error("patch was not called");
  return call[0](base);
}

describe("ProcessingStep — rail flags sync priority lists", () => {
  it("turning a processor's CC rail off removes it from the CC priority and disables it when railless", async () => {
    const user = userEvent.setup();
    const { session, p1, p2 } = makeFixture();
    const { patch } = renderStep(session);

    // Row order matches processors array: [p1, p2, p3].
    await user.click(screen.getAllByTitle("Toggle CC support")[1]);

    const next = applyLastPatch(patch, session);
    const processing = next.merchants[0].processing;
    const nextP2 = processing.processors.find((p) => p.id === p2.id);
    expect(nextP2).toMatchObject({ rails: { cc: false, ach: false }, enabled: false });
    expect(processing.priority.cc).toEqual([p1.id]);
    expect(processing.priority.ach).toEqual([p1.id]);
    // Source session untouched.
    expect(session.merchants[0].processing.priority.cc).toEqual([p1.id, p2.id]);
  });

  it("turning a rail on appends the processor to the end of that rail's priority", async () => {
    const user = userEvent.setup();
    const { session, p1, p2, p3 } = makeFixture();
    const { patch } = renderStep(session);

    await user.click(screen.getAllByTitle("Toggle CC support")[2]); // p3 (TSYS)

    const next = applyLastPatch(patch, session);
    const processing = next.merchants[0].processing;
    expect(processing.processors.find((p) => p.id === p3.id)?.rails.cc).toBe(true);
    expect(processing.priority.cc).toEqual([p1.id, p2.id, p3.id]);
  });

  it("blocks enabling a rail the processor cannot support and warns instead of patching", async () => {
    const user = userEvent.setup();
    const { session } = makeFixture();
    const { patch, toast } = renderStep(session);

    await user.click(screen.getAllByTitle("Toggle ACH support")[1]); // p2 is NMI (CC-only)

    expect(patch).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "warning", title: "NMI does not support ACH" })
    );
  });
});

describe("ProcessingStep — processor enabled toggle", () => {
  it("disabling a processor keeps it in the priority arrays (rendered as Disabled)", async () => {
    const user = userEvent.setup();
    const { session, p1, p2 } = makeFixture();
    const { patch } = renderStep(session);

    // Switch order: [cc rail, ach rail, CC list p1, CC list p2, ACH list p1,
    // table p1, table p2, table p3]. Index 2 = p1's toggle in the CC priority list.
    await user.click(screen.getAllByRole("switch")[2]);

    const next = applyLastPatch(patch, session);
    const processing = next.merchants[0].processing;
    expect(processing.processors.find((p) => p.id === p1.id)?.enabled).toBe(false);
    // Not removed from priorities — only rail flags drive membership.
    expect(processing.priority.cc).toEqual([p1.id, p2.id]);
    expect(processing.priority.ach).toEqual([p1.id]);
  });

  it("refuses to enable a processor with no rails and warns", async () => {
    const user = userEvent.setup();
    const { session } = makeFixture();
    const { patch, toast } = renderStep(session);

    // p3 has no rails on, so its only toggle is its Processors-table row — the
    // last switch on the page (after the rail cards and priority-list toggles).
    const switches = screen.getAllByRole("switch");
    await user.click(switches[switches.length - 1]);

    expect(patch).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "warning", title: "Enable at least one rail" })
    );
  });

  it("marks a disabled processor with a Disabled pill and promotes the next enabled one to Primary", () => {
    const { session } = makeFixture((f) => {
      f.p1.enabled = false;
      f.session.merchants[0].processing.ach.enabled = false; // only the CC list renders
    });
    renderStep(session);

    const items = screen.getAllByRole("listitem"); // CC priority list: [p1, p2]
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Disabled");
    expect(items[1]).toHaveTextContent("PRIMARY");
    expect(items[1]).not.toHaveTextContent("Disabled");
  });
});

describe("ProcessingStep — reorder within a rail", () => {
  it("drag-and-drop swaps priority order for that rail only", () => {
    const { session, p1, p2 } = makeFixture();
    const { patch } = renderStep(session);

    // List items across the page: CC list [p1, p2] then ACH list [p1].
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    const dataTransfer = { effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(items[1], { dataTransfer });
    fireEvent.dragOver(items[0], { dataTransfer });
    fireEvent.drop(items[0], { dataTransfer });

    const next = applyLastPatch(patch, session);
    const processing = next.merchants[0].processing;
    expect(processing.priority.cc).toEqual([p2.id, p1.id]);
    // The other rail's array is reused untouched.
    expect(processing.priority.ach).toBe(session.merchants[0].processing.priority.ach);
  });
});

describe("ProcessingStep — rail enablement", () => {
  it("toggling CC processing off patches only that rail config", async () => {
    const user = userEvent.setup();
    const { session } = makeFixture();
    const { patch } = renderStep(session);

    await user.click(screen.getAllByRole("switch")[0]); // CC rail card

    const next = applyLastPatch(patch, session);
    const processing = next.merchants[0].processing;
    expect(processing.cc.enabled).toBe(false);
    expect(processing.ach.enabled).toBe(true);
    expect(processing.processors).toBe(session.merchants[0].processing.processors);
  });

  it("shows a guard message when there are no merchants", () => {
    const session = createEmptySession("Test User");
    renderStep(session);
    expect(
      screen.getByText(/Add at least one merchant on the previous step to configure processing/i)
    ).toBeInTheDocument();
  });
});
