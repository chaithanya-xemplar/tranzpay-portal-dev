import { useEffect, useState } from "react";
import { tokenStore } from "../services/auth/tokenStore";
import { endSession } from "../services/auth/session";

const CLOCK_SKEW_MS = 5_000;
const TICK_MS = 1_000;
const DEFAULT_WARN_BEFORE_MS = 2 * 60_000;

export type SessionExpiryStatus = "no-session" | "active" | "warning";

export interface SessionExpiry {
  status: SessionExpiryStatus;
  msRemaining: number | null;
  /** Identifies which session the countdown belongs to (e.g. for dismiss tracking). */
  expiresAt: number | null;
}

const NO_SESSION: SessionExpiry = { status: "no-session", msRemaining: null, expiresAt: null };

/**
 * Tracks the stored session's expiry: "active" until warnBeforeMs before
 * expiry, then "warning" with a ticking msRemaining, then endSession("expired").
 * Always derived from the absolute expiresAt against Date.now() — ticks are
 * never accumulated, so timer clamping and laptop sleep can't skew it
 * (visibilitychange/focus force a recompute on wake).
 */
export function useSessionExpiry(warnBeforeMs: number = DEFAULT_WARN_BEFORE_MS): SessionExpiry {
  const [state, setState] = useState<SessionExpiry>(NO_SESSION);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const recompute = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      const session = tokenStore.getSession();
      if (!session) {
        setState(NO_SESSION);
        return;
      }

      // Count down against the effective expiry (skew-adjusted) so the
      // displayed countdown reaches 0 exactly when the session ends.
      const msRemaining = session.expiresAt - CLOCK_SKEW_MS - Date.now();
      if (msRemaining <= 0) {
        setState(NO_SESSION);
        endSession("expired");
        return;
      }

      if (msRemaining <= warnBeforeMs) {
        setState({ status: "warning", msRemaining, expiresAt: session.expiresAt });
        timer = setTimeout(recompute, TICK_MS);
      } else {
        setState({ status: "active", msRemaining, expiresAt: session.expiresAt });
        timer = setTimeout(recompute, msRemaining - warnBeforeMs);
      }
    };

    const unsubscribe = tokenStore.subscribe(recompute);
    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("focus", recompute);
    recompute();

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, [warnBeforeMs]);

  return state;
}
