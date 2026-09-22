import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useTableData from "./useTableData";
import api from "../services/axios";
import { createWrapper } from "../test/renderWithClient";
import type { TableQueryParams } from "../types/table";

vi.mock("../services/axios", () => ({
  default: { post: vi.fn() },
}));

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock("../design-system/toast/ToastContext", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const postMock = vi.mocked(api.post);

const apiResponse = {
  data: {
    data: [{ id: 1, name: "Merchant A" }],
    columns: [{ id: "name", header: "Name" }],
    pagination: { totalRecordsCount: 12 },
  },
};

type Row = Record<string, unknown>;

function renderTable(
  qk: string[],
  url: string | undefined,
  params: TableQueryParams
) {
  const { Wrapper } = createWrapper();
  return renderHook(() => useTableData<Row>(qk, url, params), {
    wrapper: Wrapper,
  });
}

let consoleLogSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  // The queryFn contains a stray console.log(data) — silence it.
  consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy.mockRestore();
});

describe("useTableData", () => {
  it("POSTs the mapped request body and returns the adapted response", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const { result } = renderTable(["merchants-accounts"], "/api/merchants", {
      pageIndex: 0,
      pageSize: 10,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledTimes(1);
    // Note: every key is always sent; searchWord/sortColumn/sortOrder fall back
    // to "" and filters to [] when not provided.
    expect(postMock).toHaveBeenCalledWith(
      "/api/merchants",
      {
        searchWord: "",
        sortColumn: "",
        sortOrder: "",
        filters: [],
        pageSize: 10,
        currentPage: 1,
      },
      { signal: expect.any(AbortSignal) }
    );
    expect(result.current.data).toEqual({
      data: [{ id: 1, name: "Merchant A" }],
      columns: [{ id: "name", header: "Name" }],
      total: 12,
    });
  });

  it("defaults pageSize to 2 and maps pageIndex to 1-based currentPage", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const params = { pageIndex: 2 } as TableQueryParams;
    const { result } = renderTable(
      ["corps-accounts"],
      "/api/corps",
      params
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledWith(
      "/api/corps",
      {
        searchWord: "",
        sortColumn: "",
        sortOrder: "",
        filters: [],
        pageSize: 2,
        currentPage: 3,
      },
      { signal: expect.any(AbortSignal) }
    );
  });

  it("includes searchWord, sortColumn, sortOrder and filters when provided", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const { result } = renderTable(["merchants-accounts"], "/api/merchants", {
      pageIndex: 1,
      pageSize: 25,
      globalFilter: "acme",
      sorting: [{ id: "name", desc: true }],
      filters: [{ field: "status", value: "true", operator: "equals" }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledWith(
      "/api/merchants",
      {
        searchWord: "acme",
        sortColumn: "name",
        sortOrder: "desc",
        filters: [{ field: "status", value: "true", operator: "equals" }],
        pageSize: 25,
        currentPage: 2,
      },
      { signal: expect.any(AbortSignal) }
    );
  });

  it("sends sortOrder 'asc' for an ascending sort descriptor", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const { result } = renderTable(["merchants-accounts"], "/api/merchants", {
      pageIndex: 0,
      pageSize: 10,
      sorting: [{ id: "name" }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledWith(
      "/api/merchants",
      expect.objectContaining({ sortColumn: "name", sortOrder: "asc" }),
      { signal: expect.any(AbortSignal) }
    );
  });

  it("normalizes an empty filters array to [] in the request body", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const { result } = renderTable(["merchants-accounts"], "/api/merchants", {
      pageIndex: 0,
      pageSize: 10,
      filters: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledWith(
      "/api/merchants",
      expect.objectContaining({ filters: [] }),
      { signal: expect.any(AbortSignal) }
    );
  });

  it("errors without calling the API when url is missing", async () => {
    const { result } = renderTable(["merchants-accounts"], undefined, {
      pageIndex: 0,
      pageSize: 10,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(postMock).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe(
      "Missing 'url' for merchants/corps query."
    );
  });

  it("errors for an unsupported dataset key", async () => {
    const { result } = renderTable(["unknown-dataset"], "/api/unknown", {
      pageIndex: 0,
      pageSize: 10,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(postMock).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe(
      "No dataset found for queryKey: unknown-dataset"
    );
  });

  it("shows the success toast exactly once after a successful fetch", async () => {
    postMock.mockResolvedValue(apiResponse as never);

    const { result, rerender } = renderTable(
      ["merchants-accounts"],
      "/api/merchants",
      { pageIndex: 0, pageSize: 10 }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(toastMock).toHaveBeenCalledTimes(1));

    expect(toastMock).toHaveBeenCalledWith({
      variant: "success",
      title: "Success",
      description: "merchants-accounts List loaded successfully.",
    });

    rerender();
    expect(toastMock).toHaveBeenCalledTimes(1);
  });

  it("shows the error toast exactly once with the real error message", async () => {
    postMock.mockRejectedValue(new Error("boom"));

    const { result, rerender } = renderTable(
      ["merchants-accounts"],
      "/api/merchants",
      { pageIndex: 0, pageSize: 10 }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() => expect(toastMock).toHaveBeenCalledTimes(1));

    expect(toastMock).toHaveBeenCalledWith({
      variant: "error",
      title: "Failed to load data",
      description: "boom",
    });

    rerender();
    expect(toastMock).toHaveBeenCalledTimes(1);
  });
});
