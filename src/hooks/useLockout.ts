import { useEffect, useMemo, useState } from "react";
import {
  getLockoutStatus,
  subscribeLockout,
  usernameKey,
  type LockoutStatus,
} from "../store/lockoutStore";

const TICK_MS = 1_000;

export interface LockoutView {
  locked: boolean;
  /** Ticks down while locked; null otherwise. */
  msRemaining: number | null;
  lockedUntil: number | null;
  /** Consecutive failures so far — powers the last-attempt warning. */
  failedCount: number;
}

const deriveViewFromStatus = (status: LockoutStatus): LockoutView =>
  status.locked
    ? {
        locked: true,
        msRemaining: status.msRemaining,
        lockedUntil: status.lockedUntil,
        failedCount: 0,
      }
    : { locked: false, msRemaining: null, lockedUntil: null, failedCount: status.failedCount };

/**
 * Live lockout state for a username, following the useSessionExpiry
 * discipline: always derived from the absolute lockedUntil against
 * Date.now() — ticks are never accumulated, so timer clamping and laptop
 * sleep can't skew it (visibilitychange/focus force a recompute on wake).
 * Flips to unlocked at expiry without a reload; updates cross-tab via the
 * lockout store's storage subscription.
 */
export function useLockout(username: string): LockoutView {
  // Key the effect on the normalized identity so retyping the same email
  // (or trailing whitespace) doesn't tear the timer down and up.
  const normalizedUsernameKey = useMemo(() => usernameKey(username), [username]);

  const [lockoutView, setLockoutView] = useState<LockoutView>(() =>
    deriveViewFromStatus(getLockoutStatus(username)),
  );

  useEffect(() => {
    let tickTimer: ReturnType<typeof setTimeout> | null = null;

    const recompute = () => {
      if (tickTimer) {
        clearTimeout(tickTimer);
        tickTimer = null;
      }

      const nextView = deriveViewFromStatus(getLockoutStatus(username));
      setLockoutView(nextView);

      if (nextView.locked) {
        tickTimer = setTimeout(recompute, TICK_MS);
      }
    };

    const unsubscribe = subscribeLockout(recompute);
    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("focus", recompute);
    recompute();

    return () => {
      if (tickTimer) clearTimeout(tickTimer);
      unsubscribe();
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("focus", recompute);
    };
    // `username` is intentionally represented by its normalized key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedUsernameKey]);

  return lockoutView;
}
