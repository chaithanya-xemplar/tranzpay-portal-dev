# Auth module

Single-source-of-truth session handling for the portal, plus login lockout
(PCI DSS 4.0.1 req 8.3.4) and auth audit logging.

## Which file does what

```
types.ts        Shared types: StoredSession, SessionEndReason, AuthAuditEvent
storage.ts      localStorage adapter — one JSON key ("tranzpay.auth.session"), zod-validated
tokenStore.ts   The session store: in-memory cache + subscribe() (same-tab AND cross-tab)
auth.ts         loginApi() — lockout gate → POST /token → store session → audit. Also logout()
session.ts      endSession() — the ONLY way a session ends — and the token-refresh seam
loginErrors.ts  classifyLoginError() — turns a failed /token call into a typed outcome
audit.ts        recordAuthEvent(), maskUsername(), flushAuditQueue(), transport seam

../../store/lockoutStore.ts     Zustand store: failed-attempt counter + 30-min lockout per username
../../store/auditQueueStore.ts  Zustand store: buffered audit events waiting for a backend endpoint
../../hooks/useLockout.ts       React hook: live lockout view for a username (countdown, cross-tab)
```

## Ground rules

- **Never read or write auth localStorage directly.** Go through `tokenStore`
  or the store functions (`getLockoutStatus`, `recordFailedAttempt`, ...).
  Direct access breaks the in-memory cache and cross-tab sync.
- **Never end a session yourself.** Call `endSession(reason)` — it audits once,
  clears the store, stamps the one-shot banner flag, and hard-redirects to
  `/login`. The full page reload is what wipes the React Query cache.
- **Import cycle rule:** `session.ts`, `audit.ts`, and the two Zustand stores
  must never import `../http/clients.ts` (clients imports them). When a seam
  needs HTTP, use bare `axios` or `navigator.sendBeacon`.
- `expires_in` from `/token` should be OAuth2 numeric **seconds** (RFC 6749).
  `resolveExpiresAt()` in `auth.ts` also tolerates the ISO-datetime string the
  auth API currently sends.

## How the lockout works today

All the knobs live in one place — `AUTH_POLICY` in `src/constants/constants.ts`:

| Variable              | Value       | Meaning                                          |
| --------------------- | ----------- | ------------------------------------------------ |
| `MAX_FAILED_ATTEMPTS` | `3`         | The 3rd consecutive failed login locks the user  |
| `LOCKOUT_DURATION_MS` | 30 minutes  | How long the lock lasts                          |
| `CLIENT_LOCKOUT_MODE` | `"enforce"` | Who creates lockouts — see the flip below        |

The flow, in plain terms:

1. User submits the login form. `loginApi()` first calls
   `getLockoutStatus(userName)`. If locked, it throws `LoginLockedError`
   **without any network call**, and the page shows a ticking countdown.
2. If not locked, it POSTs to `/token`. On success: `clearLockout(userName)` —
   the counter resets.
3. On failure, `classifyLoginError(err)` decides what kind of failure it was:
   - `"invalid-credentials"` (HTTP 400/401/403) → `recordFailedAttempt(userName)`.
     If that was the 3rd strike, the store sets `lockedUntil` and the UI locks.
   - `"locked"` (HTTP 423/429 — a *server*-declared lockout, dormant until the
     backend supports it) → `recordServerLockout(userName, retryAfterMs)`.
   - `"unavailable"` (network error, timeout, 5xx, malformed response) →
     **counts for nothing**. An outage must never lock merchants out.
4. `useLockout(username)` keeps the login page live: countdown ticks, unlocks
   at expiry without a reload, and reacts to other tabs.

**Honest limitation:** this is UX and defense-in-depth only. Anyone can clear
localStorage or curl the API. The real PCI 8.3.4 control is server-side
lockout on `/token` — until that ships, we are not compliant on this point.

