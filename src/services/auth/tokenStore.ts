import { AUTH_CONSTANTS } from "../../constants/constants";
import { localStorageAdapter, purgeLegacySessionKeys } from "./storage";
import type { StoredSession } from "./types";

const CLOCK_SKEW_MS = 5_000;

/** "local" = this tab called set/clear; "cross-tab" = another tab changed storage. */
export type SessionChangeOrigin = "local" | "cross-tab";

type Listener = (session: StoredSession | null, origin: SessionChangeOrigin) => void;

let sessionInMemory: StoredSession | null = null;
let hydrated = false;
let storageListenerRegistered = false;
const listeners = new Set<Listener>();

purgeLegacySessionKeys();

function hydrate(): StoredSession | null {
  if (!hydrated) {
    sessionInMemory = localStorageAdapter.read();
    hydrated = true;
  }
  return sessionInMemory;
}

function notify(session: StoredSession | null, origin: SessionChangeOrigin): void {
  for (const listener of listeners) listener(session, origin);
}

function isFresh(session: StoredSession, now: number = Date.now()): boolean {
  return Number.isFinite(session.expiresAt) && now < session.expiresAt - CLOCK_SKEW_MS;
}

// Another tab wrote or cleared the session: drop the memory cache before
// notifying, so every reader sees the other tab's state.
function handleStorageEvent(event: StorageEvent): void {
  // key === null means localStorage.clear() was called somewhere.
  if (event.key !== null && event.key !== AUTH_CONSTANTS.SESSION_STORAGE_KEY) return;
  sessionInMemory = localStorageAdapter.read();
  hydrated = true;
  notify(sessionInMemory, "cross-tab");
}

function getSession(): StoredSession | null {
  return hydrate();
}

function getAccessToken(): string | null {
  const session = hydrate();
  if (!session) return null;
  if (!isFresh(session)) {
    clear();
    return null;
  }
  return session.accessToken;
}

function getExpiresAt(): number | null {
  return hydrate()?.expiresAt ?? null;
}

function getAuthHeader(): string | null {
  const session = hydrate();
  if (!session || !isFresh(session)) return null;
  return `${session.tokenType} ${session.accessToken}`;
}

function set(session: StoredSession): void {
  sessionInMemory = session;
  hydrated = true;
  localStorageAdapter.write(session);
  notify(session, "local");
}

function clear(): void {
  const hadSession = hydrate() !== null;
  sessionInMemory = null;
  hydrated = true;
  localStorageAdapter.clear();
  if (hadSession) notify(null, "local");
}

function subscribe(listener: Listener): () => void {
  if (!storageListenerRegistered) {
    window.addEventListener("storage", handleStorageEvent);
    storageListenerRegistered = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Single source of truth for the auth session. All reads/writes of the
 * stored token MUST go through this module — never touch localStorage
 * directly (in-memory cache and cross-tab sync depend on it).
 */
export const tokenStore = {
  /** Expiry-checked (5s clock skew); self-clears when expired. */
  getAccessToken,
  /** Raw session without the expiry self-clear — the expiry timer needs to observe an expired session. */
  getSession,
  getExpiresAt,
  /** "TokenType AccessToken" or null when there is no fresh session. */
  getAuthHeader,
  set,
  clear,
  /** Fires on same-tab set/clear and on cross-tab storage changes. Returns unsubscribe. */
  subscribe,
};
