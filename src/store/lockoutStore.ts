// Per-username failed-login tracking and lockout (PCI DSS 4.0.1 req 8.3.4),
// implemented as a persisted vanilla Zustand store so it is readable outside
// React (loginApi pre-check, interceptors) and via useStore in hooks.
//
// Client-side only — bypassable by clearing localStorage, so this is UX and
// defense-in-depth; the server-side lockout on /token is the compliance
// control. Nothing security-critical may trust these records (fail-open on
// corruption is deliberate).
//
// Security posture of the persisted payload:
//  - usernames are stored only as FNV-1a hashes (obfuscation, not security)
//  - the envelope is zod-validated on hydration; corrupt/forged data self-purges
//  - unknown schema versions are discarded, never merged
//  - record count is capped and stale records pruned on every write
//
// MUST NOT import ../services/http/clients or ../services/auth/session
// (keeps the import graph acyclic).
import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { z } from "zod";
import { AUTH_CONSTANTS, AUTH_POLICY } from "../constants/constants";

const lockoutRecordSchema = z.object({
  failedCount: z.number().int().nonnegative(),
  /** Epoch ms; null while counting (not locked). */
  lockedUntil: z.number().nullable(),
  source: z.enum(["local", "server"]).default("local"),
  updatedAt: z.number(),
});

const recordsSchema = z.record(z.string(), lockoutRecordSchema);

type LockoutRecord = z.infer<typeof lockoutRecordSchema>;

interface LockoutState {
  records: Record<string, LockoutRecord>;
}

export type LockoutStatus =
  | { locked: false; failedCount: number }
  | { locked: true; lockedUntil: number; msRemaining: number; source: "local" | "server" };

/** Prune records untouched for this long; bounds growth on shared machines. */
const RECORD_TTL_MS = 2 * AUTH_POLICY.LOCKOUT_DURATION_MS;
const MAX_RECORDS = 20;
const STORE_VERSION = 1;

