import { useState, useEffect, useRef } from "react";
import hamburgerIcon from "../assets/hamburg-icon.svg"; 
import arrowRight from "../assets/arrow-small-right.svg";
import searchIcon from "../assets/search-icon.svg";
import tickMark from "../../src/assets/icon-check-mark.svg";
import { logout } from "../services/auth/auth";
import { useNavigate } from "react-router-dom";
import { useUserInfo } from "../services/profile/profileApi";
import userAvatar from "../assets/user-avatar.svg";

import {
  Bell,
  Settings,
  User,
  Menu,
  HelpCircle,
  LogOut
} from "lucide-react";
// import { Button } from "../design-system";

interface TopbarProps {
  onSidebarToggle?: () => void;
  onCollapseToggle?: () => void;
  isCollapsed?: boolean;
}

const notifications = [
    {
      id: 1,
      iconColor: "bg-blue-500",
      title: "New User: alice.h@tranzpay.com",
      date: "06/12/2025",
      time: "02:26 PM",
    },
    {
      id: 2,
      iconColor: "bg-green-500",
      title: "Transaction: #TXN-03042 completed",
      date: "06/09/2025",
      time: "03:12 PM",
    },
    {
      id: 3,
      iconColor: "bg-purple-500",
      title: "Merchant created: QwikMart",
      date: "06/02/2025",
      time: "02:35 PM",
    },
    {
      id: 4,
      iconColor: "bg-green-500",
      title: "Transaction: #TXN-03042 completed",
      date: "05/21/2025",
      time: "08:22 PM",
    },
    {
      id: 5,
      iconColor: "bg-yellow-500",
      title: "New login: john.d@tranzpay.com",
      date: "05/14/2025",
      time: "10:34 AM",
    },
  ];

const Topbar = ({ onSidebarToggle, onCollapseToggle, isCollapsed }: TopbarProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const { data: userInfo } = useUserInfo();

  const handleLogout = () => {
    logout(); // endSession clears the store and hard-redirects to /login
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigateUserDropdown = (path: string) => {
    setShowDropdown(false);
    navigate(path);
  };

  // const launchNew = () => {
  //   // Navigate to the onboarding page and request a new session via query param.
  //   navigate("/onboarding?new=1");
  // };

  return (
    <header className="w-full h-16 bg-white border-b border-divider shadow-[0_2px_6px_0_#4E617C14] flex items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger + Collapse Arrow */}
      <div className="flex items-center gap-4">
        <button className="sm:hidden" onClick={onSidebarToggle}>
          <Menu className="w-6 h-6 text-grey-700" />
        </button>

        <button className="hidden sm:block" onClick={onCollapseToggle}>
            {
                isCollapsed? (
                    <img
                        src={arrowRight}
                        alt="Toggle Sidebar"
                        className={`w-6 h-6 transition-transform duration-300`}
                    />
                ) : ( 
                    <img
                        src={hamburgerIcon}
                        alt="Toggle Sidebar"
                        className={`w-6 h-6 transition-transform duration-300`}
                    />
                )
            }                                                              
        </button>
      </div>

      {/* Right: Search, Notifications, Settings, Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden sm:flex items-center border border-divider rounded-lg w-2xs px-3 py-1 h-10 bg-divider2 focus-within:ring-1 focus-within:ring-light-grey">
          <span className="flex items-center">
              <img src={searchIcon} alt="User Icon" className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="outline-none border-none text-sm text-grey-700 w-3xs pl-2"
          />
        </div>
        {/* <div >
          <Button icon="plus" iconPosition="left" onClick={launchNew}>
            Quick: Onboard
          </Button>
        </div> */}

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            className="relative p-2 rounded-full cursor-pointer hover:bg-grey-100"
          >
            <Bell className="w-5 h-5 text-grey-600" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 w-80 bg-white shadow-md rounded-md z-20 p-4">
              {/* <h4 className="font-semibold text-sm">Notifications</h4> */}
              <ul className="space-y-3 text-sm">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 items-center border-b m-0 py-2 border-divider">
                    {/* Icon circle */}
                    <span className="flex justify-center items-center w-6 h-6 rounded-full bg-[#EFF6FF] z-10 ">
                      <img
                          src={tickMark}
                          alt="icon"
                          className="w-2.5 h-2.5"
                      />
                    </span>

                    {/* Text content */}
                    <div className="flex flex-col">
                      <span className="text-medium-grey font-semibold">{n.title}</span>
                      <span className="text-[10px] text-light-grey">
                        {n.date} — {n.time}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-center">
                <button className="mt-3 text-blue-500 text-sm font-bold">
                  See All Notifications
                </button>
              </div>
              
            </div>
          )}
        </div>

        <button>
          <Settings className="w-5 h-5 text-grey-600 hover:text-grey-900" />
        </button>

        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer"
          >
            {/* Avatar */}
            {/* <img
              src="https://i.pravatar.cc/40"
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover"
            /> */}
            <img
              src={userInfo?.picture || userAvatar}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover"
            />

            {/* Name + Role */}
            <div className="hidden md:flex flex-col leading-tight text-left">
              <span className="text-sm font-semibold text-grey-900">
                {userInfo?.name || "User"}
              </span>
              <span className="text-xs text-light-grey">
                {userInfo?.role || "Admin"}
              </span>
            </div>

            {/* Arrow */}
            <svg
              className="w-4 h-4 text-grey-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-divider rounded-lg shadow-lg z-50">

              <button
                onClick={() => handleNavigateUserDropdown("/profile")}
                className="flex items-center gap-3 cursor-pointer w-full px-4 py-3 text-sm hover:bg-grey-100"
              >
                <User className="w-4 h-4 text-grey-600" />
                My Profile
              </button>

              <button
                onClick={() => handleNavigateUserDropdown("/settings")}
                className="flex items-center gap-3 cursor-pointer w-full px-4 py-3 text-sm hover:bg-grey-100"
              >
                <Settings className="w-4 h-4 text-grey-600" />
                Settings
              </button>

              <button
                onClick={() => handleNavigateUserDropdown("/help")}
                className="flex items-center gap-3 cursor-pointer w-full px-4 py-3 text-sm hover:bg-grey-100"
              >
                <HelpCircle className="w-4 h-4 text-grey-600" />
                Need Help?
              </button>

              <div className="border-t border-divider"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 cursor-pointer w-full px-4 py-3 text-sm text-blue-600 hover:bg-grey-100"
              >
                <LogOut className="w-4 h-4 text-grey-600 " />
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
