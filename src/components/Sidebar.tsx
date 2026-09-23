import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import dashboardMenuIcon from "../assets/dashboard-menu-icon.svg";
import adminSettingsIcon from "../assets/admin-settings-menu-icon.svg";
import ivrMenuIcon from "../assets/ivr-menu-icon.svg";

const Sidebar = ({ collapsed, setCollapsed}: { collapsed: boolean; setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;}) => {
  const [adminOpen, setAdminOpen] = useState(false);
  const location = useLocation();
  
  const menuItems = [
    { label: "Dashboard", icon: dashboardMenuIcon, path: "/" },
    {
      label: "Admin",
      icon: adminSettingsIcon,
      children: [
        { label: "Accounts", path: "/accounts" },
        { label: "Corps", path: "/corps" },
        { label: "Merchants", path: "/merchants" },
        { label: "Producers", path: "/producers" },
        { label: "Users", path: "/users" },
        { label: "Processors", path: "/processors" },
        { label: "API Logs", path: "/api-logs" },
        { label: "Blacklisted Bank Accounts", path: "/blacklisted-accounts" },
        // { label: "Onboarding", path: "/onboarding" },
      ],
    },
    { label: "IVR", icon: ivrMenuIcon, path: "/ivr" },
  ];

  useEffect(() => {
    if (collapsed) {
      setAdminOpen(false);
    }
  }, [collapsed, setAdminOpen]);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen ${
        collapsed ? "w-16" : "w-64"
      } px-2 py-6 bg-[linear-gradient(to_bottom,_#113252,_#02162A)] text-white transition-all duration-300 overflow-hidden`}
    >
      <div className="flex justify-center items-center mb-6">
        {!collapsed && <Logo className="w-32 h-auto" />}
      </div>

      <nav className="flex flex-col space-y-1">
        { menuItems.map((item) => {
          const isAdminActive =
          item.label === "Admin" &&
          item.children?.some((child) => location.pathname.startsWith(child.path));
        return (
          <div key={item.label}>
            {!item.children ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-3 rounded-lg transition ${
                    isActive ? "bg-hover-background" : "hover:bg-hover-background"
                  }`
                }
              >
                <span className="text-lg w-6">
                  <img src={item.icon} alt={item.label} className="h-5 w-5" />
                </span>
                {!collapsed && <span className="ml-3 text-sm">{item.label}</span>}
              </NavLink>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);        // Expand sidebar
                      setAdminOpen(true);         // Open Admin submenu
                    } else {
                      setAdminOpen((prev) => !prev); // Toggle Admin submenu
                    }
                  }}
                  className={`w-full flex items-center px-3 py-3 mb-1 rounded-lg transition ${
                    isAdminActive ? "bg-hover-background" : "hover:bg-hover-background"
                  }`}
                >
                  <span className="text-lg w-6">
                    <img src={item.icon} alt={item.label} className="h-5 w-5" />
                  </span>
                  {!collapsed && <span className="ml-3 text-sm">{item.label}</span>}
                  {!collapsed && (
                    <span className="ml-auto">{adminOpen ? "▾" : "▸"}</span>
                  )}
                </button>

                {adminOpen && (
                  <div
                    className={`${collapsed ? "hidden" : ""} ml-2 space-y-1`}
                  >
                    {item.children.map((child, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={child.path}
                        className={({ isActive }) =>
                          `block w-full text-left text-sm px-2 py-2 rounded transition ${
                            isActive
                              ? "text-white"
                              : "text-blue"
                          }`
                        }
                      >
                      {({ isActive }) => (
                        <div className="d-flex flex items-center">
                          <div className={`h-[1px] w-3 transition ${ isActive ? "bg-white" : "bg-blue" }`}></div>
                          <div className="text-xs ml-5">{child.label}</div>
                        </div>
                      )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
      </nav>
    </aside>
  );
};

export default Sidebar;
