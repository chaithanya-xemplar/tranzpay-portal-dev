import { describe, it, expect } from "vitest";
import type { WizardStep } from "../../../design-system/wizard/WizardShell";
import {
  API_CUSTOM_FIELD_FIRST_SLOT,
  API_CUSTOM_FIELD_MAX,
  PROCESSOR_CATALOG,
  processorLabel,
  processorRails,
  STEP_DEFS,
  STEP_NUMBERS,
  STEP_ORDER,
  STEP_TITLES,
  USER_TEMPLATES,
  userTemplateLabel,
} from "./constants";

describe("processorLabel", () => {
  it.each([
    ["NMI", "NMI"],
    ["TPY", "Tranzpay (TPY)"],
    ["PHQ_PXP", "PHQ-PXP"],
    ["FIRSTDATA", "FirstData"],
  ] as const)("%s → %s", (code, label) => {
    expect(processorLabel(code)).toBe(label);
  });

  it("falls back to an em dash for an unselected processor", () => {
    expect(processorLabel("")).toBe("—");
  });
});

describe("processorRails", () => {
  it.each([
    ["NMI", { cc: true, ach: false }],
    ["TSYS", { cc: true, ach: false }],
    ["PXP", { cc: true, ach: true }],
    ["PHQ_PXP", { cc: true, ach: true }],
    ["TPY", { cc: false, ach: true }],
    ["FISERV", { cc: true, ach: false }],
    ["FIRSTDATA", { cc: true, ach: false }],
  ] as const)("%s supports %o", (code, rails) => {
    expect(processorRails(code)).toEqual(rails);
  });

  it("returns no rails for an unselected processor", () => {
    expect(processorRails("")).toEqual({ cc: false, ach: false });
  });

  it("matches the catalog entry for every code", () => {
    for (const entry of PROCESSOR_CATALOG) {
      expect(processorRails(entry.code)).toEqual(entry.rails);
      expect(processorLabel(entry.code)).toBe(entry.label);
    }
  });
});

describe("userTemplateLabel", () => {
  it.each([
    ["treasury-manager", "Treasury Manager"],
    ["editor", "Editor"],
    ["report-consumer", "Report Consumer"],
  ])("%s → %s", (id, label) => {
    expect(userTemplateLabel(id)).toBe(label);
  });

  it("falls back to an em dash for unknown or empty template ids", () => {
    expect(userTemplateLabel("no-such-template")).toBe("—");
    expect(userTemplateLabel("")).toBe("—");
  });

  it("resolves every id in every group", () => {
    for (const group of USER_TEMPLATES) {
      for (const template of group.templates) {
        expect(userTemplateLabel(template.id)).toBe(template.label);
      }
    }
  });
});

describe("step metadata consistency", () => {
  function flatten(steps: WizardStep[]): string[] {
    return steps.flatMap((s) => [s.id, ...flatten(s.children ?? [])]);
  }

  it("STEP_ORDER matches the flattened STEP_DEFS tree", () => {
    expect(STEP_ORDER).toEqual(flatten(STEP_DEFS));
  });

  it("STEP_NUMBERS and STEP_TITLES cover exactly the ids in STEP_ORDER", () => {
    expect(Object.keys(STEP_NUMBERS).sort()).toEqual([...STEP_ORDER].sort());
    expect(Object.keys(STEP_TITLES).sort()).toEqual([...STEP_ORDER].sort());
  });

  it("child steps carry lettered sub-numbers of their parent", () => {
    expect(STEP_NUMBERS.merchants).toBe("4");
    expect(STEP_NUMBERS.processing).toBe("4a");
    expect(STEP_NUMBERS.profiles).toBe("4b");
  });

  it("STEP_TITLES agrees with STEP_DEFS titles", () => {
    for (const def of STEP_DEFS) {
      expect(STEP_TITLES[def.id as keyof typeof STEP_TITLES]).toBe(def.title);
      for (const child of def.children ?? []) {
        expect(STEP_TITLES[child.id as keyof typeof STEP_TITLES]).toBe(child.title);
      }
    }
  });
});

describe("API custom-field slot constants", () => {
  it("slots 5–20 hold at most 16 API custom fields", () => {
    expect(API_CUSTOM_FIELD_FIRST_SLOT).toBe(5);
    expect(API_CUSTOM_FIELD_MAX).toBe(16);
    // Last slot is CustomField20.
    expect(API_CUSTOM_FIELD_FIRST_SLOT + API_CUSTOM_FIELD_MAX - 1).toBe(20);
  });
});
