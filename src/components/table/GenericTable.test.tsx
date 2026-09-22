import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenericTable from "./GenericTable";
import api from "../../services/axios";
import { createWrapper } from "../../test/renderWithClient";

vi.mock("../../services/axios", () => ({
  default: { post: vi.fn() },
}));

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock("../../design-system/toast/ToastContext", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const { triggerDownloadMock } = vi.hoisted(() => ({ triggerDownloadMock: vi.fn() }));

vi.mock("../../utils/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/download")>()),
  triggerDownload: triggerDownloadMock,
}));

const postMock = vi.mocked(api.post);

function makeApiResponse(totalRecordsCount = 1) {
  return {
    data: {
      data: [{ id: 1, name: "Merchant A" }],
      columns: [{ id: "name", header: "Name" }],
      pagination: { totalRecordsCount },
    },
  };
}

type Row = Record<string, unknown>;

function renderTable(props?: Partial<Parameters<typeof GenericTable<Row>>[0]>) {
  const { Wrapper } = createWrapper();
  return render(
    <GenericTable<Row>
      queryKey={["merchants-accounts"]}
      url="/api/merchants"
      title="Merchants"
      showExport={false}
      {...props}
    />,
    { wrapper: Wrapper }
  );
}

function lastRequestBody(): Record<string, unknown> {
  const call = postMock.mock.calls.at(-1);
  if (!call) throw new Error("api.post was not called");
  return call[1] as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  // The queryFn contains a stray console.log(data) — silence it.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("GenericTable — status filter", () => {
  it("does not render the status dropdown by default", async () => {
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable();

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    expect(screen.queryByText("Status:")).not.toBeInTheDocument();
  });

  it("renders the status dropdown with its label when showStatusFilter is set", async () => {
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable({ showStatusFilter: true, statusFilterLabel: "Account Status" });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    expect(screen.getByText("Account Status:")).toBeInTheDocument();
    // Trigger shows "All" until a value is picked.
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  it("selecting Active sends an equals status=true filter and resets to page 1", async () => {
    const user = userEvent.setup();
    // 25 records / pageSize 10 → 3 pages, so we can move off page 1 first.
    postMock.mockResolvedValue(makeApiResponse(25) as never);
    renderTable({ showStatusFilter: true });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({ currentPage: 2 })
    );

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "Active" }));

    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({
        filters: [{ field: "status", value: "true", operator: "equals" }],
        currentPage: 1,
      })
    );
  });

  it("selecting InActive sends an equals status=false filter", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable({ showStatusFilter: true });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "InActive" }));

    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({
        filters: [{ field: "status", value: "false", operator: "equals" }],
      })
    );
  });

  it("selecting All clears the status filter again", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable({ showStatusFilter: true });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "Active" }));
    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({
        filters: [{ field: "status", value: "true", operator: "equals" }],
      })
    );

    const callsAfterActive = postMock.mock.calls.length;

    // The closed trigger now reads "Active"; reopen and pick "All".
    await user.click(screen.getByRole("button", { name: "Active" }));
    await user.click(screen.getByRole("button", { name: "All" }));

    // Clearing the filter returns to the initial unfiltered query key, which is
    // still fresh in the React Query cache — so no new request is made and the
    // trigger label falls back to "All".
    expect(
      await screen.findByRole("button", { name: "All" })
    ).toBeInTheDocument();
    expect(postMock.mock.calls.length).toBe(callsAfterActive);
  });
});

describe("GenericTable — search and sort", () => {
  it("sends the typed search text as searchWord after the debounce", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable();

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("Search"), "acme");

    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({ searchWord: "acme", currentPage: 1 })
    );
  });

  it("clicking a column header toggles sortColumn/sortOrder asc then desc", async () => {
    const user = userEvent.setup();
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable();

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    expect(lastRequestBody()).toMatchObject({ sortColumn: "", sortOrder: "" });

    await user.click(screen.getByText("Name"));
    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({ sortColumn: "name", sortOrder: "asc" })
    );

    await user.click(screen.getByText("Name"));
    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({ sortColumn: "name", sortOrder: "desc" })
    );
  });
});

