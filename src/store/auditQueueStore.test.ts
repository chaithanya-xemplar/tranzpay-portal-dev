import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthAuditEvent } from "../services/auth/types";

const QUEUE_KEY = "tranzpay.auth.audit_queue";

// Fresh store per test: the module hydrates from localStorage at load.
const loadStore = async () => await import("./auditQueueStore");

const makeEvent = (overrides: Partial<AuthAuditEvent> = {}): AuthAuditEvent => ({
  event: "login_failure",
  occurredAt: "2026-07-10T12:00:00.000Z",
  usernameMasked: "t***@e***.com",
  ...overrides,
});

type PersistedEnvelope = { state: { queue: AuthAuditEvent[] }; version: number };

const readPersisted = (): PersistedEnvelope =>
  JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '{"state":{"queue":[]},"version":1}') as PersistedEnvelope;

describe("auditQueueStore", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("enqueues events and persists them oldest-first", async () => {
    const { enqueueAuditEvent, peekAuditQueue } = await loadStore();

    enqueueAuditEvent(makeEvent({ event: "login_failure" }));
    enqueueAuditEvent(makeEvent({ event: "login_success" }));

    expect(peekAuditQueue().map((e) => e.event)).toEqual(["login_failure", "login_success"]);
    expect(readPersisted().state.queue).toHaveLength(2);
  });

  it("caps the queue at 50, dropping the oldest", async () => {
    const { enqueueAuditEvent, peekAuditQueue } = await loadStore();

    for (let i = 0; i < 51; i++) {
      enqueueAuditEvent(makeEvent({ detail: { failedCount: i } }));
    }

    const queue = peekAuditQueue();
    expect(queue).toHaveLength(50);
    expect(queue[0].detail?.failedCount).toBe(1);
    expect(queue[49].detail?.failedCount).toBe(50);
  });

  it("dropAuditEvents removes from the front only", async () => {
    const { enqueueAuditEvent, dropAuditEvents, peekAuditQueue } = await loadStore();

    enqueueAuditEvent(makeEvent({ event: "login_failure" }));
    enqueueAuditEvent(makeEvent({ event: "lockout_start" }));
    enqueueAuditEvent(makeEvent({ event: "login_success" }));

    dropAuditEvents(2);
    expect(peekAuditQueue().map((e) => e.event)).toEqual(["login_success"]);

    dropAuditEvents(0);
    expect(peekAuditQueue()).toHaveLength(1);
  });

  it("hydrates a persisted queue on module load", async () => {
    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify({ state: { queue: [makeEvent()] }, version: 1 }),
    );
    const { peekAuditQueue } = await loadStore();

    expect(peekAuditQueue()).toHaveLength(1);
  });

  it("purges corrupt or forged payloads at hydration", async () => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify({ state: { queue: [{ event: "not-a-real-event" }] }, version: 1 }));
    const { peekAuditQueue } = await loadStore();

    expect(peekAuditQueue()).toEqual([]);
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });

  it("discards an unknown schema version instead of merging it", async () => {
    localStorage.setItem(
      QUEUE_KEY,
      JSON.stringify({ state: { queue: [makeEvent()] }, version: 0 }),
    );
    const { peekAuditQueue } = await loadStore();

    expect(peekAuditQueue()).toEqual([]);
  });
});
