import { type ColumnDef } from "@tanstack/react-table";
import GenericTable from "../../components/table/GenericTable";
import BlockToggleActionCell from "./BlockToggleActionCell";
import { maskAccountNumber } from "../../utils/formatters";

export interface BlacklistedAccount extends Record<string, unknown> {
  bankAccountBlacklistId: number;
  accountNumber: string;
  routingNumber: string;
  achReturnCode: string;
  transactionId: string;
  producerId: number | null;
  blockedAttempts: number;
  isBlocked: boolean;
}


export default function BlacklistedAccountsPage() {

  const blacklistedCustomColumns: ColumnDef<BlacklistedAccount>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <BlockToggleActionCell row={row} />,
    },
    // These two override the API-derived columns so full account and routing
    // numbers are never rendered. The API still returns them in full — see
    // IMPROVEMENTS.md #1 for the open question of returning last-4 only.
    // `meta.exportValue` repeats the mask for the CSV, which is assembled from
    // row data and would otherwise carry the full value the cell hides.
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) =>
        maskAccountNumber(row.original.accountNumber) || "-",
      meta: { exportValue: (value) => maskAccountNumber(value == null ? null : String(value)) },
    },
    {
      accessorKey: "routingNumber",
      header: "Routing Number",
      cell: ({ row }) =>
        maskAccountNumber(row.original.routingNumber) || "-",
      meta: { exportValue: (value) => maskAccountNumber(value == null ? null : String(value)) },
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID"
    },
    {
      accessorKey: "producerId",
      header: "Producer ID"
    },
    {
      accessorKey: "achReturnCode",
      header: "ACH Return Code"
    }
  ];

  return (
    <div >
      <div className="flex justify-between items-center mb-3">
        <div className="text-lg font-bold">Blacklisted Bank Accounts</div>
      </div>

      <GenericTable<BlacklistedAccount>
        queryKey={["blacklisted-accounts"]}
        url="/api/v1/GetAllBlacklistedBankAccounts"
        title="List of Blacklisted Bank Accounts"
        customColumns={blacklistedCustomColumns}
        hiddenColumns={["bankAccountBlacklistedId", "released"]}
      />

    </div>
  );
}
