import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import GenericTable from "../../components/table/GenericTable";
import Button from "../../design-system/Button";
import { MOCK_ACCOUNTS } from "../../services/onboarding/mockAccounts";

interface AccountRecord extends Record<string, unknown> {
  accountId: number | string;
  companyName: string;
  contactName: string;
  email: string;
  address: string;
  status: boolean;
}

const fallbackAccounts: AccountRecord[] = MOCK_ACCOUNTS.map((account) => ({
  accountId: account.id,
  companyName: account.name,
  contactName: `${account.contact.firstName} ${account.contact.lastName}`.trim(),
  email: account.contact.email,
  address: [
    account.address.line1,
    account.address.city,
    account.address.state,
    account.address.zip,
  ]
    .filter(Boolean)
    .join(", "),
  status: true,
}));

export function AccountsListPage() {
  const accountPageCustomColumns: ColumnDef<AccountRecord>[] = [
    {
      accessorKey: "accountId",
      header: "Account ID",
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }) => {
        const accountId = row.original.accountId;
        const companyName = row.original.companyName;

        return (
          <Link
            to={`/accounts/${accountId}`}
            className="font-semibold text-primary"
          >
            {String(companyName || "-")}
          </Link>
        );
      },
    },
    {
      accessorKey: "contactName",
      header: "Primary Contact",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === true;

        return (
          <span
            className={
              isActive
                ? "inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                : "inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold">Account List</div>
        <div>
          <Link to="/accounts/create">
            <Button variant="outline" icon="plus" iconPosition="left">
              New Account
            </Button>
          </Link>
        </div>
      </div>

      <GenericTable<AccountRecord>
        queryKey={["accounts"]}
        title="All Accounts"
        staticData={fallbackAccounts}
        customColumns={accountPageCustomColumns}
        hiddenColumns={[]}
        showStatusFilter
        statusFilterLabel="status"
      />
    </div>
  );
}

export default AccountsListPage;
