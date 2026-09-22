import type { ColumnDef } from "@tanstack/react-table";
import GenericTable from "../../components/table/GenericTable";

export interface APILog extends Record<string, unknown> {
  producerId: number | string;
  responseDate: string;
  userName: string;
  transactionType: string;
  request: string;
  response: string;
}

const apiLogsColumns: ColumnDef<APILog>[] = [
  {
    accessorKey: "producerId",
    header: "Producer ID",
  },
  {
    accessorKey: "responseDate",
    header: "Response Date",
    meta: { width: "180px" },
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return <span className="whitespace-nowrap">{value || "-"}</span>;
    },
  },
  {
    accessorKey: "userName",
    header: "User Name",
  },
  {
    accessorKey: "transactionType",
    header: "Transaction Type",
    meta: { width: "180px" },
  },
  {
    accessorKey: "request",
    header: "Request",
    /* Withheld from exports: these are whole gateway payloads, so a downloaded
       file could carry cardholder or account values out of the portal. They
       stay on screen; only the CSV leaves them out. */
    meta: { width: "420px", exportable: false },
    cell: ({ getValue }) => (
      <div className="max-w-[420px] break-words text-xs text-gray-700">
        {String(getValue() || "-")}
      </div>
    ),
  },
  {
    accessorKey: "response",
    header: "Response",
    /* Withheld from exports: these are whole gateway payloads, so a downloaded
       file could carry cardholder or account values out of the portal. They
       stay on screen; only the CSV leaves them out. */
    meta: { width: "420px", exportable: false },
    cell: ({ getValue }) => (
      <div className="max-w-[420px] break-words text-xs text-gray-700">
        {String(getValue() || "-")}
      </div>
    ),
  },
];

export default function APILogsPage() {
  return (
    <div >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold">API Logs</div>
      </div>

      <GenericTable<APILog>
        queryKey={["api-logs"]}
        url="/api/v1/GetAPILogs"
        title="List of API Logs"
        customColumns={apiLogsColumns}
        hiddenColumns={[]}
      />
    </div>
  );
}
