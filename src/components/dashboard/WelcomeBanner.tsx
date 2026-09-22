// import userAvatar from "../../assets/user-avatar.svg";

import { useUserInfo } from "../../services/profile/profileApi";

const WelcomeBanner = () => {
  const { data: userInfo } = useUserInfo();
  return (
    <header className="flex items-center justify-between mb-3">
      <div>
        <p className="text-sm font-bold text-grey-900">Hello {userInfo?.name || "Admin"},</p>
        <p className="text-xs text-grey-500">
          Here’s a quick overview of the account
        </p>
      </div>
    </header>
  );
};

export default WelcomeBanner;
