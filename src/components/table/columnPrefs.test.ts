import type { ColumnDef } from "@tanstack/react-table";

import {
  buildColumnPrefs,
  hiddenColumnsOf,
  reconcileColumnPrefs,
  reorderColumns,
  setColumnVisibility,
  toColumnOrder,
  toVisibilityMap,
  visibleColumns,
  type TableColumnPref,
} from "./columnPrefs";

type Row = Record<string, unknown>;

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", id: "name", header: "Name" },
  { accessorKey: "email", id: "email", header: "Email" },
  { accessorKey: "status", id: "status", header: "Status" },
  { accessorKey: "action", id: "action", header: "Action" },
];

const keys = (prefs: TableColumnPref[]) => prefs.map((pref) => pref.key);

describe("buildColumnPrefs", () => {
  it("keeps the column order and marks everything visible by default", () => {
    const prefs = buildColumnPrefs(columns);

    expect(keys(prefs)).toEqual(["name", "email", "status", "action"]);
    expect(prefs.every((pref) => pref.visible)).toBe(true);
  });

  it("hides the columns named in hiddenColumns and sorts them last", () => {
    const prefs = buildColumnPrefs(columns, ["email"]);

    expect(keys(prefs)).toEqual(["name", "status", "email", "action"]);
    expect(prefs.find((pref) => pref.key === "email")?.visible).toBe(false);
  });

  it("matches hiddenColumns against the header text, case insensitively", () => {
    const prefs = buildColumnPrefs(columns, ["STATUS"]);

    expect(prefs.find((pref) => pref.key === "status")?.visible).toBe(false);
  });

  it("locks the action column so it is never hidden or draggable", () => {
    const prefs = buildColumnPrefs(columns, ["action"]);
    const action = prefs.find((pref) => pref.key === "action");

    expect(action).toMatchObject({ locked: true, visible: true });
    expect(keys(visibleColumns(prefs))).not.toContain("action");
    expect(keys(hiddenColumnsOf(prefs))).not.toContain("action");
  });

  it("skips columns that have no resolvable key", () => {
    const prefs = buildColumnPrefs([{ header: "Orphan" } as ColumnDef<Row>]);

    expect(prefs).toEqual([]);
  });
});

describe("setColumnVisibility", () => {
  it("moves a hidden column to the end of the list", () => {
    const prefs = setColumnVisibility(buildColumnPrefs(columns), "name", false);

    expect(keys(prefs)).toEqual(["email", "status", "name", "action"]);
  });

  it("re-shows a column at the bottom of the visible block", () => {
    const hidden = setColumnVisibility(buildColumnPrefs(columns), "name", false);
    const shown = setColumnVisibility(hidden, "name", true);

    expect(keys(shown)).toEqual(["email", "status", "name", "action"]);
    expect(shown.find((pref) => pref.key === "name")?.visible).toBe(true);
  });

  it("refuses to hide a locked column", () => {
    const prefs = buildColumnPrefs(columns);

    expect(setColumnVisibility(prefs, "action", false)).toBe(prefs);
  });

  it("returns the same array when nothing would change", () => {
    const prefs = buildColumnPrefs(columns);

    expect(setColumnVisibility(prefs, "name", true)).toBe(prefs);
    expect(setColumnVisibility(prefs, "nope", false)).toBe(prefs);
  });
});

describe("reorderColumns", () => {
  it("moves a column by its index in the visible list", () => {
    const prefs = reorderColumns(buildColumnPrefs(columns), 2, 0);

    expect(keys(visibleColumns(prefs))).toEqual(["status", "name", "email"]);
  });

  it("holds the locked action column at its original position", () => {
    const withLeadingAction = buildColumnPrefs([columns[3], ...columns.slice(0, 3)]);

    const prefs = reorderColumns(withLeadingAction, 0, 2);

    expect(keys(prefs)).toEqual(["action", "email", "status", "name"]);
  });

  it("leaves hidden columns trailing after a reorder", () => {
    const hidden = setColumnVisibility(buildColumnPrefs(columns), "email", false);

    const prefs = reorderColumns(hidden, 1, 0);

    expect(keys(prefs)).toEqual(["status", "name", "email", "action"]);
  });

  it("ignores out-of-range indices", () => {
    const prefs = buildColumnPrefs(columns);

    expect(reorderColumns(prefs, 0, 9)).toBe(prefs);
    expect(reorderColumns(prefs, 1, 1)).toBe(prefs);
  });
});

describe("reconcileColumnPrefs", () => {
  it("adopts the incoming list when there is nothing to keep", () => {
    const next = buildColumnPrefs(columns);

    expect(reconcileColumnPrefs([], next)).toBe(next);
  });

  it("keeps the empty array when there are still no columns", () => {
    const prev: TableColumnPref[] = [];

    expect(reconcileColumnPrefs(prev, [])).toBe(prev);
  });

  it("keeps the user's order and visibility across a rebuild", () => {
    const edited = setColumnVisibility(
      reorderColumns(buildColumnPrefs(columns), 2, 0),
      "email",
      false
    );

    const reconciled = reconcileColumnPrefs(edited, buildColumnPrefs(columns));

    expect(keys(reconciled)).toEqual(keys(edited));
    expect(reconciled.find((pref) => pref.key === "email")?.visible).toBe(false);
  });

  it("adds new columns and drops departed ones", () => {
    const prev = buildColumnPrefs(columns.slice(0, 2));
    const next = buildColumnPrefs([columns[1], columns[2]]);

    expect(keys(reconcileColumnPrefs(prev, next))).toEqual(["email", "status"]);
  });

  it("returns the previous array when nothing changed, so effects settle", () => {
    const prev = buildColumnPrefs(columns);

    expect(reconcileColumnPrefs(prev, buildColumnPrefs(columns))).toBe(prev);
  });

  it("takes a renamed header from the incoming list", () => {
    const prev = buildColumnPrefs(columns);
    const renamed = buildColumnPrefs([
      { accessorKey: "name", id: "name", header: "Full name" },
      ...columns.slice(1),
    ]);

    expect(reconcileColumnPrefs(prev, renamed)[0].label).toBe("Full name");
  });
});

describe("table state adapters", () => {
  it("maps prefs to a column order and a visibility map", () => {
    const prefs = setColumnVisibility(buildColumnPrefs(columns), "email", false);

    expect(toColumnOrder(prefs)).toEqual(["name", "status", "email", "action"]);
    expect(toVisibilityMap(prefs)).toEqual({
      name: true,
      status: true,
      action: true,
      email: false,
    });
  });
});
