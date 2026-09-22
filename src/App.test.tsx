import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tokenStore } from "./services/auth/tokenStore";

// Mock router
vi.mock("./router", () => ({
  AppRouter: () => <div>App Router</div>,
}));

// Mock spinner
vi.mock("./design-system/GlobalSpinner", () => ({
  default: () => <div>Global Spinner</div>,
}));

// Mock session manager (exercised in its own test file)
vi.mock("./components/session/SessionManager", () => ({
  default: () => <div>Session Manager</div>,
}));

// Mock API
vi.mock("./services/profile/profileApi", () => ({
  getUserInfo: vi.fn(),
}));

vi.mock("./services/auth/tokenStore", () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
  },
}));

describe("App", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();

    vi.clearAllMocks();
    vi.mocked(tokenStore.getAccessToken).mockReturnValue(null);
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  };

  it("renders router, session manager, and spinner", () => {
    const { getByText } = renderApp();

    expect(getByText("App Router")).toBeInTheDocument();
    expect(getByText("Session Manager")).toBeInTheDocument();
    expect(getByText("Global Spinner")).toBeInTheDocument();
  });

  it("prefetches user info when a fresh session exists", () => {
    vi.mocked(tokenStore.getAccessToken).mockReturnValue("fake-jwt-token");

    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    renderApp();

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: ["userInfo"],
      queryFn: expect.any(Function),
    });
  });

  it("does not prefetch user info without a session", () => {
    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

    renderApp();

    expect(prefetchSpy).not.toHaveBeenCalled();
  });
});
