import { useEffect, useState } from "react";
import { tokenStore } from "../../services/auth/tokenStore";
import { endSession, navigation } from "../../services/auth/session";
import { useSessionExpiry } from "../../hooks/useSessionExpiry";
import SessionExpiryModal from "./SessionExpiryModal";

/**
 * Rendered once at App root. Hosts the session-expiry warning and keeps
 * this tab consistent with auth changes made in other tabs.
 */
const SessionManager = () => {
  const { status, msRemaining, expiresAt } = useSessionExpiry();
  const [dismissedForExpiresAt, setDismissedForExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    return tokenStore.subscribe((session, origin) => {
      // Local set/clear is handled by its initiator (login flow, endSession);
      // only mirror what OTHER tabs do.
      if (origin !== "cross-tab") return;
      if (!session) {
        endSession("logout");
      } else if (window.location.pathname === "/login") {
        navigation.toHome();
      }
    });
  }, []);

  const open =
    status === "warning" &&
    msRemaining !== null &&
    dismissedForExpiresAt !== expiresAt;

  return (
    <SessionExpiryModal
      open={open}
      msRemaining={msRemaining ?? 0}
      onLogInAgain={() => endSession("expired")}
      onDismiss={() => setDismissedForExpiresAt(expiresAt)}
    />
  );
};

export default SessionManager;
