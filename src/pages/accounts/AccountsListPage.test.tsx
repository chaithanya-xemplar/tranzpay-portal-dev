import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../design-system/toast/ToastProvider";
import AccountsListPage from "./AccountsListPage";

describe("AccountsListPage", () => {
  it("renders the account list header and sample onboarding account rows", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <AccountsListPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText("Account List")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new account/i })).toBeInTheDocument();
    expect(screen.getByText("Atlas Holdings Group")).toBeInTheDocument();
    expect(screen.getByText("Renee Park")).toBeInTheDocument();
  });
});
