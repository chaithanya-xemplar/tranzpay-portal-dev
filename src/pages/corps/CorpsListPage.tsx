import type { ColumnDef, Row } from "@tanstack/react-table";
import GenericTable from "../../components/table/GenericTable";
import Button from "../../design-system/Button";
import { Link } from "react-router-dom";
import { useToggleCorpStatus } from "../../services/corps/corpApi";
import { useToast } from "../../design-system/toast/ToastContext";
import ConfirmableStatusToggle from "../../components/table/ConfirmableStatusToggle";

interface CorpAccount extends Record<string, unknown> {
  corporateId: number | string;
  companyName: string;
  username: string;
  email: string;
  merchants: string;
  status: boolean;
}

const CorpStatusCell = ({ row }: { row: Row<CorpAccount> }) => {
  const isActive = row.original.status === true;
  const corporateId = row.original.corporateId;
  const username = row.original.username;
  const companyName = row.original.companyName;
  const displayName = username || companyName || "-";

  const toggleMutation = useToggleCorpStatus();
  const { toast } = useToast();

  const handleConfirm = (nextStatus: boolean) => {
    toggleMutation.mutate(
      {
        corporateId,
        status: nextStatus,
      },
      {
        onSuccess: (res) => {
          toast({
            variant: "success",
            title: "Status updated",
            description:
              res?.data?.message ||
              `"${displayName}" status updated successfully`,
          });
        },
        onError: (error) => {
          toast({
            variant: "error",
            title: "Failed to update status",
            description:
              error?.response?.data?.data?.message ||
              error?.message ||
              "Something went wrong. Please try again.",
          });
        },
      }
    );
  };

  return (
    <ConfirmableStatusToggle
      active={isActive}
      id={corporateId}
      name={displayName}
      entityLabel="company"
      isLoading={toggleMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
};

export function CorpsListPage() {
  const corpsPageCustomColumns: ColumnDef<CorpAccount>[] = [
    {
      accessorKey: "corporateId",
      header: "Company ID",
    },
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => {
        const corpId = row.original.corporateId;
        const corpName = row.original.companyName;
        return (
          <Link
            to={`/corps/${corpId}`}
            className="font-semibold text-primary"
          >
            {String(corpName || "-")}
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <CorpStatusCell row={row} />,
    },
  ];

  return (
    <div >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold">Company List</div>
        <div>
          <Link to="/corps/create">
            <Button
              variant="outline"
              icon="plus"
              iconPosition="left"
            >
              New Company
            </Button>
          </Link>
        </div>
      </div>

      <GenericTable<CorpAccount>
        queryKey={["corps-accounts"]}
        url="/api/v1/GetCorporates"
        title="All Companies"
        customColumns={corpsPageCustomColumns}
        hiddenColumns={[]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </div>
  );
}

export default CorpsListPage;
