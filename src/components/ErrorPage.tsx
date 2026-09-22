import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  code?: string;
  title?: string;
  message?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

const ErrorPage: FC<ErrorPageProps> = ({
  code = "404",
  title = "Page not found",
  message = "Sorry, we couldn’t find the page you’re looking for.",
  primaryActionLabel = "Go to Dashboard",
  secondaryActionLabel = "Go Back",
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl p-8 text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 text-red-600 p-3 rounded-full">
            <AlertTriangle size={28} />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
          {code}
        </h1>

        {/* Title */}
        <h2 className="mt-3 text-xl font-semibold text-gray-800">
          {title}
        </h2>

        {/* Message */}
        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={onPrimaryClick || (() => navigate("/"))}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-black text-white hover:bg-gray-800 transition"
          >
            {primaryActionLabel}
          </button>

          <button
            onClick={onSecondaryClick || (() => navigate(-1))}
            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            {secondaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;