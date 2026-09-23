import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ToastProvider } from "../../design-system/toast/ToastProvider";
import CreateAccountPage from "./CreateAccountPage";

describe("CreateAccountPage", () => {
  it("renders the create account form following Corps UI layout", () => {
    render(
      <ToastProvider>
        <MemoryRouter>
          <CreateAccountPage />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(screen.getByText("New Account")).toBeInTheDocument();
    expect(screen.getByText("Account Information")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Company Name")).toBeInTheDocument();
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("allows entering company name and submitting without error", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <MemoryRouter>
          <CreateAccountPage />
        </MemoryRouter>
      </ToastProvider>
    );

    const companyInput = screen.getByPlaceholderText("Enter Company Name");
    await user.type(companyInput, "Acme Corporation");
    expect(companyInput).toHaveValue("Acme Corporation");

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);
  });
});

