import CorpForm from "../../pages/corps/CorpsForm";
import { useGetCorp, useUpdateCorp } from "../../services/corps/corpApi";
import type { CorpFormValues } from "../../schemas/corpsSchema";
import { useMemo, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Button from "../../design-system/Button";
import Card from "../../design-system/Card";
import GenericTable from "../../components/table/GenericTable";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../design-system/dialog/ConfirmDialog";
import StatusToggle from "../../components/table/StatusToggle";
import { useToggleMerchantStatus } from "../../services/merchants/merchantApi";
import { useToast } from "../../design-system/toast/ToastContext";
import Icon from "../../components/Icon/Icon";
import ErrorBoundaryPage from "../../components/ErrorBoundaryPage";

const MerchantStatusCell = ({ row }: { row: Row<MerchantAccount> }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActive = row.original.status === true;
  const mainProducerId = row.original.mainProducerId;
  const merchantId = typeof row.original.merchantId === "string" ? Number(row.original.merchantId) : row.original.merchantId;
  const merchantName = row.original.merchantName;
  const producerId = Number(row.original.producerId);

  const toggleMutation = useToggleMerchantStatus();
  const { toast } = useToast();

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleConfirm = () => {
    
    toggleMutation.mutate(
      {
        mainProducerId,
        merchantId,
        producerId,
        mode: "corp-details",
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
}
interface MerchantAccount extends Record<string, unknown> {
  merchantId: number | string;
  merchantName: string;
  corpAccount: string;
  status: boolean;
  mainProducerId: number | string;
}

export default function CorpDetailsPage() {
  const { id: idParam } = useParams<{id: string}> ();
  const corporateId = useMemo(() => (idParam ? Number(idParam) : NaN), [idParam]);
  const hasValidId = Number.isFinite(corporateId);


  const updateCorp = useUpdateCorp();
  const formRef = useRef<UseFormReturn<CorpFormValues> | null>(null);

  const {
    data: initialValues,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCorp(corporateId);

  const navigate = useNavigate();

  const handleSubmit = async (values: CorpFormValues) => {
    if (!hasValidId) return;
    await updateCorp.mutateAsync({
      ...values,
      corporateId
    });
  };

  const handleReset = () => {
    if (!formRef.current || !initialValues) return;
    formRef.current.reset(initialValues);
  };

  const merchantPageCustomColumns: ColumnDef<MerchantAccount>[] = [
      {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <MerchantStatusCell row={row} />, // 🔹 now uses our cell
    },
  ];

  if (!hasValidId) {
    return (
      <div className="p-4">
        <div className="mb-2 text-red-600 font-medium">
          Invalid or missing corporate id in the URL. Expected /merchants/:id
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4 mt-1">
          <div className="text-lg font-bold pl-1 text-dark-grey">corporate Information</div>
        </div>
        <Card>
          <div className="animate-pulse p-6">Loading corporate</div>
        </Card>
      </div>
    );
  }

  if (isError || !initialValues) {
    return (
      <ErrorBoundaryPage
        error={error}
        title="Failed to load corporate"
        onReload={() => refetch()}
        onSecondaryClick={() => navigate("/corps")}
        secondaryActionLabel="Back to Corps"
      />
    );
  }
  

  return (
    <div>
        <div className='flex justify-between items-center mb-4 mt-1'>
            <div className="flex justify-center text-lg font-bold pl-1 text-dark-grey">
              <button className="mr-2 cursor-pointer" onClick={() => navigate("/corps")}>
                <Icon name="arrow-left" size={24} />
              </button>
              <span>
                {initialValues.companyName}
              </span>
            </div>
            <div className="flex justify-end gap-2">
                <Link to={"/merchants/create"} state={{ corporateId , corpName: initialValues.companyName }}>
                  <Button
                    variant="outline"
                    className="cursor-pointer border text-sm font-semibold"
                    icon="plus"
                    iconPosition="left"
                  >
                    New Merchant
                  </Button>
                </Link>
                

                <Button 
                    variant="outline"
                    className='font-semibold text-sm border cursor-pointer'
                    icon="refresh"
                    iconPosition='left'
                    onClick={handleReset}
                    > 
                    Reset
                </Button>

                <Button 
                    variant="primary"
                    className='font-semibold text-sm border cursor-pointer'
                    icon="save"
                    iconPosition='left'
                    disabled={updateCorp.isPending}
                    onClick={() => formRef.current?.handleSubmit(handleSubmit)()}
                    > 
                    Save
                </Button>
            </div>
        </div>
        {/* </div> */}
      <Card>
        <CorpForm mode="edit" onSubmit={handleSubmit} formRef={formRef} initialValues= {initialValues} />
      </Card>

      <Card className="mt-5">
        <GenericTable<MerchantAccount>
                queryKey={["merchants-accounts", corporateId]}
                url={`/api/v1/Corporate/${idParam}/Merchants`}
                title="List of associated merchants"
                customColumns={merchantPageCustomColumns}
                hiddenColumns={["mainProducerId", "location", "corporateId", "corpAccount"]}
                showStatusFilter
                statusFilterLabel="status"
              />
      </Card>
    </div>
  );
}
