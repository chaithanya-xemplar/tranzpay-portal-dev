import type { ColumnDef } from "@tanstack/react-table";
import GenericTable from "../../../src/components/table/GenericTable";
import { Link } from "react-router-dom";
// import Button from "../../design-system/Button";
// import addIcon from "../../assets/icon-add.svg";


// Define the type for your data row for better type safety
interface UserAccount extends Record<string, unknown> {
  username: string;
  name: string;
  email: string;
}


export function UsersListPage() {
  const userPageCustomColumns: ColumnDef<UserAccount>[] = [
    {
      accessorKey: "userName",
      header: "User Name",
      cell: ({ row }) => {
        const userId = row.original.userId;
        const name = row.original.userName;
        return (
          <Link
            to={`/users/${userId}/permissions`}
            className="font-semibold text-primary"
            state={{ userName: name, userId }}
          >
            {String(name || "-")}
          </Link>
        );
      },
    },
    {
      header: " ",
      cell: ({ row }) => {
          const userId = row.original.userId;

        return (
          <Link
            to={`/users/${userId}/permissions`}
            className="w-36 py-1 px-3 text-primary font-semibold border border-primary_light1
           bg-primary_light2 rounded-sm"
           state={{
              userName: row.original.userName
            }}
          >
            {'View Permissions'}
          </Link>
        );
      },
    }
  ]
  return (
    <div >
      <div className='flex justify-between items-center mb-3 '>
        <div className="text-lg font-bold">User Accounts List</div>
      </div>
      <GenericTable<UserAccount> // 👈 Pass the type
        queryKey={["users-accounts"]}
        url="/api/v1/GetUsers"
        title="All User Accounts"
        customColumns={userPageCustomColumns}
        hiddenColumns={["userId"]}
        showStatusFilter
        statusFilterLabel="Status"
      />
    </div>
  );
}

export default UsersListPage;