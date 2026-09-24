import { createBrowserRouter, RouterProvider } from "react-router-dom";

import LoginPage from "../pages/login/LoginPage";
import ForgotPasswordPage from "../pages/forgot-password/ForgotPasswordPage";
import ResetPasswordPage from "../pages/reset-password/ResetPasswordPage";

import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";

import AccountsListPage from "../pages/accounts/AccountsListPage";
import CreateAccountPage from "../pages/accounts/CreateAccountPage";
import AccountDetailsPage from "../pages/accounts/AccountDetailsPage";

import CorpsListPage from "../pages/corps/CorpsListPage";
import CreateCorpPage from "../pages/corps/CreateCorpPage";
import CorpDetailsPage from "../pages/corps/CorpDetailsPage";

import MerchantsListPage from "../pages/merchants/MerchantsListPage";
import CreateMerchantsPage from "../pages/merchants/CreateMerchantsPage";
import MerchantDetailsPage from "../pages/merchants/MerchantDetailsPage";

import ProducersListPage from "../pages/producers/ProducersListPage";
import ProducerDetailsPage from "../pages/producers/ProducerDetailsPage";
import CreateProducersPage from "../pages/producers/CreateProducersPage";

import UsersListPage from "../pages/users/usersListPage";
import UserPermissionsPage from "../pages/users/UserPermissionsPage";

import ProcessorsListPage from "../pages/processors/ProcessorsListPage";
import ProcessorDetailsPage from "../pages/processors/ProcessorDetailsPage";
import ProcessorCreatePage from "../pages/processors/ProcessorCreatePage";

import BlacklistedAccountsPage from "../pages/blacklisted-accounts/BlacklistedAccountsPage";
import IvrAccountsPage from "../pages/ivr/IvrAccountsPage";
import APILogsPage from "../pages/api-logs/APILogsPage";
import DesignSystemPage from "../pages/design-system/DesignSystemPage";

import CreateMerchantProcessorPage from "../pages/merchants/processors/CreateMerchantProcessorPage";

import { AuthGuard } from "./AuthGuard";
import MerchantProcessorList from "../pages/merchants/processors/MerchantProcessorList";
import MerchantProcessorsTab from "../pages/merchants/tabs/MerchantProcessorsTab";
import MerchantInfoTab from "../pages/merchants/tabs/MerchantInfoTab";
import MerchantProducersTab from "../pages/merchants/tabs/MerchantProducersTab";
import MerchantProcessorDetailsPage from "../pages/merchants/processors/MerchantProcessorDetailsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import ErrorBoundaryPage from "../components/ErrorBoundaryPage";
import OnboardingListPage from "../pages/onboarding/OnboardingListPage";

const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },

  // PROTECTED ROUTES
  {
    path: "/",
    element: <AuthGuard />,
    children: [
      {
        element: <MainLayout />,
        errorElement: <ErrorBoundaryPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "profile", element: <ProfilePage /> },
          /* ---------------- ACCOUNTS ---------------- */
          { path: "accounts", element: <AccountsListPage /> },
          { path: "accounts/create", element: <CreateAccountPage /> },
          { path: "accounts/:id", element: <AccountDetailsPage /> },

          /* ---------------- CORPS ---------------- */
          { path: "corps", element: <CorpsListPage /> },
          { path: "corps/create", element: <CreateCorpPage /> },
          { path: "corps/:id", element: <CorpDetailsPage /> },

          /* ---------------- MERCHANTS ---------------- */
          { path: "merchants", element: <MerchantsListPage /> },
          { path: "merchants/create", element: <CreateMerchantsPage /> },

          {
            path: "merchants/:id",
            element: <MerchantDetailsPage />,
            children: [
              { index: true, element: <MerchantInfoTab /> },
              { path: "producers", element: <MerchantProducersTab /> },
              {
                path: "processors",
                element: <MerchantProcessorsTab />,
                children: [
                  { index: true, element: <MerchantProcessorList /> },
                  { path: "create", element: <CreateMerchantProcessorPage /> },
                  { path: ":processorId", element: <MerchantProcessorDetailsPage /> },
                ],
              },
            ],
          },

          /* ---------------- PRODUCERS ---------------- */
          { path: "producers", element: <ProducersListPage /> },
          { path: "producers/create", element: <CreateProducersPage /> },
          { path: "producers/:id", element: <ProducerDetailsPage /> },

          /* ---------------- USERS ---------------- */
          { path: "users", element: <UsersListPage /> },
          {
            path: "users/:userId/permissions",
            element: <UserPermissionsPage />,
          },

          /* ---------------- GLOBAL PROCESSORS ---------------- */
          { path: "processors", element: <ProcessorsListPage /> },
          { path: "processors/create", element: <ProcessorCreatePage /> },
          { path: "processors/:id", element: <ProcessorDetailsPage /> },

          /* ---------------- ONBOARDING ---------------- */
          { path: "onboarding", element: <OnboardingListPage /> },

          /* ---------------- UI SHOWCASE ---------------- */
          { path: "design-system", element: <DesignSystemPage /> },

          /* ---------------- OTHER MODULES ---------------- */
          { path: "api-logs", element: <APILogsPage /> },
          { path: "blacklisted-accounts", element: <BlacklistedAccountsPage /> },
          { path: "ivr", element: <IvrAccountsPage /> },
          {
            path: "*",
            element: (
              <ErrorBoundaryPage
                code="404"
                title="Page not found"
                message="Sorry, we couldn’t find the page you’re looking for."
                showReload={false}
              />
            ),
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;