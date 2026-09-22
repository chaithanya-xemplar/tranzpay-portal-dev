// src/components/table/columnPrefs.ts
import type { ColumnDef } from "@tanstack/react-table";

/**
 * One row in the columns drawer: what it is called, whether it shows, and
 * where it sits. The array's order *is* the column order.
 */
export interface TableColumnPref {
  key: string;
  label: string;
  visible: boolean;
  /** Action columns: always shown, never dragged, absent from the drawer. */
  locked?: boolean;
}

/** A column's stable id — `accessorKey` when it is a string, else `id`. */
export function getColKey<TData, TValue>(
  col: ColumnDef<TData, TValue>
): string | undefined {
  if (
    "accessorKey" in col &&
    typeof (col as { accessorKey?: unknown }).accessorKey === "string"
  ) {
    return (col as { accessorKey: string }).accessorKey;
  }

  return typeof col.id === "string" ? col.id : undefined;
}

export function isActionColumn<TData, TValue>(
  col: ColumnDef<TData, TValue>
): boolean {
  const key = getColKey(col);
  const header = col.header ? String(col.header).trim().toLowerCase() : "";
  return key === "action" || header === "action";
}

export function normalizeColumnKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Seeds the drawer from the table's columns.
 *
 * `hiddenColumns` matches on either the key or the header text, case
 * insensitively — the prop has always been used both ways. Unlike the old
 * dropdown it only sets the *starting* state: a hidden column still appears in
 * the drawer and can be brought back.
 */
export function buildColumnPrefs<T>(
  columns: ColumnDef<T>[],
  hiddenColumns: string[] = []
): TableColumnPref[] {
  const hidden = new Set(hiddenColumns.map(normalizeColumnKey));

  const prefs = columns.flatMap<TableColumnPref>((col) => {
    const key = getColKey(col);
    if (!key) return [];

    const label = col.header ? String(col.header).trim() : key;
    const locked = isActionColumn(col);

    return [
      {
        key,
        label: label || key,
        visible:
          locked ||
          !(
            hidden.has(normalizeColumnKey(key)) ||
            (label !== "" && hidden.has(normalizeColumnKey(label)))
          ),
        ...(locked ? { locked: true } : {}),
      },
    ];
  });

  return sortHiddenLast(prefs);
}

/**
 * Keeps what the user has already chosen while absorbing a new column list.
 *
 * Columns arrive with the first response, so the first `next` is empty and the
 * real one lands a tick later; and a page can swap datasets under the same
 * table. Existing keys keep the user's order and visibility, new keys join at
 * their default position, departed keys drop out. Returns `prev` untouched when
 * nothing changed, so this is safe to call from an effect.
 */
export function reconcileColumnPrefs(
  prev: TableColumnPref[],
  next: TableColumnPref[]
): TableColumnPref[] {
  // Identity matters: this feeds a setState in an effect whose dependency is
  // rebuilt every render, so handing back a fresh empty array would loop.
  if (prev.length === 0) return next.length === 0 ? prev : next;

  const nextByKey = new Map(next.map((pref) => [pref.key, pref]));
  const kept = prev
    .filter((pref) => nextByKey.has(pref.key))
    // Label and locked come from the fresh list; only the user's choice carries over.
    .map((pref) => ({ ...nextByKey.get(pref.key)!, visible: pref.visible }));

  const keptKeys = new Set(kept.map((pref) => pref.key));
  const added = next.filter((pref) => !keptKeys.has(pref.key));

  const merged = sortHiddenLast([...kept, ...added]);

  return isSamePrefs(prev, merged) ? prev : merged;
}

export function isSamePrefs(a: TableColumnPref[], b: TableColumnPref[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (pref, i) =>
        pref.key === b[i].key &&
        pref.visible === b[i].visible &&
        pref.label === b[i].label
    )
  );
}

/** The rows the drawer lets you drag — visible, unlocked, in display order. */
export function visibleColumns(prefs: TableColumnPref[]): TableColumnPref[] {
  return prefs.filter((pref) => pref.visible && !pref.locked);
}

export function hiddenColumnsOf(prefs: TableColumnPref[]): TableColumnPref[] {
  return prefs.filter((pref) => !pref.visible && !pref.locked);
}

/**
 * Moves a draggable row. `fromIndex`/`toIndex` index the *visible* list the
 * drawer renders, not the full array — locked columns hold their absolute
 * position and hidden ones always trail.
 */
export function reorderColumns(
  prefs: TableColumnPref[],
  fromIndex: number,
  toIndex: number
): TableColumnPref[] {
  const visible = visibleColumns(prefs);
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= visible.length ||
    toIndex >= visible.length
  ) {
    return prefs;
  }

  const reordered = [...visible];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return withLocked(prefs, [...reordered, ...hiddenColumnsOf(prefs)]);
}

/**
 * Shows or hides one column. A column being hidden falls to the end of the
 * list; one being shown joins the bottom of the visible block, which is what
 * keeps "hidden columns sort last" true without the drawer policing indices.
 */
export function setColumnVisibility(
  prefs: TableColumnPref[],
  key: string,
  visible: boolean
): TableColumnPref[] {
  const target = prefs.find((pref) => pref.key === key);
  if (!target || target.locked || target.visible === visible) return prefs;

  const rest = prefs.filter((pref) => !pref.locked && pref.key !== key);
  const updated = { ...target, visible };

  const next = visible
    ? [
        ...rest.filter((pref) => pref.visible),
        updated,
        ...rest.filter((pref) => !pref.visible),
      ]
    : [...rest.filter((pref) => pref.visible), ...rest.filter((pref) => !pref.visible), updated];

  return withLocked(prefs, next);
}

/** TanStack `state.columnOrder`. */
export function toColumnOrder(prefs: TableColumnPref[]): string[] {
  return prefs.map((pref) => pref.key);
}

/** TanStack `state.columnVisibility`. */
export function toVisibilityMap(
  prefs: TableColumnPref[]
): Record<string, boolean> {
  return Object.fromEntries(prefs.map((pref) => [pref.key, pref.visible]));
}

function sortHiddenLast(prefs: TableColumnPref[]): TableColumnPref[] {
  const movable = prefs.filter((pref) => !pref.locked);
  return withLocked(prefs, [
    ...movable.filter((pref) => pref.visible),
    ...movable.filter((pref) => !pref.visible),
  ]);
}

/**
 * Re-seats locked columns at the absolute indices they held in `prefs`, so a
 * reorder of the movable columns never drags the Action column off its edge.
 */
function withLocked(
  prefs: TableColumnPref[],
  movable: TableColumnPref[]
): TableColumnPref[] {
  const lockedAt = new Map(
    prefs.flatMap((pref, i) => (pref.locked ? [[i, pref] as const] : []))
  );
  if (lockedAt.size === 0) return movable;

  const result: TableColumnPref[] = [];
  const queue = [...movable];

  for (let i = 0; i < prefs.length; i++) {
    const locked = lockedAt.get(i);
    result.push(locked ?? queue.shift()!);
  }

  return result;
}
