import { type ColumnDef } from "@tanstack/react-table";
import GenericTable from "../../components/table/GenericTable";
import { useState } from "react";
import EditIvrModal from "./EditIvrModal";
import editIcon from "../../assets/icon-edit.svg";


export type IvrStatus = "Pending" | "Active" | "In-Active";

export interface IvrAccount extends Record<string, unknown> {
  id: number;
  producerId: number;
  merchantId: number; 
  companyName: string;
  phone: string;
  status: IvrStatus;
  allowAch: "Yes" | "No";
  callRate: number;
  minuteRate: number;
  smsRate: number;
  monthlyFee: number;
}

export default function IvrAccountsPage() {
  const [selected, setSelected] = useState<IvrAccount | null>(null);

  const columns: ColumnDef<IvrAccount>[] = [
    { accessorKey: "companyName", header: "Company Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "minuteRate", header: "Minute Rate" },
    { accessorKey: "callRate", header: "Call Rate" },
    { accessorKey: "smsRate", header: "SMS Rate" },
    { accessorKey: "monthlyFee", header: "Monthly Fee" },
    {
      accessorKey: "allowAch",
      header: "Allow ACH",
    },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => setSelected(row.original)}
          className="flex items-center gap-1 rounded-md border border-error/20 bg-error-bg px-3 py-1 text-xs font-semibold text-error hover:bg-red-200 disabled:opacity-60"
        >
          <img src={editIcon} alt="edit-icon" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  return (
    <>
      <GenericTable<IvrAccount>
        queryKey={["ivr-accounts"]}
        url="/api/v1/GetIvrList"
        title="List of IVR Accounts"
        customColumns={columns}
        hiddenColumns={['merchantId', 'producerId']}
        showStatusFilter
        statusFilterLabel="status"
      />

      {selected && (
        <EditIvrModal
          open={true}
          ivr={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
