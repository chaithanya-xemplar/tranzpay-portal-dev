import { useMemo, useState } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { Link, useParams } from "react-router-dom";
import Card from "../../../design-system/Card";
import GenericTable from "../../../components/table/GenericTable";
import StatusToggle from "../../../components/table/StatusToggle";
import ConfirmDialog from "../../../design-system/dialog/ConfirmDialog";
import { useToggleMerchantStatus } from "../../../services/merchants/merchantApi";
import { useToast } from "../../../design-system/toast/ToastContext";

interface ProducerAccount extends Record<string, unknown> {
  merchantId: number | string;
  producerId: number | string;
  producerName: string;
  merchantName: string;
  corpAccount: string;
  status: boolean;
  mainProducerId: number | string;
}

export default function MerchantProducersTab() {
  const { id } = useParams<{ id: string }>();
  const merchantId = useMemo(() => Number(id), [id]);
  const toggleMutation = useToggleMerchantStatus();
  const { toast } = useToast();

  const ProducerStatusCell = ({ row }: { row: Row<ProducerAccount> }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isActive = row.original.status === true;

    const handleConfirm = () => {
      toggleMutation.mutate(
        {
          mainProducerId: row.original.mainProducerId,
          merchantId,
          producerId: Number(row.original.producerId),
          status: !isActive,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            toast({ variant: "success", title: "Status updated" });
          },
          onError: () => {
            setIsDialogOpen(false);
            toast({ variant: "error", title: "Failed to update status" });
          },
        }
      );
    };

    return (
      <>
        <StatusToggle active={isActive} onChange={() => setIsDialogOpen(true)} />
        <ConfirmDialog
          isOpen={isDialogOpen}
          title="Alert"
          description="Are you sure you want to change status?"
          confirmLabel="Yes"
          cancelLabel="No"
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleConfirm}
          isLoading={toggleMutation.isPending}
        />
      </>
    );
  };

  const columns: ColumnDef<ProducerAccount>[] = [
    {
      accessorKey: "producerName",
      header: "Producer Name",
      cell: ({ row }) => (
        <Link
          to={`/producers/${row.original.producerId}`}
          className="font-semibold text-primary"
        >
          {String(row.original.producerName || "-")}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProducerStatusCell row={row} />,
    },
  ];

  return (
    <Card>
      <GenericTable<ProducerAccount>
        queryKey={["producers-accounts", merchantId]}
        url={`/api/v1/Merchant/${merchantId}/Producers`}
        title="List of associated producers"
        customColumns={columns}
        hiddenColumns={["merchantName", "mainProducerId", "merchantId"]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </Card>
  );
}