/**
 * Storage key for a username. FNV-1a 32-bit — obfuscation of the username at
 * rest, NOT security: anyone who can read this key can also delete the
 * record. Sync on purpose (Web Crypto is async and would poison the
 * keystroke/submit-time checks). 32-bit collisions merely share a counter —
 * fail-closed, acceptable.
 */
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function usernameKey(username: string): string {
  const normalizedUsername = username.trim().toLowerCase();
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < normalizedUsername.length; i++) {
    hash ^= normalizedUsername.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// What zustand/persist writes to localStorage. Validated before hydration so
// forged or corrupt payloads are purged instead of merged into state.
const persistedEnvelopeSchema = z.object({
  state: z.object({ records: recordsSchema }),
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
      // Corrupt/forged data: purge and fail open — the server is the real control.
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

export const lockoutStore = createStore<LockoutState>()(
  persist(() => ({ records: {} }), {
    name: AUTH_CONSTANTS.LOCKOUT_STORAGE_KEY,
    version: STORE_VERSION,
    storage: createJSONStorage(() => validatedStorage),
    // A version bump means the shape changed on purpose: discard, never merge.
    migrate: () => ({ records: {} }),
  }),
);

function dropStaleRecordsAndCap(
  records: Record<string, LockoutRecord>,
  now: number,
): Record<string, LockoutRecord> {
  const freshRecords = Object.entries(records).filter(
    ([, record]) => now - record.updatedAt <= RECORD_TTL_MS,
  );
  freshRecords.sort(([, a], [, b]) => b.updatedAt - a.updatedAt); // newest first
  return Object.fromEntries(freshRecords.slice(0, MAX_RECORDS));
}

function deriveStatusFromRecord(record: LockoutRecord | undefined, now: number): LockoutStatus {
  if (!record) return { locked: false, failedCount: 0 };

  if (record.lockedUntil !== null && now < record.lockedUntil) {
    return {
      locked: true,
      lockedUntil: record.lockedUntil,
      msRemaining: record.lockedUntil - now,
      source: record.source,
    };
  }
  // Lazy expiry: an elapsed lockout reads as unlocked; the record is reset
  // on the next write for this username.
  return { locked: false, failedCount: record.failedCount };
}

export function getLockoutStatus(username: string, now: number = Date.now()): LockoutStatus {
  return deriveStatusFromRecord(lockoutStore.getState().records[usernameKey(username)], now);
}

/**
 * Records one consecutive failure. In "enforce" mode the count reaching
 * MAX_FAILED_ATTEMPTS sets lockedUntil; in "mirror-only" mode the counter
 * tracks for telemetry but only recordServerLockout can lock.
 * Returns the post-increment status.
 */
export function recordFailedAttempt(username: string, now: number = Date.now()): LockoutStatus {
  const storageKey = usernameKey(username);
  const previousRecord = lockoutStore.getState().records[storageKey];

  // A failure after an expired lockout starts a fresh counting window.
  const previousLockHasExpired =
    previousRecord !== undefined &&
    previousRecord.lockedUntil !== null &&
    now >= previousRecord.lockedUntil;
  const failedCount = previousLockHasExpired ? 1 : (previousRecord?.failedCount ?? 0) + 1;

  const thisFailureLocksTheAccount =
    AUTH_POLICY.CLIENT_LOCKOUT_MODE === "enforce" &&
    failedCount >= AUTH_POLICY.MAX_FAILED_ATTEMPTS;

  const updatedRecord: LockoutRecord = {
    failedCount,
    lockedUntil: thisFailureLocksTheAccount ? now + AUTH_POLICY.LOCKOUT_DURATION_MS : null,
    source: "local",
    updatedAt: now,
  };
  lockoutStore.setState((state) => ({
    records: dropStaleRecordsAndCap({ ...state.records, [storageKey]: updatedRecord }, now),
  }));
  return deriveStatusFromRecord(updatedRecord, now);
}

/** Mirrors a server-declared lockout locally (both modes). */
export function recordServerLockout(
  username: string,
  retryAfterMs: number | null,
  now: number = Date.now(),
): LockoutStatus {
  const storageKey = usernameKey(username);
  const lockDurationMs = retryAfterMs ?? AUTH_POLICY.LOCKOUT_DURATION_MS;
  const updatedRecord: LockoutRecord = {
    failedCount: lockoutStore.getState().records[storageKey]?.failedCount ?? 0,
    lockedUntil: now + lockDurationMs,
    source: "server",
    updatedAt: now,
  };
  lockoutStore.setState((state) => ({
    records: dropStaleRecordsAndCap({ ...state.records, [storageKey]: updatedRecord }, now),
  }));
  return deriveStatusFromRecord(updatedRecord, now);
}

/** Successful login (or a future admin unlock) removes the record. */
export function clearLockout(username: string): void {
  const storageKey = usernameKey(username);
  if (!(storageKey in lockoutStore.getState().records)) return;
  lockoutStore.setState((state) => {
    const remainingRecords = { ...state.records };
    delete remainingRecords[storageKey];
    return { records: remainingRecords };
  });
}

let storageListenerRegistered = false;

// Another tab changed the lockout state: re-hydrate (validated) so this
// tab's store reflects it. A cleared key or full localStorage.clear() means
// the state is gone — reset rather than trust stale memory.
function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== AUTH_CONSTANTS.LOCKOUT_STORAGE_KEY) return;
  if (event.key === null || event.newValue === null) {
    lockoutStore.setState({ records: {} });
    return;
  }
  void lockoutStore.persist.rehydrate();
}

/**
 * Fires on lockout state changes, including cross-tab ones (native storage
 * event → validated rehydrate). Returns unsubscribe. React consumers should
 * prefer useStore(lockoutStore, ...) — see useLockout.
 */
export function subscribeLockout(listener: () => void): () => void {
  if (!storageListenerRegistered) {
    window.addEventListener("storage", handleStorageEvent);
    storageListenerRegistered = true;
  }
  return lockoutStore.subscribe(listener);
}
