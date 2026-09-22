import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import { tokenStore } from "../../services/auth/tokenStore";
import { AUTH_CONSTANTS } from "../../constants/constants";
import { LoginLockedError } from "../../services/auth/loginErrors";
import { lockoutStore, recordFailedAttempt } from "../../store/lockoutStore";

// Mutable holder so individual tests can vary the mutation state; the
// factory is hoisted but only dereferences this at render time.
const loginState: { mutate: ReturnType<typeof vi.fn>; isPending: boolean; error: Error | null } = {
  mutate: vi.fn(),
  isPending: false,
  error: null,
};

vi.mock("../../hooks/useLogin", () => ({
  default: () => ({ ...loginState }),
}));

vi.mock("../../services/auth/tokenStore", () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
  },
}));

const renderLoginPage = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    lockoutStore.setState({ records: {} });
    loginState.error = null;
    loginState.isPending = false;
    vi.mocked(tokenStore.getAccessToken).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typeUsername = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText(AUTH_CONSTANTS.ENTER_YOUR_USERNAME), {
      target: { value },
    });

  const signInButton = () => screen.getByRole("button", { name: /sign in/i });

  it("redirects home when a fresh session already exists (expiry-aware check)", () => {
    vi.mocked(tokenStore.getAccessToken).mockReturnValue("fake-jwt-token");

    renderLoginPage();

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("shows the session-expired banner once and consumes the reason flag", () => {
    sessionStorage.setItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY, "expired");

    renderLoginPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      AUTH_CONSTANTS.SESSION_EXPIRED_MESSAGE
    );
    // One-shot: consumed immediately so a manual reload won't re-show it
    expect(sessionStorage.getItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY)).toBeNull();
  });

  it("shows the signed-out banner for an unauthorized teardown", () => {
    sessionStorage.setItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY, "unauthorized");

    renderLoginPage();

    expect(screen.getByRole("alert")).toHaveTextContent(
      AUTH_CONSTANTS.SIGNED_OUT_MESSAGE
    );
  });

  it("shows no banner after a voluntary logout", () => {
    renderLoginPage();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("lockout UI", () => {
    const NOW = new Date("2026-07-10T12:00:00Z");

    const lockUser = (username: string) => {
      recordFailedAttempt(username);
      recordFailedAttempt(username);
      recordFailedAttempt(username);
    };

    it("typing a locked username shows the countdown alert, disables submit, keeps inputs usable", () => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
      lockUser("locked.user@example.com");

      renderLoginPage();
      typeUsername("locked.user@example.com");

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(AUTH_CONSTANTS.ACCOUNT_LOCKED_MESSAGE);
      expect(alert).toHaveTextContent("30:00");
      expect(signInButton()).toBeDisabled();
      // Per-username lockout: the user may switch to another account.
      expect(screen.getByPlaceholderText(AUTH_CONSTANTS.ENTER_YOUR_USERNAME)).toBeEnabled();
      expect(screen.getByPlaceholderText(AUTH_CONSTANTS.PASSWORD)).toBeEnabled();
    });

    it("clears the lockout UI when a different username is typed", () => {
      lockUser("locked.user@example.com");

      renderLoginPage();
      typeUsername("locked.user@example.com");
      expect(signInButton()).toBeDisabled();

      typeUsername("other.user@example.com");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(signInButton()).toBeEnabled();
    });

    it("shows only the generic message for a plain failure — never an attempts count", () => {
      loginState.error = new Error("Request failed with status code 401");
      recordFailedAttempt("test.user@example.com");

      renderLoginPage();
      typeUsername("test.user@example.com");

      expect(screen.getByText(AUTH_CONSTANTS.INVALID_CREDENTIALS)).toBeInTheDocument();
      expect(screen.queryByText(AUTH_CONSTANTS.LAST_ATTEMPT_WARNING)).not.toBeInTheDocument();
      expect(screen.queryByText(/attempts? remaining/i)).not.toBeInTheDocument();
      expect(signInButton()).toBeEnabled();
    });

    it("warns on the last remaining attempt before lockout", () => {
      loginState.error = new Error("Request failed with status code 401");
      recordFailedAttempt("test.user@example.com");
      recordFailedAttempt("test.user@example.com");

      renderLoginPage();
      typeUsername("test.user@example.com");

      expect(screen.getByText(AUTH_CONSTANTS.INVALID_CREDENTIALS)).toBeInTheDocument();
      expect(screen.getByText(AUTH_CONSTANTS.LAST_ATTEMPT_WARNING)).toBeInTheDocument();
    });

    it("the lockout alert supersedes the generic error box after the locking failure", () => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
      lockUser("locked.user@example.com");
      loginState.error = new LoginLockedError(NOW.getTime() + 30 * 60_000, "local");

      renderLoginPage();
      typeUsername("locked.user@example.com");

      expect(screen.getByRole("alert")).toHaveTextContent(AUTH_CONSTANTS.ACCOUNT_LOCKED_MESSAGE);
      expect(screen.queryByText(AUTH_CONSTANTS.INVALID_CREDENTIALS)).not.toBeInTheDocument();
    });

    it("does not show the logout banner while locked", () => {
      sessionStorage.setItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY, "expired");
      lockUser("locked.user@example.com");

      renderLoginPage();
      typeUsername("locked.user@example.com");

      expect(screen.getByRole("alert")).toHaveTextContent(AUTH_CONSTANTS.ACCOUNT_LOCKED_MESSAGE);
      expect(screen.queryByText(AUTH_CONSTANTS.SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
    });
  });
});
