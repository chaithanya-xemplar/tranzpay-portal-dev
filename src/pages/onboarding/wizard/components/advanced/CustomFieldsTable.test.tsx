import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CustomFieldDef } from "../../../model/types";
import CustomFieldsTable from "./CustomFieldsTable";

type OnChange = (next: CustomFieldDef[]) => void;

function makeSlots(): CustomFieldDef[] {
  return Array.from({ length: 4 }, () => ({ en: "", es: "", required: false }));
}

function renderTable(fields: CustomFieldDef[]) {
  const onChange = vi.fn<OnChange>();
  render(<CustomFieldsTable fields={fields} onChange={onChange} />);
  return { onChange };
}

function lastCall(onChange: ReturnType<typeof vi.fn<OnChange>>): CustomFieldDef[] {
  const call = onChange.mock.calls.at(-1);
  if (!call) throw new Error("onChange was not called");
  return call[0];
}

describe("CustomFieldsTable", () => {
  it("renders one row per slot with English/Spanish inputs", () => {
    renderTable(makeSlots());
    expect(screen.getByPlaceholderText("Custom Field 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Custom Field 4")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Campo personalizado 1")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("editing an English label patches only that row, immutably", () => {
    const fields = makeSlots();
    const { onChange } = renderTable(fields);

    fireEvent.change(screen.getByPlaceholderText("Custom Field 2"), {
      target: { value: "Policy Number" },
    });

    const next = lastCall(onChange);
    expect(next[1]).toEqual({ en: "Policy Number", es: "", required: false });
    expect(next).not.toBe(fields);
    expect(next[1]).not.toBe(fields[1]);
    // Untouched rows keep identity; source stays pristine.
    expect(next[0]).toBe(fields[0]);
    expect(next[2]).toBe(fields[2]);
    expect(next[3]).toBe(fields[3]);
    expect(fields[1].en).toBe("");
  });

  it("editing a Spanish label patches the es field of that row", () => {
    const fields = makeSlots();
    const { onChange } = renderTable(fields);

    fireEvent.change(screen.getByPlaceholderText("Campo personalizado 3"), {
      target: { value: "Número de póliza" },
    });

    const next = lastCall(onChange);
    expect(next[2]).toEqual({ en: "", es: "Número de póliza", required: false });
    expect(next[0]).toBe(fields[0]);
  });

  it("toggling Required patches only that row's flag", async () => {
    const user = userEvent.setup();
    const fields = makeSlots();
    const { onChange } = renderTable(fields);

    await user.click(screen.getByRole("checkbox", { name: "Custom field 3 required" }));

    const next = lastCall(onChange);
    expect(next[2].required).toBe(true);
    expect(next.filter((f) => f.required)).toHaveLength(1);
    expect(next[2]).not.toBe(fields[2]);
    expect(next[1]).toBe(fields[1]);
  });
});