**Deliberate UX decisions (don't "fix" these):**
- No numeric "2 attempts remaining" is ever shown — it gives attackers pacing
  info. The only escalation is `LAST_ATTEMPT_WARNING` on the final attempt.
- The failure copy stays generic and fires for nonexistent usernames too, so
  the UI never confirms whether an account exists.

## How audit logging works today

`recordAuthEvent()` fires for: `login_success`, `login_failure`,
`login_blocked_locked`, `lockout_start`, `logout`, `session_expired`,
`session_unauthorized`.

Every event is PII-minimal by construction: the username goes through
`maskUsername()` (`jdoe@example.com` → `j***@e***.com`), and passwords, tokens,
PANs, and raw errors are never included. Events buffer in `auditQueueStore`
(capped at 50, oldest dropped) because there is no backend endpoint yet;
`flushAuditQueue()` runs after every event and once on app mount, and becomes a
real drain the day the transport is filled in.

**Client events are telemetry, not evidence** — they live in the user's
browser and can be forged or deleted. PCI 10.2.x is satisfied by the auth
server logging `/token` traffic itself.

---

# When a backend API ships — exact changes

Each integration below is intentionally tiny. Everything downstream (UI, hooks,
stores, tests) already handles the outcome.

## 1. Server-enforced lockout  → 1 flag, maybe 1 function

The frontend already speaks a contract; ask the backend to match it:

```
POST /token  → 423 Locked  (or 429)
Retry-After: 1800            ← seconds, or an HTTP-date; optional
```

Steps:

1. Compare what the backend actually returns against `classifyLoginError()` in
   `loginErrors.ts`. If it matches the contract above, change nothing here.
   If it differs (different status code, lockout info in the JSON body, etc.),
   adjust **only this function** so it returns
   `{ kind: "locked", retryAfterMs }`.
2. In `src/constants/constants.ts`, flip:

   ```ts
   CLIENT_LOCKOUT_MODE: "enforce"      // before
   CLIENT_LOCKOUT_MODE: "mirror-only"  // after
   ```

   From then on the local counter only *mirrors* server lockouts (telemetry);
   it stops creating its own.
3. That's it. `recordServerLockout()`, the countdown UI, and the
   `source: "server"` audit detail already work — they're tested against the
   dormant branch.

Also ask the backend team for enumeration resistance: identical error shape
and response timing for "wrong password" vs "no such user".

## 2. Audit ingestion endpoint  → 1 function

Open `audit.ts`, find the stub at the bottom:

```ts
async function sendAuditEvents(events: AuthAuditEvent[]): Promise<boolean> {
  void events;
  return false; // no ingestion endpoint yet — events stay queued
}
```

Replace the body with a real send, e.g.:

```ts
async function sendAuditEvents(events: AuthAuditEvent[]): Promise<boolean> {
  // bare axios / sendBeacon on purpose — never authClient (import cycle),
  // and teardown events race the hard redirect, so keepalive matters.
  const res = await axios.post(`${import.meta.env.VITE_API_AUTH_URL}/auth-events`, events);
  return res.status < 300;
}
```

Return `true` = the batch is deleted from the queue; `false`/throw = events
stay buffered and retry on the next auth event or app mount. Everything queued
before the endpoint existed flushes automatically.

## 3. Logout / token revoke  → 1 function

Open `auth.ts`, find:

```ts
export const logout = () => {
  // TODO: call the server revoke endpoint (with the refresh token, once it exists)
  endSession("logout");
};
```

Add the revoke call above `endSession("logout")` (fire-and-forget is fine —
teardown must not block on the network). The `logout` audit event already
fires inside `endSession`.

## 4. Refresh tokens  → follow the numbered list

Main work is filling `refreshAccessToken()` in `session.ts` (bare axios) and
changing the `SessionExpiryModal` button to "Stay signed in" →
`attemptRefresh()`. Full checklist:

1. Confirm the contract: `POST {VITE_API_AUTH_URL}/token/refresh` with
   `{ refresh_token }` returning
   `{ access_token, expires_in (seconds), token_type?, refresh_token? }`;
   the `/token` login response gains `refresh_token`.
2. `auth.ts`: add `refresh_token: z.string().optional()` to
   `loginResponseSchema`; pass it into `StoredSession.refreshToken` in `loginApi`.
3. Fill `refreshAccessToken()` in `session.ts` using **bare axios** and reuse
   `resolveExpiresAt` + a response schema. Downstream already works:
   single-flight dedupe (`attemptRefresh`), store update, the 401 retry-once
   branch in `clients.ts`, and expiry-timer reset via `tokenStore.subscribe`.
4. `SessionExpiryModal`: primary action becomes "Stay signed in" →
   `attemptRefresh()`; on `null`, `endSession("expired")`.
5. Optional: refresh proactively at the warning boundary instead of on 401.
6. `logout()`: revoke with the refresh token before `endSession`.
7. Security review: a refresh token in localStorage is XSS-exposed — prefer
   httpOnly-cookie rotation backend-side; `SessionStorageAdapter` is the swap
   point.
8. Tests: un-stub refresh in `session.test.ts`; the 401 → refresh → retry-once
   path in `clients.test.ts` already covers the live branch.
