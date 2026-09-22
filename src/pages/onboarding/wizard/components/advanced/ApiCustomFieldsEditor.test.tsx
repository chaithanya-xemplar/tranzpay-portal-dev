import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { API_CUSTOM_FIELD_MAX } from "../../../model/constants";
import ApiCustomFieldsEditor from "./ApiCustomFieldsEditor";

type OnChange = (next: string[]) => void;

function renderEditor(fields: string[]) {
  const onChange = vi.fn<OnChange>();
  render(<ApiCustomFieldsEditor fields={fields} onChange={onChange} />);
  return { onChange };
}

function lastCall(onChange: ReturnType<typeof vi.fn<OnChange>>): string[] {
  const call = onChange.mock.calls.at(-1);
  if (!call) throw new Error("onChange was not called");
  return call[0];
}

describe("ApiCustomFieldsEditor", () => {
  it("shows the empty state and appends an empty slot on Add", async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor([]);

    expect(screen.getByText("No API custom fields configured.")).toBeInTheDocument();
    expect(screen.getByText(`0/${API_CUSTOM_FIELD_MAX} used`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add custom field/i }));
    expect(lastCall(onChange)).toEqual([""]);
  });

  it("labels slots starting at CustomField5 and shows the used counter", () => {
    renderEditor(["PolicyDate", "RefCode"]);
    expect(screen.getByText("CustomField5")).toBeInTheDocument();
    expect(screen.getByText("CustomField6")).toBeInTheDocument();
    expect(screen.getByText(`2/${API_CUSTOM_FIELD_MAX} used`)).toBeInTheDocument();
  });

  it("editing a slot patches only that index, immutably", async () => {
    const user = userEvent.setup();
    const fields = ["PolicyDate", "RefCode"];
    const { onChange } = renderEditor(fields);

    await user.type(screen.getByDisplayValue("PolicyDate"), "X");

    const next = lastCall(onChange);
    expect(next).toEqual(["PolicyDateX", "RefCode"]);
    expect(next).not.toBe(fields);
    expect(fields).toEqual(["PolicyDate", "RefCode"]); // source untouched
  });

  it("removing a slot drops exactly that index", async () => {
    const user = userEvent.setup();
    const { onChange } = renderEditor(["PolicyDate", "RefCode"]);

    await user.click(screen.getAllByTitle("Remove this field")[0]);
    expect(lastCall(onChange)).toEqual(["RefCode"]);
  });

  it("still allows adding at one below the cap", async () => {
    const user = userEvent.setup();
    const fields = Array.from({ length: API_CUSTOM_FIELD_MAX - 1 }, (_, i) => `Field${i + 5}`);
    const { onChange } = renderEditor(fields);

    const addButton = screen.getByRole("button", { name: /add custom field/i });
    expect(addButton).toBeEnabled();
    await user.click(addButton);
    expect(lastCall(onChange)).toHaveLength(API_CUSTOM_FIELD_MAX);
  });

  it("replaces the Add button with a full-capacity message at the cap", () => {
    const fields = Array.from({ length: API_CUSTOM_FIELD_MAX }, (_, i) => `Field${i + 5}`);
    renderEditor(fields);

    expect(screen.queryByRole("button", { name: /add custom field/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(`All ${API_CUSTOM_FIELD_MAX} API custom field slots are in use.`)
    ).toBeInTheDocument();
    // Last slot is CustomField20 (slots 5–20).
    expect(screen.getByText("CustomField20")).toBeInTheDocument();
  });
});
