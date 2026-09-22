import { useState } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import GenericTable from "../../../src/components/table/GenericTable";
import { Link } from "react-router-dom";

import ConfirmDialog from "../../../src/design-system/dialog/ConfirmDialog"; // 🔹 NEW
import { useToggleMerchantStatus } from "../../../src/services/merchants/merchantApi"; // 🔹 NEW
import { useToast } from "../../../src/design-system/toast/ToastContext"; // 🔹 NEW

// Toggle switch UI
const StatusToggle = ({
  active,
  onChange,
}: {
  active: boolean;
  onChange: () => void;
}) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={active}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className="w-8 h-4 bg-gray-300 rounded-full 
        peer-checked:bg-green-500 
        peer-focus:ring-2 peer-focus:ring-green-300
        relative transition-colors"
      >
        <div
          className="absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full border border-gray-300 
          transition-all peer-checked:translate-x-4"
        />
      </div>
    </label>
  );
};

// Define the type for your data row for better type safety
interface MerchantAccount extends Record<string, unknown> {
  merchantId: number | string;
  merchantName: string;
  corpAccount: string;
  status: boolean;
  mainProducerId: number | string;
}

// 🔹 NEW: Cell component to handle confirm dialog + mutation
const MerchantStatusCell = ({ row }: { row: Row<MerchantAccount> }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActive = row.original.status === true;
  const mainProducerId = row.original.mainProducerId;
  const merchantId = Number(row.original.merchantId);
  const merchantName = row.original.merchantName;

  const toggleMutation = useToggleMerchantStatus();
  const { toast } = useToast();

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleConfirm = () => {
    toggleMutation.mutate(
      {
        mainProducerId,
        merchantId,
        status: !isActive,
      },
      {
        onSuccess: (res) => {
          closeDialog();
          toast({
            variant: "success",
            title: "Status updated",
            description:
              res?.data?.message ||
              `"${merchantName}" status updated successfully`,
          });
        },
        onError: (error) => {
          closeDialog();
          toast({
            variant: "error",
            title: "Failed to update status",
            description:
              error?.response?.data?.data?.message ||
              (error as Error).message ||
              "Something went wrong. Please try again.",
          });
        },
      }
    );
  };

  return (
    <>
      <StatusToggle active={isActive} onChange={openDialog} />

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Alert"
        // description={`Are you sure you want to ${
        //   isActive ? "disable" : "enable"
        // } "${merchantName}" (Merchant ID: ${merchantId})?`}
        description={`Are you sure you want to ${isActive ? "disable" : "enable"} this item?`}
        confirmLabel="Yes"
        cancelLabel="No"
        onClose={closeDialog}
        onConfirm={handleConfirm}
        isLoading={toggleMutation.isPending}
      />
    </>
  );
};

export function MerchantsListPage() {
  const merchantPageCustomColumns: ColumnDef<MerchantAccount>[] = [
    {
      accessorKey: "merchantName",
      header: "Merchant Name",
      cell: ({ row }) => {
        const merchantId = row.original.merchantId;
        const name = row.original.merchantName;
        return (
          <Link
            to={`/merchants/${merchantId}`}
            state={{name}}
            className="font-semibold text-primary"
          >
            {String(name || "-")}
          </Link>
        );
      },
    },
    {
      accessorKey: "merchantId",
      header: "Merchant ID",
    },
    {
      accessorKey: "last4OfDda",
      header: "Last 4 of DDA",
    },
    {
      accessorKey: "ccPricing",
      header: "CC Pricing",
    },
    {
      accessorKey: "ccProcessor",
      header: "CC Processor",
    },
    {
      accessorKey: "achProcessor",
      header: "ACH Processor",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <MerchantStatusCell row={row} />,
    },
  ];

  return (
    <div >
      <div className="flex justify-between items-center mb-3 ">
        <div className="text-lg font-bold">Merchant List</div>
      </div>
      <GenericTable<MerchantAccount>
        queryKey={["merchants-accounts"]}
        url="/api/v1/GetMerchants"
        title="All Merchants"
        customColumns={merchantPageCustomColumns}
        hiddenColumns={["mainProducerId", "location", "corporateId"]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </div>
  );
}

export default MerchantsListPage;
