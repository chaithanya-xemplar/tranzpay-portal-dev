import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Breadcrumbs from "../components/breadcrumbs/Breadcrumbs";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarOpen = () => setSidebarOpen((prev) => !prev);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (fixed position) */}
      {sidebarOpen && (
        <div
          className={`fixed top-0 left-0 z-30 h-screen ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>
      )}
      
      <div
        className={`flex flex-col flex-1 min-w-0 ${
          sidebarOpen ? (sidebarCollapsed ? "ml-16" : "ml-64") : "ml-0"
        }`}
      >
        <Topbar
          onSidebarToggle={toggleSidebarOpen}
          onCollapseToggle={toggleSidebarCollapsed}
          isCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-auto scrollbar-hide p-4 pt-3 bg-background">
          {/* <div className="max-w-screen-2xl mx-auto pb-4"> */}
            <Breadcrumbs />
            <Outlet />
          {/* </div> */}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
