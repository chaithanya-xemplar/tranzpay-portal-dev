import type { ApiTableResponse } from "../types/table";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function adaptTableResponse<T extends Record<string, unknown>>(
  datasetKey: string,
  resp: unknown
): ApiTableResponse<T> {
  if (!isObject(resp)) {
    throw new Error("Invalid API response");
  }

  // Safely extract data
  const data: T[] =
    "data" in resp && Array.isArray(resp.data)
      ? (resp.data as T[])
      : [];

  // Safely extract total
  const total =
    "pagination" in resp &&
        isObject(resp.pagination) &&
        "totalRecordsCount" in resp.pagination &&
        typeof resp.pagination.totalRecordsCount === "number"
      ? resp.pagination.totalRecordsCount
      : "count" in resp && typeof resp.count === "number"
      ? resp.count : data.length;

  /**
   * ONLY users-accounts builds columns dynamically
   */
  if (datasetKey === "users-accounts") {
    return {
      columns: buildColumnsFromData(data),
      data,
      total,
    };
  }

  /**
   * All other datasets must use backend-provided columns
   */
  if ("columns" in resp && Array.isArray(resp.columns)) {
    return {
      columns: resp.columns,
      data,
      total,
    };
  }

  throw new Error(
    `Columns missing in API response for dataset: ${datasetKey}`
  );
}

/**
 * Dynamically build columns when backend doesn't send them
 */
function buildColumnsFromData(
  data: Record<string, unknown>[] = []
) {
  if (!data.length) return [];

  return Object.keys(data[0]).map((key) => ({
    id: key,
    header: toHeaderCase(key),
  }));
}

function toHeaderCase(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}