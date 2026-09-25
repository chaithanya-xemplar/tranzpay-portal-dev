import { useNavigate, useParams, Link, useLocation, Outlet } from "react-router-dom";
import { useMemo } from "react";
import Card from "../../design-system/Card";
import Button from "../../design-system/Button";
import Tabs from "../../design-system/tab/Tabs";
import { getMerchant, useGetMerchant } from "../../services/merchants/merchantApi";
import { useQuery } from "@tanstack/react-query";
// import { useToast } from "../../design-system/toast/ToastContext";
import Icon from "../../components/Icon/Icon";
import ErrorBoundaryPage from "../../components/ErrorBoundaryPage";

type MerchantTab = "info" | "producers" | "processors";

export default function MerchantDetailsPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const merchantId = useMemo(() => (idParam ? Number(idParam) : NaN), [idParam]);

  const navigate = useNavigate();
  // const { toast } = useToast();

  const location = useLocation();

  const activeTab: MerchantTab =
    location.pathname.includes("/producers")
      ? "producers"
      : location.pathname.includes("/processors")
      ? "processors"
      : "info";

  const { data: initialValues, isLoading, isError, error, refetch } =
    useGetMerchant(merchantId);

  const { data: merchantApiMetaData } = useQuery({
    queryKey: ["merchant-raw", merchantId],
    enabled: Number.isFinite(merchantId),
    queryFn: () => getMerchant(merchantId),
  });

  const tabs = [
    { key: "info", label: "Merchant Info" },
    { key: "producers", label: "Associated Processing Profiles" },
    { key: "processors", label: "Processor Details" },
  ];

  if (isLoading)
    return (
      <Card>
        <div className="animate-pulse p-6">Loading...</div>
      </Card>
    );

  if (isError || !initialValues) {
    return (
      <ErrorBoundaryPage
        error={error}
        title="Failed to load merchant"
        onReload={() => refetch()}
        onSecondaryClick={() => navigate("/merchants")}
        secondaryActionLabel="Back to Merchants"
      />
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center text-lg font-bold">
          <button onClick={() => navigate("/merchants")} className="mr-2">
            <Icon name="arrow-left" size={24} />
          </button>
          {initialValues.companyName}
        </div>

        <Link
          to={"/producers/create"}
          state={
            merchantApiMetaData
              ? {
                  merchantId: merchantApiMetaData.merchantId,
                  merchantName: merchantApiMetaData.companyName,
                  mainProducerId: merchantApiMetaData.mainProducerId,
                  corporateId: Number(merchantApiMetaData.corporateId ?? 0),
                }
              : undefined
          }
        >
          <Button
            variant="outline"
            className="cursor-pointer border text-sm font-semibold"
            icon="plus"
            iconPosition="left"
          >
            New Processing Profile
          </Button>
        </Link>
      </div>

      {/* TABS */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(key) => {
          if (key === "info") navigate(`/merchants/${merchantId}`);
          if (key === "producers") navigate(`/merchants/${merchantId}/producers`);
          if (key === "processors") navigate(`/merchants/${merchantId}/processors`);
        }}
      />

      <Outlet />

    </div>
  );
}
