// src/components/table/GenericTable.tsx
import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState, ColumnDef } from "@tanstack/react-table";
// <-- import the hook (default export)
import useTableData from "../../hooks/useTableData";
import type { ApiTableResponse,TableFilter, TableQueryParams } from "../../types/table";
import { buildColumnsFromApi } from "../../utils/columnBuilders";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import searchIcon from "../../assets/search-icon.svg";
import Dropdown from "../../design-system/Dropdown";
import Button from "../../design-system/Button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns4 } from "lucide-react";
import sortIcon from "../../assets/icon-sort.svg";
import sortUpIcon from "../../assets/icon-sort-up.svg";
import sortDownIcon from "../../assets/icon-sort-down.svg";
import type { QueryKey } from "@tanstack/react-query";
import { getErrorMessage } from "../../utils/error";
import ErrorBoundaryPage from "../ErrorBoundaryPage";
import Spinner from "../../design-system/Spinner";
import TableSkeleton from "./TableSkeleton";
import ColumnsDrawer from "./ColumnsDrawer";
import ExportDrawer from "./ExportDrawer";
import useTableExport from "./useTableExport";
import {
  buildColumnPrefs,
  getColKey,
  isActionColumn,
  normalizeColumnKey,
  reconcileColumnPrefs,
  toColumnOrder,
  toVisibilityMap,
  type TableColumnPref,
} from "./columnPrefs";
//test
interface GenericTableProps<T extends Record<string, unknown>> {
  queryKey: QueryKey; 
  url?: string;  
  initialPageSize?: number;
  title: string;
  customColumns?: ColumnDef<T>[];
  hiddenColumns?: string[];
  staticData?: T[];
  staticColumns?: ApiTableResponse<T>["columns"];
  showSearch?: boolean;
  showExport?: boolean;
  filterableColumns?: string[];
  nonFilterableColumns?: string[];
  statusFilterLabel?: string;
  showStatusFilter?: boolean;
}
function columnMatches<TData, TValue>(
  col: ColumnDef<TData, TValue>,
  fallbackId: string,
  columnNames: Set<string>
): boolean {
  const key = getColKey(col) ?? fallbackId;
  const header = col.header ? String(col.header).trim() : "";

  return (
    columnNames.has(normalizeColumnKey(key)) ||
    (header !== "" && columnNames.has(normalizeColumnKey(header)))
  );
}

