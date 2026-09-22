import { type ReactNode } from "react";
import clsx from "clsx";
import Icon from "./Icon";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-success-bg border-success/30 text-success",
  error: "bg-error-bg border-error/30 text-error",
  warning: "bg-warning-bg border-warning/30 text-warning",
  info: "bg-primary_light2 border-primary/30 text-primary",
};

const variantIcons: Record<AlertVariant, ReactNode> = {
  success: <Icon name="check-circle" size={18} />,
  error: <Icon name="alert-circle" size={18} />,
  warning: <Icon name="warning" size={18} />,
  info: <Icon name="info" size={18} />,
};

export default function Alert({
  children,
  variant = "info",
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium",
        variantStyles[variant],
        className
      )}
    >
      <span className="shrink-0 mt-0.5">{variantIcons[variant]}</span>
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:opacity-70 transition"
          aria-label="Dismiss"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
