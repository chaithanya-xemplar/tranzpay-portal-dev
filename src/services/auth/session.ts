// Session lifecycle: the single teardown path and the (stubbed) refresh
// seam. MUST NOT import ../http/clients — refreshAccessToken uses bare
// axios against VITE_API_AUTH_URL to keep the import graph acyclic
// (clients.ts imports this module).
import { AUTH_CONSTANTS } from "../../constants/constants";
import { tokenStore } from "./tokenStore";
import { recordAuthEvent } from "./audit";
import type { AuthAuditEventType, SessionEndReason, StoredSession } from "./types";

/**
 * Indirection over hard navigation so tests can spy on it
 * (jsdom's window.location.replace is not reliably spyable).
 */
export const navigation = {
  toLogin(): void {
    window.location.replace("/login");
  },
  toHome(): void {
    window.location.replace("/");
  },
};

let ending = false;

/**
 * The ONLY way a session ends — logout button, 401 interceptor, expiry
 * timer, cross-tab logout all land here. Idempotent: concurrent 401s or
 * a timer/401 race tear down exactly once. The hard redirect reloads the
 * page, wiping all in-memory state (React Query cache included).
 */
const TEARDOWN_AUDIT_EVENTS: Record<SessionEndReason, AuthAuditEventType> = {
  logout: "logout",
  expired: "session_expired",
  unauthorized: "session_unauthorized",
};

export function endSession(reason: SessionEndReason): void {
  if (ending) return;
  ending = true;
  // After the idempotency guard, so a 401 storm audits exactly once.
  recordAuthEvent({ event: TEARDOWN_AUDIT_EVENTS[reason], detail: { reason } });
  tokenStore.clear();
  if (reason !== "logout") {
    sessionStorage.setItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY, reason);
  }
  navigation.toLogin();
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Single-flight token refresh: concurrent callers share one promise.
 * Resolves the new access token, or null when refresh is unavailable
 * or fails (callers then fall through to endSession).
 */
export function attemptRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken()
      .then((session) => {
        if (session) {
          tokenStore.set(session);
          return session.accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * REFRESH SEAM — the one function to fill when the auth backend ships
 * refresh tokens (see src/services/auth/README.md for the full checklist).
 *
 * Expected backend contract:
 *   POST {VITE_API_AUTH_URL}/token/refresh
 *   body:     { refresh_token: string }
 *   response: { access_token: string, expires_in: number (seconds),
 *               token_type?: string, refresh_token?: string (rotation) }
 *   errors:   400/401 → refresh token invalid/revoked → session over
 *
 * Use bare axios here, NOT authClient (import cycle — see module header).
 */
async function refreshAccessToken(): Promise<StoredSession | null> {
  return null; // refresh not supported yet — callers fall through to endSession
}