describe("GenericTable — columns drawer", () => {
  function makeTwoColumnResponse(rows = [{ name: "Merchant A", email: "a@example.test" }]) {
    return {
      data: {
        data: rows,
        columns: [
          { id: "name", header: "Name" },
          { id: "email", header: "Email" },
        ],
        pagination: { totalRecordsCount: rows.length },
      },
    };
  }

  async function openColumnsDrawer() {
    const user = userEvent.setup();
    postMock.mockResolvedValue(makeTwoColumnResponse() as never);
    renderTable({ hiddenColumns: ["email"] });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Columns" }));

    // Both drawers stay mounted, so every query is scoped to this one.
    return { user, drawer: screen.getByRole("dialog", { name: "Customize columns" }) };
  }

  it("lists a column the page hid, so it can be brought back", async () => {
    const { user, drawer } = await openColumnsDrawer();

    // Hidden on load: no header, but present in the drawer's Hidden section.
    expect(screen.queryByRole("columnheader", { name: /Email/ })).not.toBeInTheDocument();
    expect(within(drawer).getByText("Hidden (1)")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("switch", { name: "Show Email" }));
    await user.click(within(drawer).getByRole("button", { name: "Apply" }));

    expect(
      await screen.findByRole("columnheader", { name: /Email/ })
    ).toBeInTheDocument();
  });

  it("discards staged edits when the drawer is cancelled", async () => {
    const { user, drawer } = await openColumnsDrawer();

    await user.click(within(drawer).getByRole("switch", { name: "Hide Name" }));
    await user.click(within(drawer).getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
  });

  it("hides an applied column from the grid", async () => {
    const { user, drawer } = await openColumnsDrawer();

    // Show Email first: the last visible column cannot be hidden.
    await user.click(within(drawer).getByRole("switch", { name: "Show Email" }));
    await user.click(within(drawer).getByRole("switch", { name: "Hide Name" }));
    await user.click(within(drawer).getByRole("button", { name: "Apply" }));

    await waitFor(() =>
      expect(screen.queryByRole("columnheader", { name: /Name/ })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("columnheader", { name: /Email/ })).toBeInTheDocument();
  });

  it("refuses to apply an empty grid", async () => {
    const { user, drawer } = await openColumnsDrawer();

    await user.click(within(drawer).getByRole("switch", { name: "Hide Name" }));

    expect(within(drawer).getByRole("button", { name: "Apply" })).toBeDisabled();
  });
});

describe("GenericTable — export", () => {
  async function exportWith(
    scopeLabel: string,
    props?: Partial<Parameters<typeof GenericTable<Row>>[0]>
  ) {
    const user = userEvent.setup();
    renderTable({ showExport: true, ...props });

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Export" }));

    const drawer = screen.getByRole("dialog", { name: "Export" });
    await user.click(within(drawer).getByRole("radio", { name: new RegExp(scopeLabel) }));
    await user.click(within(drawer).getByRole("button", { name: "Download CSV" }));

    return user;
  }

  async function downloadedCsv(): Promise<string> {
    await waitFor(() => expect(triggerDownloadMock).toHaveBeenCalled());
    const [blob] = triggerDownloadMock.mock.calls.at(-1)!;
    return blob.text();
  }

  it("writes the rows on screen, headers first", async () => {
    postMock.mockResolvedValue(makeApiResponse() as never);

    await exportWith("This page only");

    expect(await downloadedCsv()).toBe("Name\r\nMerchant A");
    expect(triggerDownloadMock.mock.calls.at(-1)![1]).toMatch(
      /^merchants_\d{4}-\d{2}-\d{2}\.csv$/
    );
  });

  it("re-runs the criteria in one capped request for all matching rows", async () => {
    postMock.mockResolvedValue(makeApiResponse(500) as never);

    await exportWith("All matching rows");

    await waitFor(() =>
      expect(lastRequestBody()).toMatchObject({ currentPage: 1, pageSize: 10_000 })
    );
  });

  it("writes the column's masked value, not the raw one", async () => {
    postMock.mockResolvedValue({
      data: {
        data: [{ name: "Merchant A", accountNumber: "000000001234" }],
        columns: [
          { id: "name", header: "Name" },
          { id: "accountNumber", header: "Account Number" },
        ],
        pagination: { totalRecordsCount: 1 },
      },
    } as never);

    await exportWith("This page only", {
      customColumns: [
        {
          accessorKey: "accountNumber",
          header: "Account Number",
          meta: { exportValue: (value) => `****${String(value).slice(-4)}` },
        },
      ],
    });

    const csv = await downloadedCsv();
    expect(csv).toContain("****1234");
    expect(csv).not.toContain("000000001234");
  });

  it("leaves out a column marked unexportable", async () => {
    postMock.mockResolvedValue({
      data: {
        data: [{ name: "Merchant A", payload: "{secret}" }],
        columns: [
          { id: "name", header: "Name" },
          { id: "payload", header: "Payload" },
        ],
        pagination: { totalRecordsCount: 1 },
      },
    } as never);

    await exportWith("This page only", {
      customColumns: [
        {
          accessorKey: "payload",
          header: "Payload",
          meta: { exportable: false },
        },
      ],
    });

    const csv = await downloadedCsv();
    expect(csv).toBe("Name\r\nMerchant A");
  });

  it("reports a failed export without downloading anything", async () => {
    postMock
      .mockResolvedValueOnce(makeApiResponse() as never)
      .mockRejectedValue(new Error("network down"));

    await exportWith("All matching rows");

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error", title: "Export failed" })
      )
    );
    expect(triggerDownloadMock).not.toHaveBeenCalled();
  });

  it("stays off the toolbar when the page opts out", async () => {
    postMock.mockResolvedValue(makeApiResponse() as never);
    renderTable();

    await waitFor(() => expect(screen.getByText("Merchant A")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
  });
});
