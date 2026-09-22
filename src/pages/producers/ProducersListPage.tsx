// src/pages/ProducersListPage.tsx
import { useState } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import GenericTable from "../../../src/components/table/GenericTable";
// import Button from "../../design-system/Button";
// import addIcon from "../../assets/icon-add.svg";
import { Link } from "react-router-dom";

import ConfirmDialog from "../../../src/design-system/dialog/ConfirmDialog";
import { useToast } from "../../../src/design-system/toast/ToastContext";
import { useToggleProducerStatus } from "../../../src/services/producers/producerApi";

// Toggle switch UI (same as merchant)
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

// Row shape coming from /api/v1/GetProducers
interface ProducerAccount extends Record<string, unknown> {
  producerId: number | string;
  producerName: string;
  corpAccount: string;
  status: boolean; // 🔹 SAME as MerchantAccount.status
  mainProducerId?: number | string; // only if your API sends this
  // ... other properties
}

// Cell that handles confirm dialog + mutation (mirrors MerchantStatusCell)
const ProducerStatusCell = ({ row }: { row: Row<ProducerAccount> }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActive = row.original.status === true;
  const producerId = row.original.producerId;
  const producerName = row.original.producerName;

  const toggleMutation = useToggleProducerStatus();
  const { toast } = useToast();

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleConfirm = () => {
    toggleMutation.mutate(
      {
        producerId,
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
              `"${producerName}" status updated successfully`,
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

export function ProducersListPage() {
  const producerPageCustomColumns: ColumnDef<ProducerAccount>[] = [
    {
      accessorKey: "producerId",
      header: "Producer ID",
    },
    {
      accessorKey: "producerName",
      header: "Producer Name",
      cell: ({ row }) => {
        const producerId = row.original.producerId;
        const name = row.original.producerName;
        return (
          <Link
            to={`/producers/${producerId}`}
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
      accessorKey: "corporateId",
      header: "Corporate ID",
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
      cell: ({ row }) => <ProducerStatusCell row={row} />,
    },
  ];

  return (
    <div >
      <div className="flex justify-between items-center mb-3 ">
        <div className="text-lg font-bold">Producer List</div>
        {/* <div>
          <Link to="/producers/create">
            <Button
              bgColor="bg-primary_light2"
              textColor="text-primary"
              borderColor="border-primary_light1"
              className="font-semibold text-sm border"
              iconSrc={addIcon}
              iconPosition="left"
            >
              New Producer
            </Button>
          </Link>
        </div> */}
      </div>
      <GenericTable<ProducerAccount>
        queryKey={["producers-accounts"]}
        url="/api/v1/GetProducers"
        title="All Producers"
        customColumns={producerPageCustomColumns}
        hiddenColumns={["mainProducerId", "ccPricing", "location", "corporateId", "integration"]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </div>
  );
}

export default ProducersListPage;
