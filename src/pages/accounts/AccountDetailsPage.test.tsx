import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ToastProvider } from "../../design-system/toast/ToastProvider";
import AccountDetailsPage from "./AccountDetailsPage";

describe("AccountDetailsPage", () => {
  it("renders static account details following the Corps UI layout", () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/accounts/ACC-10001"]}>
          <Routes>
            <Route path="/accounts/:id" element={<AccountDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    expect(screen.getAllByText("Atlas Holdings Group").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("ACC-10001")).toBeInTheDocument();
    expect(screen.getByText("Account Information")).toBeInTheDocument();
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Renee")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Park")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Account Owner")).toBeInTheDocument();
    expect(screen.getByDisplayValue("renee.park@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100 Demo Plaza")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Charleston")).toBeInTheDocument();
    expect(screen.getByDisplayValue("29401")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("renders another static account by ID", () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/accounts/ACC-10003"]}>
          <Routes>
            <Route path="/accounts/:id" element={<AccountDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    expect(screen.getAllByText("Bluepeak Ventures").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("ACC-10003")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Marcus")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nguyen")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CFO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("marcus.nguyen@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Denver")).toBeInTheDocument();
  });
});
