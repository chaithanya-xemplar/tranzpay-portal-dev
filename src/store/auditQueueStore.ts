// Buffered client-side auth audit events (persisted Zustand store). Events
// queue here until the backend ships an ingestion endpoint, then flush via
// the transport seam in services/auth/audit.ts — nothing is lost across the
// gap. These records are user-tamperable telemetry, never PCI evidence; the
// auth server must log independently.
//
// Security posture of the persisted payload: PII-minimal events only (masked
// usernames — see types.ts), zod-validated on hydration with self-purge,
// unknown schema versions discarded, queue capped.
//
// MUST NOT import ../services/http/clients or ../services/auth/session
// (session.ts transitively imports this module).
import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { z } from "zod";
import { AUTH_CONSTANTS } from "../constants/constants";
import type { AuthAuditEvent } from "../services/auth/types";

const auditEventSchema = z.object({
  event: z.enum([
    "login_success",
    "login_failure",
    "login_blocked_locked",
    "lockout_start",
    "logout",
    "session_expired",
    "session_unauthorized",
  ]),
  occurredAt: z.string(),
  usernameMasked: z.string().optional(),
  detail: z
    .object({
      failedCount: z.number().optional(),
      lockedUntil: z.number().optional(),
      source: z.enum(["local", "server"]).optional(),
      reason: z.string().optional(),
    })
    .optional(),
}) satisfies z.ZodType<AuthAuditEvent>;

interface AuditQueueState {
  queue: AuthAuditEvent[];
}

/** Oldest events are dropped beyond this — bounded telemetry, not a ledger. */
const MAX_QUEUED_EVENTS = 50;
const STORE_VERSION = 1;

const persistedEnvelopeSchema = z.object({
  state: z.object({ queue: z.array(auditEventSchema) }),
  version: z.number(),
});

const validatedStorage: StateStorage = {
  getItem(name: string): string | null {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      persistedEnvelopeSchema.parse(JSON.parse(raw));
      return raw;
    } catch {
      // Corrupt/forged data: purge — client telemetry is expendable.
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem(name: string, value: string): void {
    localStorage.setItem(name, value);
  },
  removeItem(name: string): void {
    localStorage.removeItem(name);
  },
};

export const auditQueueStore = createStore<AuditQueueState>()(
  persist(() => ({ queue: [] as AuthAuditEvent[] }), {
    name: AUTH_CONSTANTS.AUDIT_QUEUE_KEY,
    version: STORE_VERSION,
    storage: createJSONStorage(() => validatedStorage),
    // A version bump means the shape changed on purpose: discard, never merge.
    migrate: () => ({ queue: [] as AuthAuditEvent[] }),
  }),
);

export function enqueueAuditEvent(event: AuthAuditEvent): void {
  auditQueueStore.setState((state) => ({
    queue: [...state.queue, event].slice(-MAX_QUEUED_EVENTS),
  }));
}

/** Snapshot of pending events, oldest first (the flush order). */
export function peekAuditQueue(): AuthAuditEvent[] {
  return auditQueueStore.getState().queue;
}

/** Removes the first `count` events after a successful send. */
export function dropAuditEvents(count: number): void {
  if (count <= 0) return;
  auditQueueStore.setState((state) => ({ queue: state.queue.slice(count) }));
}
