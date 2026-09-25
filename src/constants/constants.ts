import type { SelectOption } from "../design-system/select/Select";

import salesIcon from "../assets/icon-sales-stats.svg";
import ccSalesIcon from "../assets/icon-cc-sales.svg";
import salesLastMonthIcon from "../assets/icon-sales-last-month.svg";
import lastTransactionIcon from "../assets/icon-last-transaction.svg";
import lastMonthTransactionsIcon from "../assets/icon-last-month-transactions.svg";
import currentMonthTransactionsIcon from "../assets/icon-current-month-transactions.svg";

export const AUTH_CONSTANTS = {
    SING_IN: "Sign In",
    SING_UP: "Sign Up",
    USERNAME: "Username",
    PASSWORD: "Password",
    ENTER_YOUR_USERNAME: "Enter your username",
    ENTER_YOUR_PASSWORD: "Enter your password",
    FORGOT_PASSWORD: "Forgot your password?",
    DONT_HAVE_AN_ACCOUNT: "Don’t have an account?",
    NEED_HELP: "Need Help?",
    VISIT_SUPPORT: "Visit Support",
    GO_BACK: "Go Back",
    RESET_PASSWORD_MESSAGE: "Enter your account's email and username, and we'll send you a link to reset your password.",
    EMAIL: "Email",
    ENTER_YOUR_EMAIL: "Enter your email",
    SEND_RECOVERY_LINK: "SEND RECOVERY LINK",
    FORGOT_PASSWORD_TITLE: "Forgot Password",
    SUBMIT: "Submit",
    RESET_PASSWORD: "Reset Password",
    NEW_PASSWORD: "New Password",
    ENTER_NEW_PASSWORD: "Enter a new password",
    CONFIRM_PASSWORD: "Confirm Password",
    RE_ENTER_NEW_PASSWORD: "Re-enter your new password",
    ACCESS_TOKEN_KEY: "access_token",
    INVALID_CREDENTIALS: "Please check your username/password.",
    ACCESS_TOKEN_EXPIRY: "access_token_expires_at",
    SESSION_STORAGE_KEY: "tranzpay.auth.session",
    LOGOUT_REASON_KEY: "tranzpay.auth.logout_reason",
    LOCKOUT_STORAGE_KEY: "tranzpay.auth.lockout",
    AUDIT_QUEUE_KEY: "tranzpay.auth.audit_queue",
    SESSION_EXPIRED_MESSAGE: "Your session has expired. Please sign in again.",
    SIGNED_OUT_MESSAGE: "You were signed out. Please sign in again.",
    ACCOUNT_LOCKED_MESSAGE: "Too many failed sign-in attempts. Try again in",
    LAST_ATTEMPT_WARNING: "Another failed attempt will temporarily lock your account for 30 minutes."
}

/**
 * PCI DSS 4.0.1 login policy (req 8.3.4). Client-side enforcement is UX /
 * defense-in-depth only — the server-side lockout on /token is the real
 * control. Do NOT surface numeric attempts-remaining counts in the UI
 * (product decision: no pacing hints for attackers).
 */
export const AUTH_POLICY = {
  /** Lock when consecutive failures reach this count (the 3rd failure locks). */
  MAX_FAILED_ATTEMPTS: 3,
  LOCKOUT_DURATION_MS: 30 * 60_000,
  /**
   * "enforce"     = the client counter creates lockouts (backend has none yet).
   * "mirror-only" = only server 423/429 responses create lockouts; the counter
   *                 keeps tracking for telemetry. Flip when the backend ships.
   */
  CLIENT_LOCKOUT_MODE: "enforce" as "enforce" | "mirror-only",
} as const;
/* ------------------------------------------------------------------ */
/* Dummy API Response (for development)                                */
/* ------------------------------------------------------------------ */

// Dashboard Icon Mapping

export const DASHBOARD_ICON_MAP: Record<string, string> = {
  "Sales This Month": salesIcon,
  "Last Transaction": lastTransactionIcon,
  "Credit Card Sales": ccSalesIcon,
  "Sales Last Month": salesLastMonthIcon,
  "Last Month Transactions": lastMonthTransactionsIcon,
  "Current Month Transactions": currentMonthTransactionsIcon,
};

export const TIME_ZONES = [
    "Pacific",
    "Mountain",
    "Eastern",
    "Central",
    "Hawaii"
]

export const US_STATES = [
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" },
] as const;
export type USStateOption = (typeof US_STATES)[number];

export const MASTER_ROLES = [
  { roleId: 1, roleName: "Subscriber" },
  { roleId: 2, roleName: "Impersonator" },
  { roleId: 3, roleName: "Viewer" },
  { roleId: 4, roleName: "Administrator" },
  { roleId: 5, roleName: "Editor" },
  { roleId: 6, roleName: "Operator" },
];

export const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { label: "All", value: "All" },
  { label: "Processing Profile", value: "Producer" },
  { label: "Company", value: "Corp" },
  { label: "Merchant", value: "Merchant" },
];

export const dummyData = {
        processorsData: {
            "columns": [
            { "id": "processor", "header": "Processor" },
            { "id": "abbreviation", "header": "Abbreviation" },
            { "id": "ach", "header": "ACH" },
            { "id": "cc", "header": "CC" }
            ],
            "data": [
            { "processor": "Tranzpay", "abbreviation": "TPY", "ach": "X", "cc": "" },
            { "processor": "TSYS", "abbreviation": "TSYS", "ach": "", "cc": "X" },
            { "processor": "FirstData**", "abbreviation": "FD", "ach": "", "cc": "X" },
            { "processor": "Fiserv", "abbreviation": "FISERV", "ach": "", "cc": "X" },
            { "processor": "PaymentXP", "abbreviation": "PXP", "ach": "X", "cc": "X" },
            { "processor": "NMI", "abbreviation": "NMI", "ach": "", "cc": "X" }
            ]
        },
      }