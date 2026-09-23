import { useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Icon from "../../components/Icon/Icon";
import { Button, Card } from "../../design-system";
import { useToast } from "../../design-system/toast/ToastContext";
import { MOCK_ACCOUNTS } from "../../services/onboarding/mockAccounts";
import { formatPhoneNumber } from "../../utils/formatters";
import AccountForm, { type AccountFormHandle, type AccountFormValues } from "./AccountForm";

export default function AccountDetailsPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<AccountFormHandle | null>(null);

  const account = useMemo(() => {
    if (!idParam) return null;
    const match = MOCK_ACCOUNTS.find(
      (a) =>
        a.id.toLowerCase() === idParam.toLowerCase() ||
        a.name.toLowerCase() === idParam.toLowerCase()
    );
    if (match) return match;

    const numericIndex = Number(idParam);
    if (Number.isFinite(numericIndex) && MOCK_ACCOUNTS[numericIndex - 1]) {
      return MOCK_ACCOUNTS[numericIndex - 1];
    }
    return MOCK_ACCOUNTS[0] ?? null;
  }, [idParam]);

  const initialValues: Partial<AccountFormValues> = useMemo(() => {
    return {
      accountId: account?.id ?? idParam ?? "",
      companyName: account?.name ?? "",
      timeZone: "Eastern",
      contactFirstName: account?.contact.firstName ?? "",
      contactLastName: account?.contact.lastName ?? "",
      title: account?.contact.title ?? "Account Owner",
      email: account?.contact.email ?? "",
      primaryPhone: account?.contact.phone ? formatPhoneNumber(account.contact.phone) : "",
      secondaryPhone: "",
      address1: account?.address.line1 ?? "",
      address2: account?.address.line2 ?? "",
      city: account?.address.city ?? "",
      state: account?.address.state ?? "",
      zipCode: account?.address.zip ?? "",
      status: true,
    };
  }, [account, idParam]);

  const handleReset = () => {
    formRef.current?.reset();
    toast({
      variant: "info",
      title: "Reset",
      description: "Account details reset to original values.",
    });
  };

  const handleSave = (values: AccountFormValues) => {
    toast({
      variant: "success",
      title: "Account saved",
      description: `"${values.companyName}" details saved successfully.`,
    });
  };

  if (!idParam) {
    return (
      <div className="p-4">
        <div className="mb-2 font-medium text-red-600">
          Invalid or missing account id in the URL. Expected /accounts/:id
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header - same as CorpDetailsPage */}
      <div className="mb-4 mt-1 flex items-center justify-between">
        <div className="flex items-center justify-center pl-1 text-lg font-bold text-dark-grey">
          <button
            type="button"
            className="mr-2 cursor-pointer"
            onClick={() => navigate("/accounts")}
            aria-label="Back to accounts"
          >
            <Icon name="arrow-left" size={24} />
          </button>
          <span>{account?.name || `Account #${idParam}`}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/accounts/create">
            <Button
              variant="outline"
              className="cursor-pointer border text-sm font-semibold"
              icon="plus"
              iconPosition="left"
            >
              New Account
            </Button>
          </Link>

          <Button
            variant="outline"
            className="cursor-pointer border text-sm font-semibold"
            icon="refresh"
            iconPosition="left"
            onClick={handleReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            className="cursor-pointer border text-sm font-semibold"
            icon="save"
            iconPosition="left"
            onClick={() => formRef.current?.submit()}
          >
            Save
          </Button>
        </div>
      </div>

      <Card>
        <AccountForm
          mode="edit"
          onSubmit={handleSave}
          formRef={formRef}
          initialValues={initialValues}
        />
      </Card>
    </div>
  );
}
