import type { FC } from "react";
import userAvatar from "../../assets/user-avatar.svg";
import { useUserInfo } from "../../services/profile/profileApi";
import Card from "../../design-system/Card";
import Button from "../../design-system/Button";

const PersonalDetailsCard: FC = () => {
  const { data: userInfo } = useUserInfo();

  return (
    <Card className="p-5">
      {/* Title */}
      <h2 className="text-base font-semibold text-dark-grey mb-4">
        Personal Details
      </h2>

      {/* Avatar + Info */}
      <div className="flex items-center gap-7 mb-4">
        <div className="flex flex-col items-center justify-between">
            <div className="mb-2">
                <img
                src={userInfo?.picture || userAvatar}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover"
                />
            </div>
            <div>
                {/* Change Picture */}
                <button className="text-xs text-primary font-semibold bg-primary_light2 border border-primary_light1 px-3 py-1 rounded-md hover:bg-blue-50">
                    Change Picture
                </button>
            </div>
        </div>

        <div className="flex flex-col">
            <div className="flex flex-col">
            <span className="text-xs text-medium-grey">Username</span>
            <span className="text-sm font-semibold text-dark-grey">
                {userInfo?.userName || "-"}
            </span>
            </div>
            <div className="flex flex-col pt-4">
                <span className="text-xs text-medium-grey mt-1">Role</span>
                <span className="text-sm font-semibold text-dark-grey">
                    {userInfo?.role || "Admin"}
                </span>
            </div>
        </div>
      </div>

      

      <hr className="mb-4 text-divider" />

      {/* Full Name */}
      <div className="mb-3">
        <label className="label-base">Full Name</label>
        <input
          type="text"
          defaultValue={userInfo?.name || ""}
          readOnly
          className="input-base-form"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="label-base">Email</label>
        <input
          type="email"
          defaultValue={userInfo?.email || ""}
          readOnly
          className="input-base-form"
        />
      </div>

      {/* Save Button */}
      <Button
        variant="primary"
        className="font-semibold text-sm cursor-pointer opacity-30"
        type="submit"
        disabled={true}
    >
         Save Changes
    </Button>
    </Card>
  );
};

export default PersonalDetailsCard;