import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../../schemas/loginSchema";
import { Link, Navigate, useNavigate } from "react-router-dom";
import userIcon from "../../assets/user-icon.svg";
import passwordIcon from "../../assets/password-icon.svg";
import { SUPPORT_URL, SIGNUP_URL } from "../../constants/links";
import { AUTH_CONSTANTS, AUTH_POLICY } from "../../constants/constants";
import Button from "../../design-system/Button";
import Alert from "../../design-system/Alert";
import AuthLayout from "../../components/AuthLayout";
import useLogin from "../../hooks/useLogin";
import { useLockout } from "../../hooks/useLockout";
import { tokenStore } from "../../services/auth/tokenStore";
import { LoginLockedError } from "../../services/auth/loginErrors";
import { formatMsAsMinSec } from "../../utils/formatters";

const LOGOUT_REASON_MESSAGES: Record<string, string> = {
  expired: AUTH_CONSTANTS.SESSION_EXPIRED_MESSAGE,
  unauthorized: AUTH_CONSTANTS.SIGNED_OUT_MESSAGE,
};

const LoginPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();
  // Per-username lockout, live: re-evaluates as the user types (or autofill
  // fills) and ticks while locked. loginApi re-checks at submit regardless.
  const lockout = useLockout(watch("username") ?? "");

  // One-shot: endSession stamps why the session ended before the hard
  // redirect lands here; consume the flag so a manual reload won't re-show it.
  const [logoutMessage, setLogoutMessage] = useState<string | null>(() => {
    const reason = sessionStorage.getItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY);
    if (!reason) return null;
    sessionStorage.removeItem(AUTH_CONSTANTS.LOGOUT_REASON_KEY);
    return LOGOUT_REASON_MESSAGES[reason] ?? null;
  });

  const onSubmit = (data: LoginFormData) => {
    if (lockout.locked) return; // belt-and-braces; loginApi re-checks anyway
    login({ userName: data.username, password: data.password } , {
      onSuccess: () => {
        navigate("/dashboard"); // ✅ now data is already ready
      },
    });
  };

  // Already signed in → go home
  if (tokenStore.getAccessToken()) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold mb-4 text-black">
        {AUTH_CONSTANTS.SING_IN}
      </h2>

      {/* Message precedence: lockout > login failure > logout/expiry banner */}
      {lockout.locked && (
        <Alert variant="error" className="mb-3">
          {AUTH_CONSTANTS.ACCOUNT_LOCKED_MESSAGE}{" "}
          <span className="font-semibold tabular-nums">
            {formatMsAsMinSec(lockout.msRemaining ?? 0)}
          </span>
          .
        </Alert>
      )}

      {error && !(error instanceof LoginLockedError) && !lockout.locked && (
        <div className="mb-3 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          {AUTH_CONSTANTS.INVALID_CREDENTIALS ?? "Please check your username/password."}
          {lockout.failedCount === AUTH_POLICY.MAX_FAILED_ATTEMPTS - 1 && (
            <p className="mt-1 font-medium">{AUTH_CONSTANTS.LAST_ATTEMPT_WARNING}</p>
          )}
        </div>
      )}

      {logoutMessage && !error && !lockout.locked && (
        <Alert
          variant="warning"
          className="mb-3"
          onDismiss={() => setLogoutMessage(null)}
        >
          {logoutMessage}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3"
        aria-busy={isPending ? "true" : undefined}
      >
        <div>
          <label className="block text-sm pb-1 text-light-grey">
            {AUTH_CONSTANTS.USERNAME}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <img src={userIcon} alt="User Icon" className="h-5 w-5" />
            </span>
            <input
              {...register("username")}
              placeholder={AUTH_CONSTANTS.ENTER_YOUR_USERNAME}
              autoComplete="off"
              disabled={isPending}
              className={`input-base pl-10 bg-divider2 ${
                errors.username ? "error" : ""
              } ${isPending ? "opacity-80 cursor-not-allowed" : ""}`}
            />
          </div>
          {errors.username && (
            <p className="text-error text-sm mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm pb-1 text-light-grey">
            {AUTH_CONSTANTS.PASSWORD}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <img src={passwordIcon} alt="Lock Icon" className="h-5 w-5" />
            </span>
            <input
              type="password"
              {...register("password")}
              placeholder={AUTH_CONSTANTS.PASSWORD}
              autoComplete="off"
              disabled={isPending}
              className={`input-base pl-10 bg-divider2 ${
                errors.password ? "error" : ""
              } ${isPending ? "opacity-80 cursor-not-allowed" : ""}`}
            />
          </div>
          {errors.password && (
            <p className="text-error text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="text-right text-sm pb-2">
          <Link
            to="/forgot-password"
            className="text-secondary font-semibold text-base hover:underline"
          >
            {AUTH_CONSTANTS.FORGOT_PASSWORD}
          </Link>
        </div>

        {/* Inputs stay enabled while locked — the lockout is per-username,
            so the user may sign in with a different account. */}
        <Button type="submit" disabled={isPending || lockout.locked} className="w-full py-2 h-12">
          {AUTH_CONSTANTS.SING_IN.toUpperCase()}
        </Button>
      </form>

      <div className="text-center mt-4 pb-4 border-b border-dotted border-light-grey">
        {AUTH_CONSTANTS.DONT_HAVE_AN_ACCOUNT}
        <a
          href={SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline pl-1"
        >
          {AUTH_CONSTANTS.SING_UP}
        </a>
      </div>

      <div className="text-center text-base mt-4">
        {AUTH_CONSTANTS.NEED_HELP}
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary font-semibold hover:underline pl-1"
        >
          {AUTH_CONSTANTS.VISIT_SUPPORT}
        </a>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;