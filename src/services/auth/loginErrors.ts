// The single seam that interprets a failed /token call. When the backend
// ships server-enforced lockout (the real PCI DSS 8.3.4 control), its
// contract is verified against — and if needed adjusted in — this one file;
// everything downstream (loginApi, useLockout, LoginPage) already handles
// the "locked" outcome.
import { isAxiosError } from "axios";

export type LoginFailureKind =
  /** 400/401/403 from /token — counts toward the lockout policy. */
  | { kind: "invalid-credentials" }
  /** 423 or 429 — server-declared lockout. Dormant until the backend ships it. */
  | { kind: "locked"; retryAfterMs: number | null }
  /** Network error, timeout, 5xx, or a non-axios error (e.g. a response-shape
   *  parse failure). MUST NOT count toward lockout — an outage or a backend
   *  contract bug must never lock merchants out. */
  | { kind: "unavailable" };

const INVALID_CREDENTIAL_STATUSES = new Set([400, 401, 403]);
const LOCKED_STATUSES = new Set([423, 429]);

/** Parses Retry-After (RFC 9110): delta-seconds ("1800") or an HTTP-date. */
function parseRetryAfterMs(header: unknown, now: number): number | null {
  if (typeof header !== "string" || header.trim() === "") return null;
  const headerValue = header.trim();

  const isWholeSecondsForm = /^\d+$/.test(headerValue);
  if (isWholeSecondsForm) return Number(headerValue) * 1000;

  const retryAtEpochMs = new Date(headerValue).getTime();
  const isFutureDate = Number.isFinite(retryAtEpochMs) && retryAtEpochMs > now;
  if (isFutureDate) return retryAtEpochMs - now;

  return null;
}

export function classifyLoginError(err: unknown, now: number = Date.now()): LoginFailureKind {
  if (!isAxiosError(err) || !err.response) return { kind: "unavailable" };

  const { status, headers } = err.response;
  if (LOCKED_STATUSES.has(status)) {
    return { kind: "locked", retryAfterMs: parseRetryAfterMs(headers?.["retry-after"], now) };
  }
  if (INVALID_CREDENTIAL_STATUSES.has(status)) {
    return { kind: "invalid-credentials" };
  }
  return { kind: "unavailable" };
}

/**
 * Thrown by loginApi instead of making a network call when the account is
 * locked (locally counted or server-declared). LoginPage renders the
 * countdown from the lockout store, not from this error.
 */
export class LoginLockedError extends Error {
  readonly lockedUntil: number;
  readonly source: "local" | "server";

  constructor(lockedUntil: number, source: "local" | "server") {
    super("Account temporarily locked after too many failed sign-in attempts.");
    this.name = "LoginLockedError";
    this.lockedUntil = lockedUntil;
    this.source = source;
  }
}
