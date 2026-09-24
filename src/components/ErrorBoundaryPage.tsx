import type { FC } from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AxiosError } from "axios";

import { getErrorMessage } from "../utils/error";

export interface ErrorBoundaryPageProps {
  code?: string | number;
  title?: string;
  message?: string;
  error?: unknown;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onReload?: () => void;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  showReload?: boolean;
}

export const ErrorBoundaryPage: FC<ErrorBoundaryPageProps> = ({
  code,
  title,
  message,
  error,
  primaryActionLabel = "Go to Dashboard",
  secondaryActionLabel = "Go Back",
  onReload,
  onPrimaryClick,
  onSecondaryClick,
  showReload = true,
}) => {
  const navigate = useNavigate();
  let routeError: unknown = null;

  try {
    // Attempt to read router error if inside a route errorElement
    routeError = useRouteError();
  } catch {
    // Outside of Router context, ignore
  }

  const effectiveError = error ?? routeError;

  let derivedCode: string | number = code ?? "500";
  let derivedTitle = title ?? "API Request Failed";
  let derivedMessage = message ?? "An unexpected error occurred while communicating with the server.";

  if (effectiveError) {
    if (isRouteErrorResponse(effectiveError)) {
      derivedCode = effectiveError.status;
      derivedTitle =
        effectiveError.statusText ||
        (effectiveError.status === 404 ? "Page Not Found" : "Request Failed");
      derivedMessage =
        typeof effectiveError.data === "string"
          ? effectiveError.data
          : effectiveError.data?.message ||
            effectiveError.data?.detail ||
            derivedMessage;
    } else if (effectiveError instanceof AxiosError) {
      derivedCode = effectiveError.response?.status || effectiveError.code || "500";
      derivedTitle =
        effectiveError.response?.statusText ||
        (derivedCode === 500 ? "Internal Server Error" : "API Request Failed");
      derivedMessage = getErrorMessage(effectiveError);
    } else if (effectiveError instanceof Error) {
      derivedMessage = effectiveError.message || derivedMessage;
      if ("status" in effectiveError && typeof (effectiveError as { status: unknown }).status === "number") {
        derivedCode = (effectiveError as { status: number }).status;
      }
    }
  }

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  const handlePrimary = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    } else {
      navigate("/");
    }
  };

  const handleSecondary = () => {
    if (onSecondaryClick) {
      onSecondaryClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 text-red-600 p-3.5 rounded-full shadow-sm">
            <AlertTriangle size={30} />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 tracking-tight font-mono">
          {derivedCode}
        </h1>

        {/* Title */}
        <h2 className="mt-3 text-xl font-semibold text-gray-800">
          {derivedTitle}
        </h2>

        {/* Message */}
        <p className="mt-2 text-gray-500 text-sm leading-relaxed break-words">
          {derivedMessage}
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {showReload && (
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-black text-white hover:bg-gray-800 transition cursor-pointer shadow-sm"
            >
              <RefreshCw size={15} />
              Reload
            </button>
          )}
          <button
            type="button"
            onClick={handleSecondary}
            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryPage;

