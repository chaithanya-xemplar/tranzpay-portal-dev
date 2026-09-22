import { useEffect, useState } from "react";
import clsx from "clsx";

import { Button, Drawer, Radio } from "../../design-system";
import type { ExportScope } from "./useTableExport";

interface ExportDrawerProps {
  open: boolean;
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  /** Rows on the current page, and rows the criteria match in total. */
  pageRows: number;
  totalRows: number;
  maxRows: number;
  isExporting: boolean;
}

/* A bordered radio row that lights up when chosen. The box is a plain div:
   `Radio` already renders its own <label>, and nesting one inside another is
   invalid and double-fires the click. */
function RadioRow({
  checked,
  disabled,
  onSelect,
  name,
  value,
  label,
  hint,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-md border px-3 py-2.5",
        disabled
          ? "border-divider opacity-60"
          : checked
            ? "border-primary bg-primary_light2"
            : "border-divider hover:border-primary"
      )}
    >
      <Radio
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="w-full"
        label={
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-dark-grey">{label}</span>
            <span className="text-xs text-light-grey">{hint}</span>
          </span>
        }
      />
    </div>
  );
}

/**
 * Scope and format for a table export.
 *
 * The file is assembled in the browser from the rows the criteria match, which
 * is why the scope choice is explicit: the grid holds one page, and a file that
 * silently covered only that page would misrepresent what the filters describe.
 *
 * Excel and PDF are shown but disabled. A real `.xlsx` needs a spreadsheet
 * library and a PDF needs a renderer — both belong server-side, where the
 * export can also be masked at generation. Leaving them visible keeps the gap
 * honest rather than pretending the formats were never wanted.
 */
export default function ExportDrawer({
  open,
  onClose,
  onExport,
  pageRows,
  totalRows,
  maxRows,
  isExporting,
}: ExportDrawerProps) {
  const [scope, setScope] = useState<ExportScope>("all");

  useEffect(() => {
    if (open) setScope("all");
  }, [open]);

  const capped = totalRows > maxRows;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Export"
      subtitle="Downloads the columns and order you have applied."
      width="w-[26rem]"
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-light-grey">
              Rows
            </legend>

            <RadioRow
              name="exportScope"
              value="all"
              label="All matching rows"
              hint={`${totalRows.toLocaleString()} row${totalRows === 1 ? "" : "s"} across every page`}
              checked={scope === "all"}
              onSelect={() => setScope("all")}
            />
            <RadioRow
              name="exportScope"
              value="page"
              label="This page only"
              hint={`${pageRows.toLocaleString()} row${pageRows === 1 ? "" : "s"} currently shown`}
              checked={scope === "page"}
              onSelect={() => setScope("page")}
            />
          </fieldset>

          <fieldset className="mt-5 flex flex-col gap-2">
            <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-light-grey">
              Format
            </legend>

            <RadioRow
              name="exportFormat"
              value="csv"
              label="CSV"
              hint="Comma separated values — opens in Excel"
              checked
              onSelect={() => {}}
            />
            <RadioRow
              name="exportFormat"
              value="excel"
              label="Excel"
              hint="Requires the export API"
              checked={false}
              disabled
              onSelect={() => {}}
            />
            <RadioRow
              name="exportFormat"
              value="pdf"
              label="PDF"
              hint="Requires the export API"
              checked={false}
              disabled
              onSelect={() => {}}
            />
          </fieldset>

          {capped && scope === "all" && (
            <p className="mt-4 rounded-md border border-warning bg-warning-bg px-3 py-2 text-xs text-medium-grey">
              This search matches {totalRows.toLocaleString()} rows. The file
              will hold the first {maxRows.toLocaleString()} — narrow the
              filters to export the rest.
            </p>
          )}

          <p className="mt-4 rounded-md border border-divider bg-divider2 px-3 py-2 text-xs text-light-grey">
            Masked values stay masked in the file, and columns you have hidden
            are left out.
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-divider pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            icon="download"
            iconPosition="left"
            loading={isExporting}
            onClick={() => onExport(scope)}
          >
            Download CSV
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
