import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";
import ErrorBoundaryPage from "./ErrorBoundaryPage";

describe("ErrorBoundaryPage", () => {
  it("renders with custom code, title, message and a reload button", async () => {
    const user = userEvent.setup();
    const handleReload = vi.fn();

    render(
      <MemoryRouter>
        <ErrorBoundaryPage
          code="500"
          title="Internal Server Error"
          message="Failed to fetch account records from server."
          onReload={handleReload}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Internal Server Error")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to fetch account records from server.")
    ).toBeInTheDocument();

    const reloadButton = screen.getByRole("button", { name: /reload/i });
    expect(reloadButton).toBeInTheDocument();
    await user.click(reloadButton);
    expect(handleReload).toHaveBeenCalledTimes(1);
  });

  it("extracts status code and error message from AxiosError", () => {
    const mockResponse: AxiosResponse = {
      data: {
        detail: "API gateway timeout while contacting auth service",
      },
      status: 504,
      statusText: "Gateway Timeout",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    const axiosError = new AxiosError(
      "Request failed with status code 504",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      mockResponse
    );

    render(
      <MemoryRouter>
        <ErrorBoundaryPage error={axiosError} />
      </MemoryRouter>
    );

    expect(screen.getByText("504")).toBeInTheDocument();
    expect(screen.getByText("Gateway Timeout")).toBeInTheDocument();
    expect(
      screen.getByText("API gateway timeout while contacting auth service")
    ).toBeInTheDocument();
  });

  it("catches errors in component tree via ErrorBoundary and displays reload button", async () => {
    const ProblemChild = () => {
      throw new Error("Critical database connection failure");
    };

    // Suppress console.error in test output for intentional error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(
      screen.getByText("Critical database connection failure")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});

