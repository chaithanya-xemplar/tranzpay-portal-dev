import { z } from "zod";
import { authClient } from "../http/clients";
import { tokenStore } from "./tokenStore";
import { endSession } from "./session";
import { classifyLoginError, LoginLockedError } from "./loginErrors";
import { maskUsername, recordAuthEvent } from "./audit";
import {
  clearLockout,
  getLockoutStatus,
  recordFailedAttempt,
  recordServerLockout,
} from "../../store/lockoutStore";

export interface LoginPayload {
  userName: string;
  password: string;
}

const loginResponseSchema = z.looseObject({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.union([z.string(), z.number()]).optional(),
  scope: z.string().optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

const FALLBACK_TTL_MS = 15 * 60 * 1000;
const MAX_PLAUSIBLE_TTL_SECONDS = 10 * 365 * 24 * 3600;

/**
 * The contract is OAuth2 numeric seconds (RFC 6749 §5.1), but the auth API
 * currently sends an ISO datetime string — accept both during the
 * transition. Unusable values fall back to a 15-minute window.
 */
export function resolveExpiresAt(expiresIn: unknown, now: number = Date.now()): number {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return now + expiresIn * 1000;
  }
  if (typeof expiresIn === "string") {
    const seconds = Number(expiresIn);
    // Bounded so an epoch-ms-as-string is not misread as seconds.
    if (Number.isFinite(seconds) && seconds > 0 && seconds < MAX_PLAUSIBLE_TTL_SECONDS) {
      return now + seconds * 1000;
    }
    const timestamp = new Date(expiresIn).getTime();
    if (Number.isFinite(timestamp) && timestamp > now) {
      return timestamp;
    }
  }
  return now + FALLBACK_TTL_MS;
}

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  // Client-side lockout gate (PCI DSS 8.3.4 UX/defense-in-depth — the
  // server-side lockout is the real control). No network call while locked.
  const lockout = getLockoutStatus(payload.userName);
  if (lockout.locked) {
    recordAuthEvent({
      event: "login_blocked_locked",
      usernameMasked: maskUsername(payload.userName),
      detail: { lockedUntil: lockout.lockedUntil, source: lockout.source },
    });
    throw new LoginLockedError(lockout.lockedUntil, lockout.source);
  }

  // Make sure no stale session survives a re-login attempt
  tokenStore.clear();

  try {
    const { data } = await authClient.post<unknown>("/token", payload);
    const parsed = loginResponseSchema.parse(data);

    tokenStore.set({
      accessToken: parsed.access_token,
      tokenType: parsed.token_type ?? "Bearer",
      expiresAt: resolveExpiresAt(parsed.expires_in),
      refreshToken: null, // populated once the refresh backend ships
    });

    clearLockout(payload.userName);
    recordAuthEvent({
      event: "login_success",
      usernameMasked: maskUsername(payload.userName),
    });

    return parsed;
  } catch (err) {
    const failure = classifyLoginError(err);

    if (failure.kind === "invalid-credentials") {
      const after = recordFailedAttempt(payload.userName);
      recordAuthEvent({
        event: "login_failure",
        usernameMasked: maskUsername(payload.userName),
        detail: { failedCount: after.locked ? undefined : after.failedCount },
      });
      if (after.locked) {
        recordAuthEvent({
          event: "lockout_start",
          usernameMasked: maskUsername(payload.userName),
          detail: { lockedUntil: after.lockedUntil, source: "local" },
        });
        throw new LoginLockedError(after.lockedUntil, "local");
      }
    } else if (failure.kind === "locked") {
      // Server-declared lockout (dormant until the backend ships it).
      const mirrored = recordServerLockout(payload.userName, failure.retryAfterMs);
      recordAuthEvent({
        event: "lockout_start",
        usernameMasked: maskUsername(payload.userName),
        detail: { lockedUntil: mirrored.locked ? mirrored.lockedUntil : undefined, source: "server" },
      });
      if (mirrored.locked) throw new LoginLockedError(mirrored.lockedUntil, "server");
    }
    // "unavailable" (network/5xx/malformed success response) never counts
    // toward lockout — an outage must not lock merchants out.
    throw err;
  }
};

export const logout = () => {
  // TODO: call the server revoke endpoint (with the refresh token, once it exists)
  endSession("logout");
};
