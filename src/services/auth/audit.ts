// Client-side auth audit trail (login success/failure, lockout, teardown).
// Supplementary telemetry only — PCI DSS 10.2.x is satisfied by the auth
// server logging /token traffic itself; these events are user-tamperable and
// must never be treated as evidence. Events buffer in auditQueueStore until
// the backend ships an ingestion endpoint (transport seam below).
//
// MUST NOT import ../http/clients or ./session — session.ts imports this
// module (keeps the import graph acyclic).
import type { AuthAuditEvent } from "./types";
import { enqueueAuditEvent, peekAuditQueue, dropAuditEvents } from "../../store/auditQueueStore";

/**
 * "jdoe@example.com" → "j***@e***.com"; non-email → first char + "***".
 * Raw usernames never enter an audit event or storage.
 */
export function maskUsername(username: string): string {
  const trimmedUsername = username.trim();
  if (!trimmedUsername) return "***";

  const atSignIndex = trimmedUsername.indexOf("@");
  const looksLikeAnEmail = atSignIndex > 0 && atSignIndex < trimmedUsername.length - 1;
  if (looksLikeAnEmail) {
    const domain = trimmedUsername.slice(atSignIndex + 1);
    const lastDotIndex = domain.lastIndexOf(".");
    const topLevelDomain = lastDotIndex > 0 ? domain.slice(lastDotIndex) : "";
    return `${trimmedUsername[0]}***@${domain[0]}***${topLevelDomain}`;
  }
  return `${trimmedUsername[0]}***`;
}

/**
 * Records an auth event: queue it and kick a flush. Fire-and-forget — an
 * audit failure must never break login/logout, so every path swallows.
 */
export function recordAuthEvent(input: Omit<AuthAuditEvent, "occurredAt">): void {
  try {
    const event: AuthAuditEvent = { ...input, occurredAt: new Date().toISOString() };
    enqueueAuditEvent(event);
    if (import.meta.env.DEV) {
      // Already-sanitized shape (see types.ts) — consistent with the
      // sanitized-logging convention in http/clients.ts.
      console.info("[auth-audit]", event);
    }
    void flushAuditQueue();
  } catch {
    // Swallow: telemetry only.
  }
}

let flushInFlight: Promise<void> | null = null;

/**
 * Drains the queue through the transport seam, oldest first. Single-flight;
 * never rejects. A no-op today (the stub reports the transport unavailable),
 * so events stay buffered until the backend ships.
 */
export function flushAuditQueue(): Promise<void> {
  if (!flushInFlight) {
    flushInFlight = sendQueuedEventsUntilEmpty()
      .catch(() => undefined)
      .finally(() => {
        flushInFlight = null;
      });
  }
  return flushInFlight;
}

async function sendQueuedEventsUntilEmpty(): Promise<void> {
  for (;;) {
    const pendingBatch = peekAuditQueue();
    if (pendingBatch.length === 0) return;

    const batchWasAccepted = await sendAuditEvents(pendingBatch);
    if (!batchWasAccepted) return; // transport unavailable — keep the queue intact

    dropAuditEvents(pendingBatch.length);
  }
}

/**
 * AUDIT TRANSPORT SEAM — the one function to fill when the backend ships an
 * auth-events ingestion endpoint (mirror of refreshAccessToken in session.ts).
 *
 * Expected backend contract:
 *   POST {VITE_API_AUTH_URL}/auth-events
 *   body: AuthAuditEvent[]  (oldest first)
 *   2xx  → return true (the batch is dropped from the queue)
 *
 * Use bare axios or navigator.sendBeacon here, NOT authClient (import cycle —
 * see module header). Teardown events (logout/expired/unauthorized) race the
 * hard redirect in endSession: prefer sendBeacon / fetch keepalive, or accept
 * the loss — the server logs those transitions independently.
 */
async function sendAuditEvents(events: AuthAuditEvent[]): Promise<boolean> {
  void events;
  return false; // no ingestion endpoint yet — events stay queued
}
