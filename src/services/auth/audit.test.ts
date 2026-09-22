import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const QUEUE_KEY = "tranzpay.auth.audit_queue";
const NOW = new Date("2026-07-10T12:00:00Z");

// audit.ts keeps module-level flush state and the queue store hydrates at
// load, so each test gets fresh modules.
const loadAudit = async () => await import("./audit");

describe("maskUsername", () => {
  it("masks emails to first chars of local part, domain, and the TLD", async () => {
    const { maskUsername } = await loadAudit();

    expect(maskUsername("jdoe@example.com")).toBe("j***@e***.com");
    expect(maskUsername("  Merchant.Admin@sub.example.co ")).toBe("M***@s***.co");
  });

  it("masks non-email usernames to the first char", async () => {
    const { maskUsername } = await loadAudit();

    expect(maskUsername("portaluser")).toBe("p***");
    expect(maskUsername("x")).toBe("x***");
  });

  it("handles empty and degenerate values without leaking them", async () => {
    const { maskUsername } = await loadAudit();

    expect(maskUsername("")).toBe("***");
    expect(maskUsername("   ")).toBe("***");
    expect(maskUsername("user@")).toBe("u***");
  });
});

describe("recordAuthEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("queues the event with an ISO occurredAt stamp", async () => {
    const { recordAuthEvent } = await loadAudit();
    const { peekAuditQueue } = await import("../../store/auditQueueStore");

    recordAuthEvent({ event: "login_success", usernameMasked: "t***@e***.com" });

    expect(peekAuditQueue()).toEqual([
      {
        event: "login_success",
        usernameMasked: "t***@e***.com",
        occurredAt: "2026-07-10T12:00:00.000Z",
      },
    ]);
  });

  it("never persists secrets or raw identifiers", async () => {
    const { recordAuthEvent, maskUsername } = await loadAudit();

    recordAuthEvent({
      event: "login_failure",
      usernameMasked: maskUsername("test.user@example.com"),
      detail: { failedCount: 1 },
    });

    const raw = localStorage.getItem(QUEUE_KEY) ?? "";
    expect(raw).not.toContain("test.user@example.com");
    expect(raw).not.toMatch(/password|accessToken|access_token/i);
  });

  it("never throws even when storage is unavailable", async () => {
    const { recordAuthEvent } = await loadAudit();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => recordAuthEvent({ event: "logout" })).not.toThrow();
  });
});

describe("flushAuditQueue", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("keeps events buffered while the transport stub reports unavailable", async () => {
    const { recordAuthEvent, flushAuditQueue } = await loadAudit();
    const { peekAuditQueue } = await import("../../store/auditQueueStore");

    recordAuthEvent({ event: "session_expired", detail: { reason: "expired" } });
    await flushAuditQueue();

    expect(peekAuditQueue()).toHaveLength(1);
  });

  it("is single-flight: concurrent callers share one promise", async () => {
    const { flushAuditQueue } = await loadAudit();

    const first = flushAuditQueue();
    const second = flushAuditQueue();

    expect(first).toBe(second);
    await first;
  });
});
