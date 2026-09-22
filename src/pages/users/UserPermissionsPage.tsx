import { useLocation, useParams } from "react-router-dom";
import UserPermissionsTable from "./UserPermissionsTable";

const UserPermissionsPage = () => {
  const { userId } = useParams();
  const location = useLocation();
  if (!userId) {
    return <div>Invalid User</div>;
  }

  return <UserPermissionsTable userId={Number(userId)} userName={location?.state?.userName} />;
};

export default UserPermissionsPage;