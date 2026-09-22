import { z } from "zod";
import { AUTH_CONSTANTS } from "../../constants/constants";
import type { SessionStorageAdapter, StoredSession } from "./types";

const storedSessionSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresAt: z.number(),
  refreshToken: z.string().nullable(),
}) satisfies z.ZodType<StoredSession>;

/**
 * Pre-refactor sessions used two separate keys ("access_token" /
 * "access_token_expires_at"). Purged once at load; those users re-login.
 */
export function purgeLegacySessionKeys(): void {
  localStorage.removeItem(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY);
}

export const localStorageAdapter: SessionStorageAdapter = {
  read(): StoredSession | null {
    const raw = localStorage.getItem(AUTH_CONSTANTS.SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      return storedSessionSchema.parse(JSON.parse(raw));
    } catch {
      localStorage.removeItem(AUTH_CONSTANTS.SESSION_STORAGE_KEY);
      return null;
    }
  },
  write(session: StoredSession): void {
    localStorage.setItem(AUTH_CONSTANTS.SESSION_STORAGE_KEY, JSON.stringify(session));
  },
  clear(): void {
    localStorage.removeItem(AUTH_CONSTANTS.SESSION_STORAGE_KEY);
  },
};
