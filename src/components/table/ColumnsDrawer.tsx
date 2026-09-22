import { useEffect, useState } from "react";

import {
  Button,
  Drawer,
  PriorityList,
  Toggle,
  type PriorityItem,
} from "../../design-system";
import {
  hiddenColumnsOf,
  reorderColumns,
  setColumnVisibility,
  visibleColumns,
  type TableColumnPref,
} from "./columnPrefs";

interface ColumnsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** The applied column list. Edits are staged until Apply. */
  columns: TableColumnPref[];
  /** The table's own defaults — what "Reset" restores. */
  defaultColumns: TableColumnPref[];
  onApply: (columns: TableColumnPref[]) => void;
}

/**
 * Column order and visibility for any list page.
 *
 * Edits are staged in local state and only committed by Apply, so a user can
 * experiment with a 25-column grid without the table re-rendering under them on
 * every click — and so Cancel is simply closing the drawer.
 *
 * Reorder is `PriorityList`'s HTML5 drag mechanic; hidden columns are listed
 * separately and are not draggable, which is what keeps the "hidden columns
 * sort last" invariant true without constraining drop indices.
 */
export default function ColumnsDrawer({
  open,
  onClose,
  columns,
  defaultColumns,
  onApply,
}: ColumnsDrawerProps) {
  const [staged, setStaged] = useState<TableColumnPref[]>(columns);

  // Re-stage whenever the drawer opens, so it always reflects what is applied
  // rather than a stale draft from a previous visit.
  useEffect(() => {
    if (open) setStaged(columns);
  }, [open, columns]);

  const visible = visibleColumns(staged);
  const hidden = hiddenColumnsOf(staged);

  const items: PriorityItem[] = visible.map((column) => ({
    id: column.key,
    label: column.label,
    trailing: (
      <Toggle
        checked
        aria-label={`Hide ${column.label}`}
        onChange={() => setStaged(setColumnVisibility(staged, column.key, false))}
      />
    ),
  }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Customize columns"
      subtitle="Drag to reorder. Toggle to show or hide."
      width="w-[26rem]"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <PriorityList
            items={items}
            primaryLabel={null}
            onReorder={(from, to) => setStaged(reorderColumns(staged, from, to))}
          />

          {hidden.length > 0 && (
            <>
              <p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wide text-light-grey">
                Hidden ({hidden.length})
              </p>

              <ul className="divide-y divide-divider rounded-lg border border-divider">
                {hidden.map((column) => (
                  <li
                    key={column.key}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="truncate text-sm text-medium-grey">
                      {column.label}
                    </span>
                    <Toggle
                      checked={false}
                      aria-label={`Show ${column.label}`}
                      onChange={() =>
                        setStaged(setColumnVisibility(staged, column.key, true))
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-divider pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStaged(defaultColumns)}
          >
            Reset to default
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={visible.length === 0}
              onClick={() => {
                onApply(staged);
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
