import { useEffect, useMemo, useRef } from "react";
import { useQuery, keepPreviousData, type QueryKey } from "@tanstack/react-query";
import type { ApiTableResponse, TableQueryParams } from "../types/table";
// import { dummyData } from "../constants/constants";
import api from "../services/axios";
import { useToast } from "../design-system/toast/ToastContext";
import { adaptTableResponse } from "../utils/tableResponseAdapter";
import { getErrorMessage } from "../utils/error";

// // Helper for dummy filter matching
// function matchesFilter(value: unknown, filterVal: unknown): boolean {
//   if (filterVal === undefined || filterVal === null) return true;
//   if (value === undefined || value === null) return false;

//   if (typeof filterVal === "string") {
//     return String(value).toLowerCase().includes(filterVal.toLowerCase());
//   }

//   if (typeof filterVal === "number" || typeof filterVal === "boolean") {
//     return value === filterVal;
//   }

//   return String(value).toLowerCase().includes(String(filterVal).toLowerCase());
// }

// // Dummy data processor (for non-merchants)
// function processData<T extends Record<string, unknown>>(
//   rawData: T[],
//   params: {
//     page: number;
//     pageSize: number;
//     sortBy?: keyof T;
//     sortOrder?: "asc" | "desc";
//     q?: string;
//     filters?: Record<string, unknown> | undefined;
//   }
// ): { rows: T[]; total: number } {
//   let result = [...rawData];

//   if (params.q) {
//     const q = params.q.toLowerCase();
//     result = result.filter((row) =>
//       Object.values(row).some((val) =>
//         String(val).toLowerCase().includes(q)
//       )
//     );
//   }

//   if (params.filters && Object.keys(params.filters).length > 0) {
//     const filters = params.filters;
//     result = result.filter((row) => {
//       return Object.entries(filters).every(([key, filterVal]) => {
//         if (filterVal === undefined || filterVal === null || filterVal === "") return true;
//         const rowVal = row[key as keyof T];
//         return matchesFilter(rowVal, filterVal);
//       });
//     });
//   }

//   if (params.sortBy) {
//     result.sort((a, b) => {
//       const aVal = String(a[params.sortBy!]);
//       const bVal = String(b[params.sortBy!]);
//       return params.sortOrder === "desc"
//         ? bVal.localeCompare(aVal)
//         : aVal.localeCompare(bVal);
//     });
//   }

//   const total = result.length;
//   const start = (params.page - 1) * params.pageSize;
//   const rows = result.slice(start, start + params.pageSize);

//   return { rows, total };
// }

export const useTableData = <T extends Record<string, unknown>>(
  qk: QueryKey,
  url: string | undefined,
  params: TableQueryParams,
  options?: { enabled?: boolean; keepPreviousData?: boolean }
) => {
  const { toast } = useToast();
  const hasShownSuccessRef = useRef(false);

  const mapped = useMemo(() => {
    return {
      page: (params.pageIndex ?? 0) + 1,
      pageSize: params.pageSize ?? 2,
      sortBy: params.sorting?.[0]?.id as keyof T | undefined,
      sortOrder: (params.sorting?.[0]?.desc ? "desc" : "asc") as "asc" | "desc",
      q: params.globalFilter || undefined,
      filters:
        params.filters && params.filters.length > 0
          ? params.filters
          : undefined,
    };
  }, [params.pageIndex, params.pageSize, params.sorting, params.globalFilter, params.filters]);

  const baseKey = useMemo(() => (Array.isArray(qk) ? qk : [qk]), [qk]);

  const queryKey = useMemo(
    () => [...baseKey, url ?? "local", mapped] as const,
    [baseKey, url, mapped]
  );

  const datasetKey = (baseKey[0] ?? "") as string;

 const queryResult = useQuery<ApiTableResponse<T>, Error>({
    queryKey,
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      if (
        datasetKey === "accounts" ||
        datasetKey === "merchants-accounts" ||
        datasetKey === "corps-accounts" ||
        datasetKey === "producers-accounts" ||
        datasetKey === "users-accounts" ||
        datasetKey === "api-logs" ||
        datasetKey === "blacklisted-accounts" ||
        datasetKey === "ivr-accounts" ||
        datasetKey === "processors" ||
        datasetKey === "merchant-processors"
      ) {
        if (!url) throw new Error("Missing 'url' for merchants/corps query.");

        const requestBody: Record<string, unknown> = {
          searchWord: mapped.q ?? "",
          sortColumn: mapped.sortBy ? String(mapped.sortBy) : "",
          sortOrder: mapped.sortBy ? mapped.sortOrder : "",
          filters: mapped.filters ?? [],
          pageSize: mapped.pageSize,
          currentPage: mapped.page,
        };

        const resp = await api.post(url, requestBody, { signal });

        const data = adaptTableResponse<T>(datasetKey, resp.data);
        // data.total = resp.data.pagination.totalRecordsCount;

        if (
          !data ||
          !Array.isArray(data.data) ||
          typeof data.total !== "number" ||
          !Array.isArray(data.columns)
        ) {
          throw new Error(`Invalid normalized response for dataset: ${datasetKey}`);
        }
        // NEVER log `data` here — these payloads include bank account and
        // routing numbers (blacklisted-accounts) and merchant fee config.
        return data;
      }
      // else if (datasetKey === "merchant-processors") {

      //   // Force the dummy dataset to match the generic type T
      //   const raw = dummyData.merchantProcessorData;

      //   const normalized: ApiTableResponse<T> = {
      //     columns: raw.columns as ApiTableResponse<T>["columns"],
      //     data: raw.data as unknown as T[],
      //     total: raw.total,
      //   };

      //   return normalized;
      // }
      else{
        throw new Error(`No dataset found for queryKey: ${String(datasetKey)}`);
      }

      // const { rows, total } = processData<T>(selectedData.data as unknown as T[], {
      //   page: mapped.page,
      //   pageSize: mapped.pageSize,
      //   sortBy: mapped.sortBy,
      //   sortOrder: mapped.sortOrder,
      //   q: mapped.q,
      //   filters: mapped.filters,
      // });

      // return {
      //   columns: selectedData.columns,
      //   data: rows,
      //   total,
      // } as ApiTableResponse<T>;
    },
    placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
    // table queries show their own in-table spinner (GenericTable); GlobalSpinner skips them
    meta: { tableScoped: true },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ✅ Success toast ONLY on first real fetch while this component is mounted
  //    - requires isSuccess (data loaded)
  //    - requires isFetchedAfterMount (fetched after this mount, not just cache)
  //    - guarded by hasShownSuccessRef so it fires once per mount
  useEffect(() => {
    if (
      queryResult.isSuccess &&
      queryResult.isFetchedAfterMount &&
      !hasShownSuccessRef.current
    ) {
      hasShownSuccessRef.current = true;

      toast({
        variant: "success",
        title: "Success",
        description: `${String(datasetKey)} List loaded successfully.`,
      });
    }
  }, [queryResult.isSuccess, queryResult.isFetchedAfterMount, toast, datasetKey]);

  // ✅ Toast on error
  const hasShownErrorRef = useRef(false);

  useEffect(() => {
    if (queryResult.isError && queryResult.error && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;

      toast({
        variant: "error",
        title: "Failed to load data",
        description: getErrorMessage(queryResult.error),
      });
    }
  }, [queryResult.isError, queryResult.error, toast]);

  return queryResult;
};

export default useTableData;