export default function GenericTable<T extends Record<string, unknown>>({
  queryKey,
  url,
  initialPageSize = 10,
  title,
  customColumns = [],
  hiddenColumns = [],
  staticData,
  staticColumns,
  showSearch = true,
  showExport = true,
  filterableColumns,
  nonFilterableColumns = [],
  statusFilterLabel: statusFilterLabelProp = "Status",
  showStatusFilter: showStatusFilterProp = false,
}: GenericTableProps<T>) {
  // --- local UI state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnPrefs, setColumnPrefs] = useState<TableColumnPref[]>([]);
  const [columnsDrawerOpen, setColumnsDrawerOpen] = useState(false);
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [staticFilters] = useState<TableFilter[]>([]);
  // debounced filter
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300);
  const filterableColumnSet = useMemo(
    () => filterableColumns ? new Set(filterableColumns.map(normalizeColumnKey)) : null,
    [filterableColumns]
  );
  const nonFilterableColumnSet = useMemo(
    () => new Set(nonFilterableColumns.map(normalizeColumnKey)),
    [nonFilterableColumns]
  );

  const isStaticTable = Array.isArray(staticData);

  /* Matched and sorted but not paged — the page slice below is one view of it,
     and an "all rows" export is the other. */
  const sortedStaticRows = useMemo(() => {
    if (!staticData) return [];

    const normalizedFilter = debouncedGlobalFilter.trim().toLowerCase();
    const filteredRows = normalizedFilter
      ? staticData.filter((row) =>
          Object.values(row).some((value) =>
            String(value ?? "").toLowerCase().includes(normalizedFilter)
          )
        )
      : staticData;

    const [{ id: sortId, desc } = {}] = sorting;
    const sortedRows = sortId
      ? [...filteredRows].sort((a, b) => {
          const aValue = a[sortId];
          const bValue = b[sortId];

          if (aValue === bValue) return 0;
          if (aValue === null || aValue === undefined) return desc ? 1 : -1;
          if (bValue === null || bValue === undefined) return desc ? -1 : 1;

          const compare =
            typeof aValue === "number" && typeof bValue === "number"
              ? aValue - bValue
              : String(aValue).localeCompare(String(bValue), undefined, {
                  numeric: true,
                  sensitivity: "base",
                });

          return desc ? -compare : compare;
        })
      : filteredRows;

    return sortedRows;
  }, [debouncedGlobalFilter, sorting, staticData]);

  const filteredStaticRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedStaticRows.slice(start, start + pageSize);
  }, [pageIndex, pageSize, sortedStaticRows]);

  const staticTotal = useMemo(() => {
    if (!staticData) return 0;
    const normalizedFilter = debouncedGlobalFilter.trim().toLowerCase();
    if (!normalizedFilter) return staticData.length;

    return staticData.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedFilter)
      )
    ).length;
  }, [debouncedGlobalFilter, staticData]);

  // params for backend
  const params: TableQueryParams = useMemo(() => {
    const filters: TableFilter[] = [...staticFilters];

    if (showStatusFilterProp && statusFilter !== undefined) {
      filters.push({
        field: "status",
        value: statusFilter ? "true" : "false",
        operator: "equals",
      });
    }
    return {
      pageIndex,
      pageSize,
      sorting,
      globalFilter: debouncedGlobalFilter,
      filters: filters.length > 0 ? filters : undefined,
    };
  }, [ pageIndex, pageSize, sorting, debouncedGlobalFilter, showStatusFilterProp,statusFilter]);

  // fetch data -> PASS url INTO HOOK
  const tableQuery = useTableData<T>(queryKey, url, params, {
    keepPreviousData: true,
    enabled: !isStaticTable,
  });

  const data: ApiTableResponse<T> | undefined = useMemo(
    () =>
      isStaticTable
        ? {
            data: filteredStaticRows,
            total: staticTotal,
            columns:
              staticColumns ??
              (staticData?.[0]
                ? Object.keys(staticData[0]).map((key) => ({ id: key, header: key }))
                : []),
          }
        : tableQuery.data,
    [isStaticTable, filteredStaticRows, staticTotal, staticColumns, staticData, tableQuery.data]
  );

  const { isLoading, isFetching, isError, error } = isStaticTable
    ? { isLoading: false, isError: false, error: null }
    : tableQuery;

  // build columns
  const columns = useMemo(() => {
    const isColumnFilterable = (col: ColumnDef<T>, fallbackId: string): boolean => {
      if (isActionColumn(col)) return false;
      if (filterableColumnSet && !columnMatches(col, fallbackId, filterableColumnSet)) return false;
      if (columnMatches(col, fallbackId, nonFilterableColumnSet)) return false;
      return true;
    };

    const apiColumns = data ? buildColumnsFromApi<T>(data.columns) : [];
    // override any API column if a custom column uses the same key
    const withOverrides = apiColumns.map((apiCol) => {
      const apiKey = getColKey(apiCol);
      const custom = customColumns.find((cc) => getColKey(cc) === apiKey);
      return custom ? { ...apiCol, ...custom } : apiCol;
    });

    // append custom columns that didn't match anything in API
    const extras = customColumns.filter(
      (cc) => !withOverrides.some((c) => getColKey(c) === getColKey(cc))
    );

    return [...withOverrides, ...extras].map((col) =>
      isColumnFilterable(col, getColKey(col) ?? "") ? col : { ...col, enableSorting: false }
    );
  }, [data, customColumns, filterableColumnSet, nonFilterableColumnSet]);

  /* The drawer's view of the columns. `hiddenColumns` only seeds it — unlike
     the old dropdown, a column hidden by the page can be brought back. */
  const defaultColumnPrefs = useMemo(
    () => buildColumnPrefs(columns, hiddenColumns),
    [columns, hiddenColumns]
  );

  // Columns arrive with the first response, and a page can swap datasets under
  // the same table, so the user's choices are merged rather than replaced.
  useEffect(() => {
    setColumnPrefs((prev) => reconcileColumnPrefs(prev, defaultColumnPrefs));
  }, [defaultColumnPrefs]);



  // table instance
  const table = useReactTable({
    data: (data?.data as T[]) ?? [],
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: data ? Math.ceil(data.total / pageSize) : -1,
    state: {
      pagination: { pageIndex, pageSize },
      sorting,
      globalFilter,
      columnVisibility: toVisibilityMap(columnPrefs),
      columnOrder: toColumnOrder(columnPrefs),
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        setPageIndex(next.pageIndex);
        setPageSize(next.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const datasetKey = String(Array.isArray(queryKey) ? queryKey[0] : queryKey);

  const { exportCsv, isExporting, maxRows } = useTableExport<T>({
    table,
    datasetKey,
    url,
    params,
    staticRows: isStaticTable ? sortedStaticRows : undefined,
    title,
  });

  // keep table pagination in sync when server returns fewer pages
  // (optional safety: reset pageIndex if current page exceeds total pages)
  const totalPages = table.getPageCount();
  if (pageIndex > totalPages - 1 && totalPages > 0) {
    table.setPageIndex(Math.max(0, totalPages - 1));
  }

  // error state
  if (isError) {
    return (
      <div className="rounded-2xl border border-divider bg-white p-6 shadow-sm">
        <ErrorBoundaryPage
          error={error}
          title={`Failed to load ${title || "table data"}`}
          onReload={() => tableQuery.refetch()}
        />
      </div>
    );
  }

  function selectStatusFilter(value: string): void {
    if (value === "All") {
      setStatusFilter(undefined);
    } else if (value === "Active") {
      setStatusFilter(true);
    } else if (value === "InActive") {
      setStatusFilter(false);
    }
    setPageIndex(0);
  }

  const statusFilterLabelText =
    statusFilter === undefined ? "All" : statusFilter ? "Active" : "InActive";
  return (
    <div className="bg-white rounded shadow">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3">
        <div className="text-base font-bold text-dark-grey">{title}</div>

        <div className="flex items-center justify-end gap-3">
          {/* Search box */}
          {showSearch && (
            <div className="flex justify-between items-center border border-divider rounded-lg w-56 px-3 py-1 h-9">
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Search"
                className="outline-none border-none text-xs text-grey-700"
              />
              <span className="flex items-center">
                <img src={searchIcon} alt="Search" className="h-5 w-5" />
              </span>
            </div>
          )}
          {/* Status dropdown */}
          {showStatusFilterProp && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-medium-grey">
                {statusFilterLabelProp}:
              </span>
              <Dropdown
                label={statusFilterLabelText}
                items={[
                  { label: "All", value: "All" },
                  { label: "Active", value: "Active" },
                  { label: "InActive", value: "InActive" },
                ]}
                onSelect={selectStatusFilter}
                keepOpenOnSelect={false}
                btnClassName="w-52 h-9 px-3 py-1 bg-transparent border border-gray-300 rounded-md !justify-between !border-gray-300 !text-gray-600"
                itemClassName="last:border-b-0"
                icon={<ChevronDown className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Export and Columns read as one pair, so they sit tighter than
              the gap between the toolbar's other controls. */}
          <div className="flex items-center gap-0.5">
            {showExport && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon="download"
                iconPosition="left"
                className="h-9"
                onClick={() => setExportDrawerOpen(true)}
              >
                Export
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconComponent={Columns4}
              iconPosition="left"
              className="h-9"
              onClick={() => setColumnsDrawerOpen(true)}
            >
              Columns
            </Button>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-x-auto">
        {isLoading ? (
          <TableSkeleton rows={Math.min(pageSize, 8)} />
        ) : (
        <>
        {isFetching && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
            <Spinner />
          </div>
        )}
        <div className="min-w-full">
          <table className="w-full min-w-max table-auto border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-primary_light2">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="
                        px-3 py-3 text-left text-xs text-secondary font-semibold 
                        border-t border-b border-primary_light1 
                        align-top break-words relative
                      "
                      style={{
                        width: h.column.columnDef.meta?.width,
                        maxWidth: h.column.columnDef.meta?.width || "220px",
                        minWidth: h.column.columnDef.meta?.width || "120px",
                        userSelect: "none",
                        cursor: h.column.getCanSort() ? "pointer" : "default",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {!h.isPlaceholder && (
                        <div className="flex items-start justify-between w-full gap-2">
                          <span className="block leading-snug break-words">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </span>

                          {/* sort icon aligned to right edge */}
                          {h.column.getCanSort() && (
                            <span className="flex-shrink-0 ml-auto pl-1">
                              {h.column.getIsSorted() === "asc" ? (
                                <img
                                  src={sortUpIcon}
                                  alt="asc"
                                  className="h-4 w-4 inline-block"
                                />
                              ) : h.column.getIsSorted() === "desc" ? (
                                <img
                                  src={sortDownIcon}
                                  alt="desc"
                                  className="h-4 w-4 inline-block"
                                />
                              ) : (
                                <img
                                  src={sortIcon}
                                  alt="sort"
                                  className="h-4 w-4 inline-block opacity-70"
                                />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-4 text-center text-sm text-medium-grey"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b-2 border-dotted border-divider last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="
                          px-3 py-3 text-left text-xs text-medium-grey
                          break-words
                          max-w-[220px] min-w-[120px]
                        "
                        style={{
                          width: cell.column.columnDef.meta?.width,
                          maxWidth: cell.column.columnDef.meta?.width || "220px",
                          minWidth: cell.column.columnDef.meta?.width || "120px",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && (
      <div className="p-[10px] flex items-center justify-between border-t border-divider">
        <div className="flex text-xs text-medium-grey items-center">
          <span>Show row </span>
          <div>
            <select
              value={pageSize}
              onChange={(e) => {
                const s = Number(e.target.value);
                table.setPageSize(s);
              }}
              className="border border-divider px-2 py-1 rounded ml-2"
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <span className="px-3">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} • {data ? data.total : 0} records
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* First page */}
          <button
            className="flex items-center px-1.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            className="flex items-center px-1.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {(() => {
            const totalPages = table.getPageCount();
            const currentPage = table.getState().pagination.pageIndex;
            const pages: (number | "ellipsis")[] = [];

            if (totalPages <= 7) {
              for (let i = 0; i < totalPages; i++) pages.push(i);
            } else {
              pages.push(0);
              if (currentPage > 2) pages.push("ellipsis");
              const windowStart = Math.max(1, currentPage - 1);
              const windowEnd = Math.min(totalPages - 2, currentPage + 1);
              for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
              if (currentPage < totalPages - 3) pages.push("ellipsis");
              pages.push(totalPages - 1);
            }

            return pages.map((p, idx) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-gray-500 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => table.setPageIndex(p)}
                  className={`flex items-center px-2.5 py-2 text-xs text-medium-grey border rounded border-divider h-7 ${
                    currentPage === p ? "bg-primary text-white border-primary" : "hover:bg-gray-100"
                  }`}
                >
                  {p + 1}
                </button>
              )
            );
          })()}

          {/* Next */}
          <button
            className="flex items-center px-1.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            className="flex items-center px-1.5 py-2 text-xs text-medium-grey border rounded border-divider disabled:opacity-30 h-7"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      <ColumnsDrawer
        open={columnsDrawerOpen}
        onClose={() => setColumnsDrawerOpen(false)}
        columns={columnPrefs}
        defaultColumns={defaultColumnPrefs}
        onApply={setColumnPrefs}
      />

      {showExport && (
        <ExportDrawer
          open={exportDrawerOpen}
          onClose={() => setExportDrawerOpen(false)}
          pageRows={table.getRowModel().rows.length}
          totalRows={data?.total ?? 0}
          maxRows={maxRows}
          isExporting={isExporting}
          onExport={async (scope) => {
            await exportCsv(scope);
            setExportDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}
