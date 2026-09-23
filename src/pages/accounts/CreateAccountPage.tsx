import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import Icon from "../../components/Icon/Icon";
import { Button, Card } from "../../design-system";
import { useToast } from "../../design-system/toast/ToastContext";
import AccountForm, { type AccountFormHandle, type AccountFormValues } from "./AccountForm";

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<AccountFormHandle | null>(null);

  const handleSubmit = (values: AccountFormValues) => {
    toast({
      variant: "success",
      title: "Success",
      description: `Account "${values.companyName || "New Account"}" created successfully.`,
    });
    navigate("/accounts");
  };

  const handleReset = () => {
    formRef.current?.reset();
    toast({
      variant: "info",
      title: "Reset",
      description: "Form reset to default values.",
    });
  };

  return (
    <div>
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
          <span>New Account</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="cursor-pointer border text-sm font-semibold"
            icon="refresh"
            iconPosition="left"
            type="button"
            onClick={handleReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            className="cursor-pointer border text-sm font-semibold"
            icon="save"
            iconPosition="left"
            type="button"
            onClick={() => formRef.current?.submit()}
          >
            Submit
          </Button>
        </div>
      </div>

      <Card>
        <AccountForm mode="create" onSubmit={handleSubmit} formRef={formRef} />
      </Card>
    </div>
  );
}
