import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionManager from "./SessionManager";
import { useSessionExpiry, type SessionExpiry } from "../../hooks/useSessionExpiry";
import { tokenStore, type SessionChangeOrigin } from "../../services/auth/tokenStore";
import { endSession, navigation } from "../../services/auth/session";
import type { StoredSession } from "../../services/auth/types";

vi.mock("../../hooks/useSessionExpiry", () => ({
  useSessionExpiry: vi.fn(),
}));

vi.mock("../../services/auth/session", () => ({
  endSession: vi.fn(),
  navigation: {
    toLogin: vi.fn(),
    toHome: vi.fn(),
  },
}));

vi.mock("../../services/auth/tokenStore", () => ({
  tokenStore: {
    subscribe: vi.fn(),
  },
}));

type Listener = (session: StoredSession | null, origin: SessionChangeOrigin) => void;

const makeSession = (): StoredSession => ({
  accessToken: "fake-jwt-token",
  tokenType: "Bearer",
  expiresAt: Date.now() + 60_000,
  refreshToken: null,
});

const expiryState = (overrides: Partial<SessionExpiry> = {}): SessionExpiry => ({
  status: "active",
  msRemaining: 10 * 60_000,
  expiresAt: Date.now() + 10 * 60_000,
  ...overrides,
});

describe("SessionManager", () => {
  let capturedListener: Listener | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedListener = null;
    vi.mocked(tokenStore.subscribe).mockImplementation((listener: Listener) => {
      capturedListener = listener;
      return () => {};
    });
    vi.mocked(useSessionExpiry).mockReturnValue(expiryState());
  });

  it("shows no modal while the session is active", () => {
    render(<SessionManager />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the expiry modal with the countdown in the warning window", () => {
    vi.mocked(useSessionExpiry).mockReturnValue(
      expiryState({ status: "warning", msRemaining: 90_000 })
    );

    render(<SessionManager />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/1:30/)).toBeInTheDocument();
  });

  it("'Log in again' ends the session as expired", () => {
    vi.mocked(useSessionExpiry).mockReturnValue(
      expiryState({ status: "warning", msRemaining: 90_000 })
    );

    render(<SessionManager />);
    fireEvent.click(screen.getByRole("button", { name: /log in again/i }));

    expect(endSession).toHaveBeenCalledWith("expired");
  });

  it("dismiss hides the modal and it stays hidden for the same session", () => {
    vi.mocked(useSessionExpiry).mockReturnValue(
      expiryState({ status: "warning", msRemaining: 90_000, expiresAt: 12345 })
    );

    const { rerender } = render(<SessionManager />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Next tick of the same countdown — still dismissed
    vi.mocked(useSessionExpiry).mockReturnValue(
      expiryState({ status: "warning", msRemaining: 89_000, expiresAt: 12345 })
    );
    rerender(<SessionManager />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // A NEW session (different expiresAt) warns again
    vi.mocked(useSessionExpiry).mockReturnValue(
      expiryState({ status: "warning", msRemaining: 90_000, expiresAt: 99999 })
    );
    rerender(<SessionManager />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("mirrors a cross-tab logout", () => {
    render(<SessionManager />);

    capturedListener?.(null, "cross-tab");

    expect(endSession).toHaveBeenCalledWith("logout");
  });

  it("leaves /login when another tab logs in", () => {
    window.history.pushState({}, "", "/login");
    render(<SessionManager />);

    capturedListener?.(makeSession(), "cross-tab");

    expect(navigation.toHome).toHaveBeenCalledTimes(1);
    window.history.pushState({}, "", "/");
  });

  it("ignores local session changes (handled by their initiators)", () => {
    render(<SessionManager />);

    capturedListener?.(null, "local");
    capturedListener?.(makeSession(), "local");

    expect(endSession).not.toHaveBeenCalled();
    expect(navigation.toHome).not.toHaveBeenCalled();
  });
});
