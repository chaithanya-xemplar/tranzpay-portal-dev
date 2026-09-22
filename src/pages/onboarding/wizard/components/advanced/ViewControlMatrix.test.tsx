import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VIEW_CONTROL_FIELDS, VIEW_SURFACES } from "../../../model/constants";
import { createAdvancedSettings } from "../../../model/defaults";
import type { ViewControls } from "../../../model/types";
import ViewControlMatrix from "./ViewControlMatrix";

type OnChange = (next: ViewControls) => void;

function renderMatrix(value: ViewControls) {
  const onChange = vi.fn<OnChange>();
  render(<ViewControlMatrix value={value} onChange={onChange} />);
  return { onChange };
}

function lastCall(onChange: ReturnType<typeof vi.fn<OnChange>>): ViewControls {
  const call = onChange.mock.calls.at(-1);
  if (!call) throw new Error("onChange was not called");
  return call[0];
}

describe("ViewControlMatrix", () => {
  it("toggling one cell updates only that surface/field pair", async () => {
    const user = userEvent.setup();
    const value = createAdvancedSettings().viewControls;
    const { onChange } = renderMatrix(value);

    expect(value.paylink.displayCity).toBe(false);
    await user.click(screen.getByRole("checkbox", { name: "Display city — Paylink" }));

    const next = lastCall(onChange);
    expect(next.paylink.displayCity).toBe(true);
    // Every other paylink field is unchanged.
    for (const f of VIEW_CONTROL_FIELDS) {
      if (f.key === "displayCity") continue;
      expect(next.paylink[f.key]).toBe(value.paylink[f.key]);
    }
    // Untouched surfaces keep their object identity.
    expect(next.hosted).toBe(value.hosted);
    expect(next.vt).toBe(value.vt);
    expect(next.vault3p).toBe(value.vault3p);
    expect(next).not.toBe(value);
    expect(next.paylink).not.toBe(value.paylink);
  });

  it("unchecks a default-on cell", async () => {
    const user = userEvent.setup();
    const value = createAdvancedSettings().viewControls;
    expect(value.paylink.displayDescription).toBe(true);
    const { onChange } = renderMatrix(value);

    await user.click(screen.getByRole("checkbox", { name: "Display description — Paylink" }));
    expect(lastCall(onChange).paylink.displayDescription).toBe(false);
  });

  it("'Select all' turns every field on for that column only", async () => {
    const user = userEvent.setup();
    const value = createAdvancedSettings().viewControls;
    const { onChange } = renderMatrix(value);

    // Defaults: no column fully on → four "Select all" buttons in surface order.
    const buttons = screen.getAllByRole("button", { name: "Select all" });
    expect(buttons).toHaveLength(VIEW_SURFACES.length);
    await user.click(buttons[0]); // paylink

    const next = lastCall(onChange);
    for (const f of VIEW_CONTROL_FIELDS) expect(next.paylink[f.key]).toBe(true);
    expect(next.hosted).toBe(value.hosted);
    expect(next.vt).toBe(value.vt);
    expect(next.vault3p).toBe(value.vault3p);
  });

  it("a fully-on column shows 'Clear' in the header row and clears on click", async () => {
    const user = userEvent.setup();
    const value = createAdvancedSettings().viewControls;
    for (const f of VIEW_CONTROL_FIELDS) value.paylink[f.key] = true;
    const { onChange } = renderMatrix(value);

    expect(screen.getAllByRole("button", { name: "Clear" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Select all" })).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    const next = lastCall(onChange);
    for (const f of VIEW_CONTROL_FIELDS) expect(next.paylink[f.key]).toBe(false);
  });
});
