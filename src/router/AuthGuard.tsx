// src/routes/AuthGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { tokenStore } from "../services/auth/tokenStore";

export const AuthGuard = () => {
  const accessToken = tokenStore.getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the nested routes (MainLayout, etc.)
  return <Outlet />;
};
