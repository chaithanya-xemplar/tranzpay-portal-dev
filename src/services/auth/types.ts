export interface StoredSession {
  accessToken: string;
  /** Scheme used in the Authorization header. Defaults to "Bearer" at login. */
  tokenType: string;
  /** Absolute expiry, epoch ms — normalized from the /token response at login. */
  expiresAt: number;
  /** Reserved for the refresh-token rollout; always null until the auth backend ships it. */
  refreshToken: string | null;
}

export type SessionEndReason = "logout" | "unauthorized" | "expired";

export interface SessionStorageAdapter {
  read(): StoredSession | null;
  write(session: StoredSession): void;
  clear(): void;
}

export type AuthAuditEventType =
  | "login_success"
  | "login_failure"
  | "login_blocked_locked"
  | "lockout_start"
  | "logout"
  | "session_expired"
  | "session_unauthorized";

/**
 * Client-side auth telemetry (PCI DSS 10.2.x is satisfied server-side; these
 * events are supplementary, never the audit system of record). PII-minimal by
 * construction — deliberately absent: userId, passwords, tokens, IPs, raw
 * usernames, raw errors.
 */
export interface AuthAuditEvent {
  event: AuthAuditEventType;
  /** ISO 8601. */
  occurredAt: string;
  /** Masked via maskUsername() — NEVER the raw username. */
  usernameMasked?: string;
  detail?: {
    failedCount?: number;
    lockedUntil?: number;
    source?: "local" | "server";
    /** SessionEndReason for teardown events. */
    reason?: string;
  };
}
