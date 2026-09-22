import { useCallback, useState } from "react";
import type { Table } from "@tanstack/react-table";

import api from "../../services/axios";
import { useToast } from "../../design-system/toast/ToastContext";
import type { TableQueryParams } from "../../types/table";
import { adaptTableResponse } from "../../utils/tableResponseAdapter";
import { stringifyCellValue, toCsvBlob } from "../../utils/csv";
import { buildExportFilename, triggerDownload } from "../../utils/download";
import { getErrorMessage } from "../../utils/error";
import { isActionColumn } from "./columnPrefs";

/** Ceiling on a single "all rows" export — one request, one file, no paging. */
export const EXPORT_MAX_ROWS = 10_000;

export type ExportScope = "page" | "all";

interface UseTableExportOptions<T extends Record<string, unknown>> {
  table: Table<T>;
  /** Dataset key, as passed to `useTableData` — selects the response adapter. */
  datasetKey: string;
  url?: string;
  /** The criteria currently on screen; the export matches what is displayed. */
  params: TableQueryParams;
  /** Rows held in memory instead of fetched (static tables). */
  staticRows?: T[];
  /** Names the file: "Corp Account List" → `corp-account-list_2026-09-21.csv`. */
  title: string;
}

/**
 * Turns the table the user built into a CSV.
 *
 * Cells are read from row data rather than the rendered DOM, so a column whose
 * cell renderer masks a value (bank accounts, routing numbers) would otherwise
 * export it in full. `meta.exportValue` re-applies that masking and
 * `meta.exportable: false` withholds the column entirely — both live on the
 * column definition, next to the renderer they mirror, so the two cannot drift
 * apart unnoticed.
 *
 * "All matching rows" re-runs the current criteria in one request rather than
 * walking pages, and deliberately bypasses the React Query cache: a
 * ten-thousand-row payload has no business outliving the download.
 */
export function useTableExport<T extends Record<string, unknown>>({
  table,
  datasetKey,
  url,
  params,
  staticRows,
  title,
}: UseTableExportOptions<T>) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  /* Called at export time rather than memoised into a value: the table
     instance is stable across renders, so a `useMemo` keyed on it would freeze
     the column list as it was before the first response arrived. */
  const exportedColumns = useCallback(
    () =>
      table
        .getVisibleLeafColumns()
        .filter(
          (column) =>
            !isActionColumn(column.columnDef) &&
            column.columnDef.meta?.exportable !== false
        )
        .map((column) => ({
          key: column.id,
          header: String(column.columnDef.header ?? column.id),
          toValue: column.columnDef.meta?.exportValue,
        })),
    [table]
  );

  /** One request for every row the current criteria match, capped. */
  const fetchAllRows = useCallback(async (): Promise<T[]> => {
    if (staticRows) return staticRows.slice(0, EXPORT_MAX_ROWS);
    if (!url) throw new Error("This table has no endpoint to export from.");

    const response = await api.post(url, {
      searchWord: params.globalFilter ?? "",
      sortColumn: params.sorting?.[0]?.id ?? "",
      sortOrder: params.sorting?.[0] ? (params.sorting[0].desc ? "desc" : "asc") : "",
      filters: params.filters ?? [],
      pageSize: EXPORT_MAX_ROWS,
      currentPage: 1,
    });

    // NEVER log this payload — blacklisted-accounts rows carry account and
    // routing numbers.
    return adaptTableResponse<T>(datasetKey, response.data).data;
  }, [datasetKey, params, staticRows, url]);

  const exportCsv = useCallback(
    async (scope: ExportScope) => {
      const columns = exportedColumns();
      if (columns.length === 0) return;

      setIsExporting(true);

      try {
        const rows =
          scope === "all"
            ? await fetchAllRows()
            : table.getRowModel().rows.map((row) => row.original);

        triggerDownload(
          toCsvBlob(
            columns.map((column) => column.header),
            rows.map((row) =>
              columns.map((column) =>
                column.toValue
                  ? column.toValue(row[column.key], row)
                  : stringifyCellValue(row[column.key])
              )
            )
          ),
          buildExportFilename(title, "csv")
        );

        toast({
          variant: "success",
          title: "Export ready",
          description: `${rows.length.toLocaleString()} row${rows.length === 1 ? "" : "s"} downloaded.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Export failed",
          description: getErrorMessage(error),
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exportedColumns, fetchAllRows, table, title, toast]
  );

  return { exportCsv, isExporting, maxRows: EXPORT_MAX_ROWS };
}

export default useTableExport;
